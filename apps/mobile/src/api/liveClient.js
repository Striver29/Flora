import { apiFetch } from './http.js';

/**
 * Live HTTP client — same interface as mockClient, backed by the Express API.
 *
 * Only `diagnoses.create` / `diagnoses.get` are implemented: those are the two
 * the Plant.id scan needs. Everything else still throws so that flipping
 * EXPO_PUBLIC_API_MODE=live fails loudly rather than half-working. To run the
 * real scanner against the rest of the mock app, use EXPO_PUBLIC_LIVE_SCAN=1
 * instead (see src/api/index.js).
 */
const notImplemented = (method) => async () => {
  throw new Error(
    `liveClient.${method} is not implemented yet — the Express API lands in a later phase`,
  );
};

export const liveClient = {
  auth: {
    signup: notImplemented('auth.signup'),
    login: notImplemented('auth.login'),
    logout: notImplemented('auth.logout'),
    me: notImplemented('auth.me'),
  },
  me: {
    update: notImplemented('me.update'),
  },
  species: {
    list: notImplemented('species.list'),
    search: notImplemented('species.search'),
    get: notImplemented('species.get'),
  },
  plants: {
    list: notImplemented('plants.list'),
    get: notImplemented('plants.get'),
    create: notImplemented('plants.create'),
    markWatered: notImplemented('plants.markWatered'),
    timeline: notImplemented('plants.timeline'),
    logs: {
      create: notImplemented('plants.logs.create'),
    },
  },
  schedules: {
    list: notImplemented('schedules.list'),
    create: notImplemented('schedules.create'),
  },
  diagnoses: {
    /**
     * Start a diagnosis. The image travels as base64 in the body — temporary,
     * until the presigned-S3 upload path lands and this becomes a key.
     * `imageUri` is accepted for interface parity with the mock and ignored.
     * @param {{imageBase64?: string, imageUri?: string, mode?: string, plantId?: string}} input
     */
    async create({ imageBase64, mode, plantId } = {}) {
      if (!imageBase64) {
        return {
          ok: false,
          error: {
            code: 'VALIDATION',
            message: 'No image data — the photo was captured without base64.',
          },
        };
      }
      return apiFetch('/diagnoses', {
        method: 'POST',
        body: { imageBase64, ...(mode && { mode }), ...(plantId && { plantId }) },
      });
    },

    /** @param {string} id */
    async get(id) {
      return apiFetch(`/diagnoses/${encodeURIComponent(id)}`);
    },

    // Both need plants/posts, which have no API yet.
    attach: notImplemented('diagnoses.attach'),
    escalate: notImplemented('diagnoses.escalate'),
  },
  feed: {
    list: notImplemented('feed.list'),
  },
  users: {
    get: notImplemented('users.get'),
    posts: notImplemented('users.posts'),
  },
  posts: {
    /**
     * Draft a post body from a diagnosis, a plant, or both.
     *
     * Plant details travel inline rather than as a plantId: the plants API does
     * not exist yet, and the client already holds everything the draft needs.
     * Nothing is created — the text comes back for the composer to prefill.
     * @param {{diagnosis?: object|null, plant?: object|null}} input
     */
    async draft(input = {}) {
      return apiFetch('/drafts/post', { method: 'POST', body: input });
    },
    list: notImplemented('posts.list'),
    get: notImplemented('posts.get'),
    create: notImplemented('posts.create'),
    comments: notImplemented('posts.comments'),
    like: notImplemented('posts.like'),
    unlike: notImplemented('posts.unlike'),
    comment: notImplemented('posts.comment'),
  },
  social: {
    follow: notImplemented('social.follow'),
    unfollow: notImplemented('social.unfollow'),
  },
  devices: {
    register: notImplemented('devices.register'),
  },
};
