# Flora infra

AWS CDK app (JavaScript). Stacks are added in later phases.

## Environment variables

| Variable       | Where                                  | Description                 |
| -------------- | -------------------------------------- | --------------------------- |
| `DATABASE_URL` | apps/api (local: `docker compose up -d db`) | Postgres connection string. |
| `EXPO_PUBLIC_API_MODE` | apps/mobile | Selects the mobile data client: `mock` (default) or `live`. |
| `PORT` | apps/api | Port the API listens on. Default `4000`. |
| `PLANT_ID_API_KEY` | apps/api | Plant.id recognition key. **Secret.** Blank = fixture-backed stub recognizer (no key, no network), which is the default for everyone not working on recognition. |
| `PLANT_ID_BASE_URL` | apps/api | Plant.id API root. Default `https://plant.id/api/v3`. |
| `FLORA_RECOGNITION_TIMEOUT_MS` | apps/api | Provider call ceiling. Default `45000` — must stay under the mobile client's 90s poll budget. |
| `FLORA_MAX_IMAGE_BYTES` | apps/api | Largest accepted image, decoded. Default `6291456`. Temporary: retire once images upload to S3 instead of crossing the API. |
| `FLORA_STUB_FIXTURE` | apps/api | Which canned response the stub replays: `healthy-basil`, `diseased-tomato` or `blurry`. |

### Secrets

`PLANT_ID_API_KEY` is the only secret so far. Rules:

- **Never `EXPO_PUBLIC_`-prefix it.** Expo inlines those into the JS bundle at
  build time, publishing the key to every user. It belongs to `apps/api` only.
- **Local development:** each teammate uses their own free-tier key in their own
  gitignored `.env`. Most of the team needs no key at all — the stub covers it.
- **Deployed environments:** store in AWS Secrets Manager / SSM Parameter Store
  and reference by ARN from the CDK stack. The value never appears in `infra/`.
- **If it leaks:** rotate it in the Plant.id dashboard. Rewriting git history
  does not un-share a key that has already been pushed and pulled.
