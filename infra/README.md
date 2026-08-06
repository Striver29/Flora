# Flora infra

AWS CDK app (JavaScript). Stacks are added in later phases.

## Environment variables

| Variable       | Where                                  | Description                 |
| -------------- | -------------------------------------- | --------------------------- |
| `DATABASE_URL` | apps/api (local: `docker compose up -d db`) | Postgres connection string. |
| `EXPO_PUBLIC_API_MODE` | apps/mobile | Selects the mobile data client: `mock` (default) or `live`. |
