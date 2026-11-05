# URL Shortener

Paste a long URL, get a short link, see how many times each link was clicked.

## Tech Stack

```
url-shortener/
├── applications/web/    # React + React Router v7 (UI, routes, rate limiting, e2e tests)
└── libs/engine/         # Domain logic, repositories, DB schema/migrations, unit tests
```

| Technology                                        | Description                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [pnpm](https://pnpm.io/)                          | Fast, disk-efficient package manager with built-in monorepo support via workspaces                |
| [Turbo](https://turbo.build/)                     | High-performance build system for monorepos. Runs tasks in parallel and caches results            |
| [React](https://react.dev/)                       | Library for building user interfaces with components                                              |
| [React Router v7](https://reactrouter.com/)       | Full-stack React framework. Handles routing, data loading (loaders), mutations (actions), and SSR |
| [TypeScript](https://www.typescriptlang.org/)     | Typed superset of JavaScript for catching errors at compile time                                  |
| [Tailwind CSS](https://tailwindcss.com/)          | Utility-first CSS framework for rapid UI development                                              |
| [Vite](https://vite.dev/)                         | Fast build tool and dev server with hot module replacement                                        |
| [PostgreSQL](https://www.postgresql.org/)         | Persistent storage for links and click counters                                                   |
| [Drizzle ORM](https://orm.drizzle.team/)          | Type-safe SQL layer; `drizzle-kit` generates and runs migrations                                  |
| [Zod](https://zod.dev/)                           | URL validation                                                                                    |
| [Vitest](https://vitest.dev/)                     | Unit tests                                                                                        |
| [Playwright](https://playwright.dev/)             | End-to-end tests against a running app                                                            |

## Architecture

- `libs/engine/src/domain` — `Link`, the `LinkRepository` interface, domain errors, URL validation (`parseTargetUrl`).
- `libs/engine/src/link-service.ts` — use cases (`create`, `resolve`, `list`). Depends only on the `LinkRepository` interface.
- `libs/engine/src/infrastructure` — `DrizzleLinkRepository` (Postgres) and `InMemoryLinkRepository` (used in unit tests).
- `libs/engine/src/rate-limiter.ts` — small sliding-window limiter (mechanism only, no policy).
- `applications/web/app/.server/rate-limits.ts` — the rate-limit policy (limits per route) lives next to the routes that use it.
- Short codes are 7 random base62 characters. A code collision is handled by retrying the insert on a unique violation (no check-then-insert race).
- Clicks are counted with one atomic `UPDATE ... SET clicks = clicks + 1 RETURNING`.

## Abuse prevention

- Only `http`/`https` URLs; no embedded credentials; localhost, private, link-local and IPv6 hosts are rejected; max URL length is checked after normalization.
- Rate limits per client IP (`X-Forwarded-For`): 20 link creations/min and 120 redirects/min. Exceeding them returns `429` with `Retry-After`.

## Local Setup

Requires Node 20+, pnpm and Docker (for Postgres).

```bash
pnpm install
cp .env.example .env              # DATABASE_URL points to localhost:5432
docker compose up -d db           # start only Postgres
pnpm db:migrate                   # apply migrations
pnpm dev
```

Open `http://localhost:5173`

## Docker Setup

```bash
docker compose up --build
```

Open `http://localhost:3000`

What happens on start:

1. `db` — Postgres 16 starts; a healthcheck waits until it accepts connections.
2. `migrate` — a one-shot job applies the Drizzle migrations and exits.
3. `web` — starts only after `migrate` has completed successfully.

Data lives in the `pgdata` volume, so links survive `docker compose down` and restarts.
To wipe all data: `docker compose down -v`.

The credentials in `docker-compose.yml` (`shortener` / `shortener`) are for local development only.

## Tests

```bash
pnpm test                         # unit tests (Vitest)
```

End-to-end tests run against a running app (Docker or `pnpm dev`):

```bash
cd applications/web && pnpm exec playwright install chromium   # once
cd ../..
pnpm e2e                                                       # http://localhost:3000
E2E_BASE_URL=http://localhost:5173 pnpm e2e                    # another URL
```

The e2e suite sends a random `X-Forwarded-For` per run, so it does not collide with the rate limiter between runs.

## Other scripts

| Command            | What it does                                |
| ------------------ | ------------------------------------------- |
| `pnpm build`       | Build all packages                          |
| `pnpm typecheck`   | Type-check all packages                     |
| `pnpm db:generate` | Generate a new migration after schema change |
| `pnpm db:migrate`  | Apply migrations to `DATABASE_URL`          |

## Known limitations

- The rate limiter is in-memory, so it is per process; with several instances it would need a shared store (Redis/Postgres).
- URLs are not resolved via DNS, so a public hostname pointing to a private IP is not detected.
- `X-Forwarded-For` is trusted as is; in production it should come from a trusted proxy.
- `DrizzleLinkRepository` is not covered by automated integration tests; it is exercised by the e2e suite.
