# Work log

Running notes on what was done and why. Used later as the source for the README and CHALLENGE_SUBMISSION.md.

Started: 2026-11-05 21:57 (Europe/Warsaw). Time box: ~3-4h.

Main task finished: 2026-11-06 00:08 (about 2h10m). Everything required by the challenge was done by then: UI, persistence, validation, rate limiting, tests, Docker and README. Whatever I do after this point is extra and is described in a separate "Extra time" section at the end, so the main result and the extras can be told apart.

How the work is done: Claude writes the code into my local clone and checks it (type check, smoke tests). I read the changes and make the git commits myself, one commit per logical step, so the history reflects what I reviewed and understood.

## Where I steered or corrected Claude

- Asked Claude to simplify its first, over-engineered plan; the scope was cut to the essentials (database, safe codes, validation, click counter, UI, a few tests) and the rest became "next steps".
- Prepared before starting: compared Drizzle with Prisma (which I already know) and chose Drizzle because the challenge encourages it; the main differences for me were the schema written in TypeScript, no code generation step and SQL-like queries.
- Followed the challenge instruction to fork the repository.
- Asked for a security scan of the repository (scripts, dependencies, lockfile sources) before running it.
- Changed the order of work: Claude proposed engine first; I chose to start with the pages and a separate form component.
- Decided the git history must be mine: I had Claude's early commits undone and now commit each step myself with my own messages, splitting the UI commit from the engine commit so each one builds.
- Found that click counts on `/links` did not update after opening a short link (it opens in a new tab). This led to revalidating on tab focus plus a Refresh button.
- Asked why the URL length limit exists and whether it has pitfalls. This exposed a real bug: the length was checked before normalisation, so 2000 Cyrillic letters (about 12,000 characters once percent-encoded) passed the limit. The check now runs on the normalised URL.
- Asked for the reasoning behind where the rate limiter lives (mechanism in the engine, policy in the web app) to be written down in the log and in the code.
- Tested the behaviour by hand instead of trusting the type check: invalid URLs return 400, 20 creations pass and the next ones get 429, a different client IP gets its own limit, unknown or malformed codes return 404, and 120 redirects pass before 429.
- Ran the unit tests locally; the output showed every test running twice (108 instead of 54), which led to limiting Vitest to `src/`.
- Questioned the order of work (E2E after Docker) and asked to do the E2E tests together with the testing step instead; the time was available, and E2E can run against any running instance.
- Have Cypress experience, but chose Playwright for this project so that Claude could run and verify the E2E tests itself (Cypress needs its own binary, which cannot be downloaded in Claude's environment); asked how the two differ before deciding.
- Ran the E2E tests locally in a visible browser to watch what they do, not only to see them pass.
- Ran `docker compose up --build` and the E2E suite against the Docker stack myself, instead of relying on Claude's run in its own environment.

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
  - The pg pool has an `error` listener: found while testing the production build that a dropped connection (Postgres restarting) emitted an unhandled `error` event and crashed the whole Node process. Verified that the process now survives a Postgres restart and the next query works.
  - Also verified the production build (`pnpm build` + `pnpm start`) against a real Postgres: create, redirect (302), invalid URL (400) and click count all work.
  - `.env.example` has `DATABASE_URL`; `vite.config.ts` loads `.env` into `process.env` so server code sees it in dev.
- Why:
  - Code as primary key: uniqueness is enforced by the database, so the service's retry-on-duplicate is race-free (unique violation `23505` -> `CodeAlreadyExistsError`).
  - Click counter is one atomic `UPDATE ... SET clicks = clicks + 1`, not read-then-write, so parallel clicks are not lost.
  - Migrations are a separate compose job instead of running at app startup: explicit, runs once, and the app does not start on a broken schema.
  - `pg` and `drizzle-orm` are also listed in the web package: web bundles the engine source, so these imports are resolved from web at runtime in the production build.
- Trade-offs / skipped: no connection-pool tuning, no down-migrations, credentials in compose are dev-only defaults.
- Checked: type check passes; on a real Postgres 16 I applied the migration and ran the repository: duplicate code -> `CodeAlreadyExistsError`, 50 parallel `resolve` calls -> exactly 50 clicks, unknown code -> `LinkNotFoundError`, list is newest first. The Docker setup itself still has to be verified end to end (done in the last step).
- AI usage: Claude wrote the schema, repository, compose setup and verified them against a temporary Postgres; I run the migration and commit.

## Step 5: Validation, abuse prevention and error handling

- What I did:
  - `domain/target-url.ts`: Zod schema + `parseTargetUrl()`. Rules: not empty, max 2048 chars measured after normalisation (non-ASCII characters become `%XX`, so 2000 Cyrillic letters would otherwise turn into ~12k stored characters) plus a cheap 8192 limit on the raw input, must parse as a URL, only `http:`/`https:`, no `user:pass@`, no localhost / private / link-local addresses (incl. IPv6 and tricks like `http://2130706433`). Returns the normalised URL that gets stored.
  - `LinkService.create()` calls it first and throws `InvalidUrlError` with a user-friendly message.
  - `RateLimiter` (sliding window, in memory, bounded number of keys) in the engine; web uses it in `app/.server/rate-limits.ts`: 20 link creations/min and 120 redirects/min per client.
  - `_index` action: 400 with the validation message, 429 with `Retry-After`, 500 with a generic message (the real error goes to `console.error`). The form already shows the message under the input and a loading state.
  - `/s/:code`: codes that cannot exist (not base62, > 16 chars) return 404 without touching the DB; 429 when rate limited.
- Why:
  - Validation sits in the service (not only the form), so any caller is protected, and the schema is the single source of the rules.
  - Blocking `javascript:`/`data:` removes XSS-style abuse; blocking private addresses stops the shortener being used to point at internal services; blocking credentials in URLs limits phishing.
  - Rate limiting is split on purpose: the mechanism (`RateLimiter`, a sliding window) is plain logic in the engine with an injectable clock, so it is unit-testable without HTTP and reusable; the policy (how many requests, which routes, how a client is identified from `X-Forwarded-For`) lives in the web app (`app/.server/rate-limits.ts`) because "who is the client" and "what happens on 429" are HTTP concerns. The `.server` folder keeps this code out of the browser bundle. This keeps the engine free of request/response details and lets the limits change without touching the logic.
- Trade-offs / skipped:
  - The limiter is per-process memory: fine for one instance, would need Redis/Postgres for several.
  - Client IP comes from `X-Forwarded-For`, which is only trustworthy behind a reverse proxy; without it all clients share one bucket.
  - No DNS resolution check (a public hostname can still resolve to a private IP), no blocklist of malicious domains, no CAPTCHA. Listed as next steps.
- Checked: type check passes; ran a table of 20 inputs (valid, empty, `javascript:`, `data:`, `ftp:`, localhost, 127.0.0.1, `2130706433`, 10.x, 192.168.x, 172.16.x, 169.254.169.254, `[::1]`, `.local`, credentials, too long, 172.32.x, uppercase host): all accepted/rejected as intended; limiter blocks the 4th call in a window, is per key and resets after the window.
- AI usage: Claude proposed the rule set and wrote the code and the checks; I decide which rules are acceptable and review the behaviour in the browser.

## Step 6: Tests (Vitest)

- What I did: added Vitest to the engine (`pnpm test` runs it through Turbo) with 54 unit tests in 5 files next to the code:
  - `link-service.test.ts`: creates a link with the normalised URL; invalid URL is rejected and nothing is stored; retry on a taken code does not overwrite the existing link; gives up after the maximum attempts (`CodeGenerationError`); other repository errors are not retried; `resolve` returns the URL and counts clicks; unknown code -> `LinkNotFoundError`.
  - `domain/target-url.test.ts`: table tests for accepted URLs (and normalisation) and for every rejection rule (schemes, credentials, localhost, private/link-local IPv4 and IPv6, decimal IP trick), plus the length rules.
  - `rate-limiter.test.ts`: limit, retry-after rounding, separate keys, reset after the window, sliding window (no double burst), blocked requests are not counted. Uses a fake clock, no real waiting.
  - `infrastructure/in-memory-link-repository.test.ts` and `code-generator.test.ts`.
- Why: the tests target the logic that can silently go wrong (collisions, validation rules, limits) and run in under a second because the service depends on the `LinkRepository` interface, so an in-memory repository replaces the database.
- How I checked the tests themselves: I deliberately broke the code four ways (retry on every error, off-by-one in the limiter, length measured on raw input, wrong private IP range). Three were caught immediately; the IP range one was not, because only the lower bound (172.16.x) was tested, so I added the upper bound (172.31.x) and the mutation is now caught.
- Found on the first local run: 108 tests instead of 54. `tsc` (the engine `dev` and `build` scripts) also compiles the test files into `dist/`, and Vitest picked up both copies. Fixed with `vitest.config.ts` (`include: ["src/**/*.test.ts"]`).
- Trade-offs / skipped: no automated test for `DrizzleLinkRepository` (needs a database; it was verified by hand against a real Postgres: duplicate code, 50 parallel clicks, ordering), and no browser/E2E tests. A repository integration test against Postgres (for example with Testcontainers) is the next step.
- AI usage: Claude wrote the tests and the mutation check; I run them with `pnpm test`.

## Step 7: End-to-end tests (Playwright)

- What I did: `applications/web/e2e/shortener.spec.ts` + `playwright.config.ts` (`pnpm e2e`). 10 tests drive the real app (browser + HTTP) against a running instance; the base URL defaults to the Docker stack (`:3000`) and `E2E_BASE_URL=http://localhost:5173 pnpm e2e` targets `pnpm dev`.
  - shorten a URL -> a short link and a Copy button appear;
  - bad input shows a clear message and no link: empty, no scheme, `javascript:`, localhost, private IP, credentials in the URL;
  - the short link answers 302 with the right `Location`, and `/links` shows 1 click, then 2 after another visit;
  - unknown or malformed codes return 404;
  - link creation is limited per client: 20 requests succeed, the next ones get 429 with a `Retry-After` header.
- Why Playwright: it only needs a browser, which is easy to run in CI and locally (`npx playwright install chromium` once); I have Cypress experience, but for these scenarios either would do and Playwright can be run and verified in Claude's environment. The tests use a random `X-Forwarded-For` per run, so they do not depend on earlier runs or on manual testing (the app rate-limits per client).
- Found by the tests: a 429 from the form action had no `Retry-After` header. React Router only sends headers set in `data(..., { headers })` when the route exports `headers()`. Fixed in `_index.tsx`; the redirect route already sent it.
- Checked: all 10 pass twice in a row against the production build (`pnpm build` + `pnpm start`) with a real Postgres. First check of the fix accidentally ran against the old server process still holding the port; I noticed the `EADDRINUSE` in the log, restarted it and reran.
- Trade-offs / skipped: tests need a running app and a database (not started by the test command); no check of "data survives a restart" (done by hand with `docker compose restart`); only Chromium.
- AI usage: Claude wrote the tests and ran them; the failing rate-limit test exposed the missing header.

## Step 8: Docker verification and README

- What I did: ran `docker compose up --build` from scratch and checked the startup order: `db` becomes healthy, the `migrate` job applies the migration and exits with code 0, then `web` starts and listens on `:3000`. Then I ran `pnpm e2e` against that Docker stack and all the tests passed. I also checked persistence: after `docker compose down` (without `-v`) and `docker compose up`, the links and click counts were still there. I rewrote the README: Docker Setup (what starts in which order, data in the `pgdata` volume, `docker compose down -v` to reset), local setup with Postgres, how to run unit and E2E tests, the architecture, the abuse-prevention rules and known limitations.
- Why: the challenge requires the app to run on Docker and the README Docker Setup to stay accurate, so the final check is the same command a reviewer will run, on a clean build.
- Noticed: two harmless messages in the logs, `locale: not found` (Alpine image without locales) and the Postgres warning about `trust` authentication (default for the dev container). Neither affects the app. The compose credentials (`shortener`/`shortener`) are for local development only, which the README says.
- Trade-offs / skipped: the README lists the known limitations instead of hiding them (in-memory rate limiter, no DNS check, trusted `X-Forwarded-For`, no automated test for the Drizzle repository).
- AI usage: Claude wrote the README draft; I ran the Docker stack and the E2E suite myself and checked the result.

## Plan (status)

- [x] Baseline and audit
- [x] UI components (step 2)
- [x] Engine: `LinkRepository` + `LinkService`, collision-safe code generation (step 3)
- [x] Postgres + Drizzle, migrations, docker-compose with healthcheck (step 4)
- [x] Validation (Zod) and abuse prevention (rate limiting) (step 5)
- [x] Error handling in the action and meaningful messages in the UI (step 5)
- [x] Tests (Vitest) for LinkService, validation, rate limiter (step 6)
- [x] End-to-end tests with Playwright (step 7)
- [x] Docker verification from scratch, README Docker Setup (step 8)
- [x] CHALLENGE_SUBMISSION.md
- [x] Extra time: design, theme toggle, copy buttons (after the main task)

## Extra time: design and polish (00:08 to about 00:55)

Everything required was already done and committed before this section (see "Main task finished" at the top). This part is optional polish.

- What I did:
  - Design: I used the visual style I had already made for my own LinkedIn carousels (warm paper background, wine-colored text, one crimson accent, Space Grotesk for text and JetBrains Mono for labels, links and counters). Claude moved it into code as theme tokens in `app.css` (Tailwind variables), so components only use semantic names (`paper`, `card`, `ink`, `accent`) and never raw colors.
  - Light and dark theme with a toggle in the header. Light is the default (it does not follow the system setting); the choice is saved in `localStorage`, and a tiny inline script in `<head>` applies it before the first paint so the page does not flash.
  - Animated background: three blurred color blobs drifting slowly. Only `transform` is animated, and the animation is switched off when the system asks for reduced motion.
  - Buttons: gradient, soft glow, small lift on hover and press feedback; soft glow on the focused input and on the result card.
  - Links page: a Copy icon button next to every link (new `CopyButton` component, shared with the result on the home page), wider layout so the table does not scroll on desktop, and a fixed date format (`en-GB`, UTC) so the server and the browser render the same text and React does not warn about hydration.
- Why: the first version looked generic; a consistent look makes the app easier to judge. The theme uses CSS variables so adding or changing a theme does not touch the components.
- Checked: `pnpm typecheck`, 54 unit tests, production build and all 10 E2E tests pass with the new design (run on a clean copy with a real Postgres). Claude also looked at screenshots of both pages in both themes, and I checked the pages in the browser.
- Trade-offs / skipped: no automated visual or accessibility tests; the text and accent colors were checked by calculating contrast (the accent used for text is a darker shade than the decorative one), not with a tool; the table is horizontally scrollable on narrow screens instead of becoming cards.
- AI usage: the style is mine, Claude implemented it. I looked at each change in the browser and corrected the details (below).

Where I steered during this part:

- Asked to remove the numbered labels ("01", "02") above the headings.
- Noticed the short link result was a dark block in the light theme and asked to make it light.
- Asked for light to be the default theme and for a manual toggle, and said that near-black text did not fit the palette (it is now a wine color).
- Saw a blue focus outline on the input (the browser default) next to my own focus style; it was removed.
- Asked for the animated blobs to move faster and to reach the corners of the screen.
- Asked for a Copy button on the links page, and for an icon instead of the word.
- Saw that the Copy button was missing on the links page; the cause was the table being wider than the page, so it was moved next to the link and the page was widened.
