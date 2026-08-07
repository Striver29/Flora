const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Shared behavioural contract for any Flora client (mock today, live later).
 *
 * @param {() => object} makeClient fresh, isolated client per call
 * @param {object} [options]
 * @param {(promise: Promise<any>) => Promise<any>} [options.settle]
 *   wraps every client call; the mock suite advances fake timers past the
 *   simulated latency here. Defaults to identity for real-time clients.
 * @param {(ms: number) => Promise<void>} [options.wait]
 *   waits wall-clock time (fake-timer advance in the mock suite).
 */
export function runClientContract(
  makeClient,
  { settle = (promise) => promise, wait = (ms) => new Promise((r) => setTimeout(r, ms)) } = {},
) {
  describe('Flora client contract', () => {
    it('wraps reads in the ApiResponse envelope', async () => {
      const client = makeClient();
      const res = await settle(client.species.list());
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('exposes the seeded catalog and demo content', async () => {
      const client = makeClient();
      const species = await settle(client.species.list());
      expect(species.data).toHaveLength(10);
      const plants = await settle(client.plants.list());
      expect(plants.data).toHaveLength(6);
      const posts = await settle(client.posts.list());
      expect(posts.data).toHaveLength(12);
      expect(posts.data.filter((post) => post.type === 'HELP')).toHaveLength(1);
    });

    it('searches species by common or scientific name', async () => {
      const client = makeClient();
      const byCommon = await settle(client.species.search('basil'));
      expect(byCommon.ok).toBe(true);
      expect(byCommon.data.some((species) => species.id === 'sp1')).toBe(true);
      const byArabic = await settle(client.species.search('زيتون'));
      expect(byArabic.data.some((species) => species.id === 'sp4')).toBe(true);
      const blank = await settle(client.species.search('   '));
      expect(blank.error.code).toBe('VALIDATION');
    });

    it('creates a plant and rejects an invalid one with VALIDATION', async () => {
      const client = makeClient();
      const created = await settle(client.plants.create({ nickname: 'Testy', speciesId: 'sp1' }));
      expect(created.ok).toBe(true);
      expect(created.data.id).toBeTruthy();
      const invalid = await settle(client.plants.create({}));
      expect(invalid.ok).toBe(false);
      expect(invalid.error.code).toBe('VALIDATION');
    });

    it('markWatered schedules the next watering from species interval × zone multiplier', async () => {
      const client = makeClient();
      // p1 is basil (waterEveryDays 2) owned by a COASTAL user (multiplier 1) → 2 days
      const res = await settle(client.plants.markWatered('p1'));
      expect(res.ok).toBe(true);
      expect(Date.parse(res.data.nextDueAt) - Date.parse(res.data.wateredAt)).toBe(2 * DAY_MS);
      expect(Math.abs(Date.parse(res.data.wateredAt) - Date.now())).toBeLessThan(2000);
      const missing = await settle(client.plants.markWatered('nope'));
      expect(missing.ok).toBe(false);
      expect(missing.error.code).toBe('NOT_FOUND');
    });

    it('applies the climate zone multiplier of the logged-in user', async () => {
      const client = makeClient();
      await settle(client.auth.login({ username: 'ziad_bekaa', password: 'password123' }));
      // aloe (21 days) × BEKAA 0.8 = 16.8 → rounded to 17 days
      const created = await settle(client.plants.create({ nickname: 'Aloe B', speciesId: 'sp8' }));
      const res = await settle(client.plants.markWatered(created.data.id));
      expect(Date.parse(res.data.nextDueAt) - Date.parse(res.data.wateredAt)).toBe(17 * DAY_MS);
    });

    it('validates schedule input', async () => {
      const client = makeClient();
      const valid = await settle(
        client.schedules.create('p1', { type: 'FERTILIZE', intervalDays: 14 }),
      );
      expect(valid.ok).toBe(true);
      const badType = await settle(client.schedules.create('p1', { type: 'PRUNE' }));
      expect(badType.error.code).toBe('VALIDATION');
      const badInterval = await settle(
        client.schedules.create('p1', { type: 'WATER', intervalDays: 0 }),
      );
      expect(badInterval.error.code).toBe('VALIDATION');
    });

    it('runs the async diagnosis flow: PENDING, then COMPLETE after ~3s', async () => {
      const client = makeClient();
      client.setNextDiagnosisFixture?.('diseased-tomato');
      const created = await settle(
        client.diagnoses.create({ plantId: 'p2', imageUri: 'assets/demo/plant-2.jpg' }),
      );
      expect(created.ok).toBe(true);
      expect(created.data.status).toBe('PENDING');
      const early = await settle(client.diagnoses.get(created.data.id));
      expect(early.data.status).toBe('PENDING');
      await wait(3100);
      const done = await settle(client.diagnoses.get(created.data.id));
      expect(done.data.status).toBe('COMPLETE');
      expect(done.data.lowConfidence).toBe(false);
      if (client.setNextDiagnosisFixture) {
        expect(done.data.result.species[0].scientificName).toBe('Solanum lycopersicum');
        expect(done.data.result.health.isHealthy).toBe(false);
        expect(done.data.result.health.issues[0].name).toBe('Early blight');
      }
    });

    it('flags low-confidence diagnoses (confidence < 0.55)', async () => {
      const client = makeClient();
      if (!client.setNextDiagnosisFixture) return;
      client.setNextDiagnosisFixture('blurry');
      const created = await settle(
        client.diagnoses.create({ imageUri: 'assets/demo/plant-3.jpg' }),
      );
      await wait(3100);
      const done = await settle(client.diagnoses.get(created.data.id));
      expect(done.data.status).toBe('COMPLETE');
      expect(done.data.lowConfidence).toBe(true);
    });

    it('escalates a completed diagnosis into a HELP post', async () => {
      const client = makeClient();
      if (!client.setNextDiagnosisFixture) return;
      client.setNextDiagnosisFixture('diseased-tomato');
      const created = await settle(
        client.diagnoses.create({ imageUri: 'assets/demo/plant-2.jpg' }),
      );
      const tooEarly = await settle(client.diagnoses.escalate(created.data.id));
      expect(tooEarly.error.code).toBe('VALIDATION');
      await wait(3100);
      await settle(client.diagnoses.get(created.data.id));
      const post = await settle(client.diagnoses.escalate(created.data.id));
      expect(post.ok).toBe(true);
      expect(post.data.type).toBe('HELP');
      expect(post.data.attachment).toMatchObject({
        imageUri: 'assets/demo/plant-2.jpg',
        topIssue: 'Early blight',
        confidence: 0.84,
      });
      const helpFeed = await settle(client.posts.list({ type: 'HELP' }));
      expect(helpFeed.data.some((entry) => entry.id === post.data.id)).toBe(true);
    });

    it('creates posts and enforces body-or-images', async () => {
      const client = makeClient();
      const bodyOnly = await settle(client.posts.create({ body: 'Hello from the contract suite' }));
      expect(bodyOnly.ok).toBe(true);
      const empty = await settle(client.posts.create({}));
      expect(empty.error.code).toBe('VALIDATION');
      const whitespace = await settle(client.posts.create({ body: '   ' }));
      expect(whitespace.error.code).toBe('VALIDATION');
    });

    it('likes and comments on posts', async () => {
      const client = makeClient();
      // post4 has no seed likes, so the session user's like must increment the count
      const before = await settle(client.posts.get('post4'));
      const liked = await settle(client.posts.like('post4'));
      expect(liked.data.likeCount).toBe(before.data.likeCount + 1);
      const again = await settle(client.posts.like('post4'));
      expect(again.data.likeCount).toBe(liked.data.likeCount);
      const unliked = await settle(client.posts.unlike('post4'));
      expect(unliked.data.likeCount).toBe(before.data.likeCount);
      const comment = await settle(client.posts.comment('post4', 'Lovely plant!'));
      expect(comment.ok).toBe(true);
      const after = await settle(client.posts.get('post4'));
      expect(after.data.comments.some((entry) => entry.id === comment.data.id)).toBe(true);
      const blank = await settle(client.posts.comment('post4', '   '));
      expect(blank.error.code).toBe('VALIDATION');
    });

    it('follows and unfollows users', async () => {
      const client = makeClient();
      const follow = await settle(client.social.follow('u3'));
      expect(follow.data).toEqual({ following: true });
      const unfollow = await settle(client.social.unfollow('u3'));
      expect(unfollow.data).toEqual({ following: false });
      const missing = await settle(client.social.follow('ghost'));
      expect(missing.error.code).toBe('NOT_FOUND');
    });

    it('updates the profile climate zone via me.update', async () => {
      const client = makeClient();
      const updated = await settle(client.me.update({ climateZone: 'BEKAA' }));
      expect(updated.ok).toBe(true);
      expect(updated.data.user.climateZone).toBe('BEKAA');
      const invalid = await settle(client.me.update({ climateZone: 'DESERT' }));
      expect(invalid.error.code).toBe('VALIDATION');
    });

    it('validates device registration', async () => {
      const client = makeClient();
      const bad = await settle(client.devices.register({ pushToken: 'tok', platform: 'web' }));
      expect(bad.error.code).toBe('VALIDATION');
      const good = await settle(
        client.devices.register({ pushToken: 'ExponentPushToken[abc]', platform: 'android' }),
      );
      expect(good.data).toEqual({ registered: true });
    });

    it('handles the full auth lifecycle', async () => {
      const client = makeClient();
      const bad = await settle(
        client.auth.signup({ username: 'Bad Name', password: 'longenough1' }),
      );
      expect(bad.error.code).toBe('VALIDATION');
      const signup = await settle(
        client.auth.signup({ username: 'new_user_1', password: 'supersecret' }),
      );
      expect(signup.ok).toBe(true);
      const me = await settle(client.auth.me());
      expect(me.data.user.username).toBe('new_user_1');
      await settle(client.auth.logout());
      const anon = await settle(client.auth.me());
      expect(anon.data).toBeNull();
      const unauth = await settle(client.plants.list());
      expect(unauth.error.code).toBe('UNAUTHORIZED');
      const wrong = await settle(
        client.auth.login({ username: 'flora_demo', password: 'wrongpass' }),
      );
      expect(wrong.error.code).toBe('UNAUTHORIZED');
      const login = await settle(
        client.auth.login({ username: 'flora_demo', password: 'password123' }),
      );
      expect(login.ok).toBe(true);
      expect(login.data.user.id).toBe('u1');
    });
  });
}

describe('contract module', () => {
  it('exports a runner for client implementations', () => {
    expect(typeof runClientContract).toBe('function');
  });
});
