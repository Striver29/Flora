# Flora — project guide

Monorepo (pnpm). apps/mobile = Expo RN app (BUILT FIRST, runs on a mock client).
apps/api = Express modular monolith. services/workers = Lambda handlers.
packages/shared = zod schemas + ApiResponse helpers. infra = AWS CDK.

## Language rule — read this first
- JavaScript ONLY. ES modules ("type": "module"). NO TypeScript: no .ts files,
  no tsconfig, no type-only packages. Do not scaffold TS even if a template defaults to it.
- Safety comes from: zod validation at every boundary + JSDoc @typedef for shared
  shapes (ApiResponse, RecognitionResult, SpeciesDto) + strict ESLint. Add JSDoc on
  exported functions in packages/shared and module service files.

## Conventions
- Every API response uses ApiResponse from @flora/shared: ok(data) / fail(code, message).
- API module layout: apps/api/src/modules/<name>/{routes.js, service.js, validators.js,
  __tests__/}. Routes stay thin; logic in service.js.
- Mobile screens NEVER call fetch directly — only the client interface in
  apps/mobile/src/api/ (mockClient or liveClient, chosen by EXPO_PUBLIC_API_MODE).
- Validate at the edge with zod. Schemas shared with mobile live in @flora/shared.
- DB access only through the shared Prisma client (apps/api/src/db.js).
- AWS SDK v3 only. Unit tests mock AWS with aws-sdk-client-mock and never hit real AWS
  or external APIs — use JSON fixtures in test/fixtures/.
- New env vars go in .env.example AND the table in infra/README.md, same commit.

## Commands
pnpm i · pnpm -F mobile start · pnpm -F mobile test · pnpm -F api dev · pnpm -F api test
pnpm lint · docker compose up -d db · pnpm -F api prisma migrate dev

## Done means
lint + tests green, .env.example updated, one scoped commit (feat(mobile): ...).
