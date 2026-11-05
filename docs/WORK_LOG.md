# Work log

Running notes on what was done and why. Used later as the source for the README and CHALLENGE_SUBMISSION.md.

Started: 2026-11-05 21:57 (Europe/Warsaw). Time box: ~3-4h.

How the work is done: Claude writes the code into my local clone and checks it (type check, smoke tests). I read the changes and make the git commits myself, one commit per logical step, so the history reflects what I reviewed and understood.

## Step 1: Baseline and audit

- What I did: forked the template, cloned it, read through `libs/engine` and `applications/web` before changing anything.
- Findings about the starting point:
  - Storage is an in-memory `Map`, data is lost on restart.
  - Short code is 2 chars from `abc` -> only 9 possible codes, collisions silently overwrite links.
  - No input validation (only `required` on the input); `javascript:` and other schemes are accepted, redirect is an open redirect.
  - No click tracking, no list of links, no tests, no database in docker-compose.
  - Engine is consumed directly from `src` by the web app (vite `ssr.noExternal`), so DB code lives in `libs/engine`.
- Why: knowing the constraints up front (engine has no build step, Docker only copies `libs/engine/src`) avoids surprises when adding Drizzle and migrations.
- Trade-offs / skipped: nothing yet.
- AI usage: used Claude to audit the repo and propose the step order; reviewed the findings myself against the code.

## Step 2: UI components (commit: `feat(web): add reusable UI components for the shortener`)

- What I did: built the UI from small components instead of one messy `_index.tsx`.
  - `components/ui/{button,input,card}.tsx`: small shadcn-style primitives (plain Tailwind, no extra dependency).
  - `components/layout.tsx` (header + nav), `url-form.tsx` (separate form with inline error and a loading state via `useNavigation`), `short-url-result.tsx` (copy button), `links-table.tsx` (list with click stats and empty state).
  - `lib/link-item.ts`: the `LinkItem` type the UI works with (`code`, `url`, `shortUrl`, `clicks`, `createdAt`).
- Why this order: UI first gives a visible result early; fixing the `LinkItem` shape up front means the UI does not change when storage moves from the in-memory Map to Postgres.
- Trade-offs / skipped: no Radix/shadcn CLI to avoid extra dependencies and setup time; primitives are minimal on purpose. This commit contains only self-contained components; the pages are wired to them in step 3 so every commit builds on its own.
- Checked: `pnpm typecheck` passes for both packages.
- AI usage: Claude generated the components and Tailwind classes; I committed them after looking at the result in the browser.

## Step 3: Layered engine and wiring (commit: `refactor: layered engine with LinkService and wire up pages`)

- What I did: split `libs/engine` into layers.
  - `domain/`: `Link` type, `LinkRepository` interface, typed errors (`CodeAlreadyExistsError`, `CodeGenerationError`, `LinkNotFoundError`).
  - `LinkService`: `create(url)`, `resolve(code)` (returns the URL and counts the click), `list()`. Depends only on the repository interface.
  - `infrastructure/in-memory-link-repository.ts`: temporary implementation, will also be the test double.
  - `code-generator.ts`: 7-char base62 codes via `crypto.randomInt` (62^7 ≈ 3.5 trillion vs 9 before).
  - `index.ts` is the composition root (`linkService`); switching to Postgres later is a one-line change.
  - Routes `/` (form + result), `/links` (list with click counts) and `/s/:code` (redirect) now use `linkService`; `routes.ts` registers `/links`.
- Why: the service does not check-then-insert (racy). It inserts and retries when the repository reports a duplicate, which maps directly to a UNIQUE constraint in Postgres. Dependency on an interface = SOLID (D) and makes the service testable without a DB.
- Trade-offs / skipped: storage is still in memory; no validation yet; click counting is inside `resolve` for simplicity.
- Checked: `pnpm typecheck` passes; smoke test: retry on collision works, gives up after max attempts, 404 for unknown code, 10k generated codes were all unique.
- How it fits together (monorepo): `applications/web` and `libs/engine` are pnpm workspace packages; web depends on `@url-shortener/engine` via `workspace:*`. The engine exposes `src/index.ts` directly (no build step) and Vite bundles it into the web app (`ssr.noExternal`). Turbo only runs the scripts of both packages together.
- Request flow: form -> `action()` -> `linkService.create(url)` -> `generateShortCode()` + `repository.create()`; visiting `/s/:code` -> `loader()` -> `linkService.resolve(code)` (+1 click) -> redirect, or 404 on `LinkNotFoundError`. Routes stay thin; all logic lives in the engine.
- Points for the submission / interviews:
  - I separated domain, service and infrastructure following DDD / clean architecture ideas.
  - The repository abstraction lets me swap the storage and test without a database.
  - Short codes are generated securely and collisions are handled without a race condition.
- AI usage: Claude proposed and wrote the layering and the retry approach; I tested it in the browser and committed it.

## Step 4: Postgres + Drizzle
- What I did:
  - `infrastructure/db/schema.ts`: `links` table (`code` is the primary key, `url`, `clicks`, `created_at`, index on `created_at`). `client.ts` creates the pg pool + Drizzle instance.
  - `DrizzleLinkRepository` implements `LinkRepository`; `index.ts` now wires it into `LinkService` (one-line swap, as planned). The in-memory repository stays for tests.
  - SQL migration generated with `drizzle-kit generate` (`libs/engine/drizzle`) and applied with `drizzle-kit migrate` (`pnpm db:migrate`).
  - `docker-compose.yml`: `db` (Postgres 16 with healthcheck) -> `migrate` (one-shot job) -> `web`; data lives in a named volume so it survives restarts. Dockerfile copies the migrations and config into the production image.
  - `/links` revalidates its data when the tab regains focus (short links open in a new tab, so the click counts were stale) and has a Refresh button.
  - `.env.example` has `DATABASE_URL`; `vite.config.ts` loads `.env` into `process.env` so server code sees it in dev.
- Why:
  - Code as primary key: uniqueness is enforced by the database, so the service's retry-on-duplicate is race-free (unique violation `23505` -> `CodeAlreadyExistsError`).
  - Click counter is one atomic `UPDATE ... SET clicks = clicks + 1`, not read-then-write, so parallel clicks are not lost.
  - Migrations are a separate compose job instead of running at app startup: explicit, runs once, and the app does not start on a broken schema.
  - `pg` and `drizzle-orm` are also listed in the web package: web bundles the engine source, so these imports are resolved from web at runtime in the production build.
- Trade-offs / skipped: no connection-pool tuning, no down-migrations, credentials in compose are dev-only defaults.
- Checked: type check passes; on a real Postgres 16 I applied the migration and ran the repository: duplicate code -> `CodeAlreadyExistsError`, 50 parallel `resolve` calls -> exactly 50 clicks, unknown code -> `LinkNotFoundError`, list is newest first. The Docker setup itself still has to be verified end to end (done in the last step).
- AI usage: Claude wrote the schema, repository, compose setup and verified them against a temporary Postgres; I run the migration and commit.

## Plan (status)

- [x] Baseline and audit
- [x] UI components (step 2)
- [x] Engine: `LinkRepository` + `LinkService`, collision-safe code generation (step 3)
- [x] Postgres + Drizzle, migrations, docker-compose with healthcheck (step 4)
- [ ] Validation (Zod) and abuse prevention (rate limiting)
- [ ] Error handling in the action and meaningful messages in the UI
- [ ] Tests (Vitest) for LinkService
- [ ] Docker verification from scratch, README Docker Setup, CHALLENGE_SUBMISSION.md
