# Submission

## What I Did

**My role.** I worked as the owner of the task and the reviewer; Claude wrote most of the code under my direction. What I did myself:

- **Scope and order.** I took the over-engineered first plan apart and cut it to what the task needs: database, safe codes, validation, click counter, UI and a few tests. I also set the order of work: UI with a separate form component first, and E2E tests inside the testing step instead of after Docker.
- **Technology choice.** Before the task I compared Drizzle with Prisma, which I already know, and chose Drizzle: schema in TypeScript, no generation step, SQL-like queries.
- **Security.** Before running anything I had the repository checked for malicious scripts, dependencies and lockfile sources. I decided which validation and rate-limit rules the product should enforce.
- **Manual testing.** I did not trust the type check alone. I tested by hand: invalid URLs return 400, 20 creations pass and the next ones get 429, another client IP gets its own limit, unknown codes return 404, and 120 redirects pass before 429. I also ran the E2E tests in a visible browser to see exactly what they do.
- **Bugs I found.**
  - A UX bug that neither the type check nor the tests caught: click counts on `/links` stayed stale after opening a short link. I found it by clicking through the app, and it was fixed with revalidation on tab focus plus a Refresh button.
  - I asked why the URL length limit has its value and whether it has pitfalls. That uncovered a real bug: the length was checked before normalisation, so a Cyrillic URL of about 12,000 encoded characters passed.
  - I noticed that the first test run reported 108 tests instead of 54, which led to a Vitest config fix.
- **Tooling.** I have Cypress experience and still chose Playwright, so that the tests could be run and verified during development, not only on my machine.
- **Delivery.** I ran Docker and the E2E suite on my machine, checked that data survives a restart, and made every commit myself.

I started with an audit of the template: in-memory `Map` storage, 2-character short codes (only 9 possible codes, collisions overwrote links), no validation, an open redirect, no click tracking, no tests and no database in Docker. Then I rebuilt it in small steps, each one committed separately (the full reasoning is in `docs/WORK_LOG.md`).

- **UI:** small reusable components (`Button`, `Input`, `Card`, `UrlForm`, `ShortUrlResult`, `LinksTable`) instead of one big route. The form shows inline errors and a loading state; `/links` shows every link with its click count and refreshes when the tab regains focus. As extra work after the required scope, I added my own warm visual style with a light/dark toggle (light by default), an animated background that respects reduced motion, and a copy button for each link.
- **Architecture:** `libs/engine` is split into domain (`Link`, `LinkRepository`, errors), `LinkService` and infrastructure (Drizzle and in-memory repositories). The service depends only on the repository interface. Routes stay thin.
- **Persistence:** Postgres with Drizzle and migrations. The short code is the primary key, so uniqueness is enforced by the database and the service retries on a unique violation instead of check-then-insert. Clicks use one atomic `UPDATE ... SET clicks = clicks + 1`.
- **Abuse prevention:** Zod validation (http/https only, no credentials in the URL, no localhost/private/link-local/IPv6 hosts, length checked after normalisation) and a sliding-window rate limiter: 20 creations/min and 120 redirects/min per client, with `429` and `Retry-After`. The limiter mechanism lives in the engine, the policy (limits, how the client is identified) in the web app.
- **Error handling:** 400 with a readable message for invalid input, 429, 404 for unknown or malformed codes, and a generic 500 (the real error is logged).
- **Tests:** 54 Vitest unit tests (service, validation, rate limiter, repository, code generator) and 10 Playwright E2E tests against the running app. I broke the code on purpose in four ways to check that the tests fail; this found one missing boundary case, which I added.
- **Docker:** `docker compose up --build` starts Postgres (with a healthcheck), runs migrations as a one-shot job, then starts the web app. I ran it from scratch and ran the E2E suite against it. The README "Docker Setup" is up to date.

I prioritised data correctness (no lost links, no collisions, no lost clicks) and basic abuse protection over extra features, because those were the weak points of the template.

## What I Would Do With More Time

- Integration tests for `DrizzleLinkRepository` against a real Postgres (for example with Testcontainers). Right now it is covered by the E2E tests and by my manual checks, not by its own tests.
- Move the rate limiter to a shared store (Redis or Postgres); the in-memory one only works for a single instance.
- Resolve the hostname via DNS and reject targets that point to private IPs (the current check only looks at the literal host), and add a blocklist for malicious domains or a CAPTCHA.
- Take the client IP only from a trusted proxy instead of trusting `X-Forwarded-For` as is.
- Product features: custom aliases, link expiry, per-link analytics (time, referrer), pagination for the links list, and authentication so users see only their own links.
- Structured logging and a health endpoint.

## AI Usage

I used Claude (Claude Code) as a pair programmer through the whole task. The work was step by step: Claude wrote code into my local clone and explained it, I reviewed and approved it, and I made the git commits myself. Claude also ran type checks, tests and the E2E suite in its own environment, and I repeated the important checks on my machine (including Docker). I kept a log of this in `docs/WORK_LOG.md`, including where I changed Claude's direction.

Example prompts:

- "Before I run anything, review the repository for malicious code: scripts, dependencies and lockfile sources."
- "Why is the URL length limit set to this value? Are there edge cases or pitfalls I should know about?"
- "Why do you postpone the E2E tests until after Docker? Would the Docker setup really take more than an hour? I would rather do them as part of the testing step."

Where I steered or corrected it: I asked it to cut an over-engineered first plan down to the essentials; I rejected its commits and made my own history; I found that click counts did not refresh after opening a short link; my question about the length limit exposed a real bug (the length was checked before normalisation, so a long Cyrillic URL passed); the unit test run showed every test twice, which led to a Vitest config fix; and I chose to do the E2E tests earlier than Claude proposed. Claude's tests also found a bug of its own: a 429 response without `Retry-After`.

The visual style (palette, fonts, look of the cards and labels) comes from my own LinkedIn carousel designs; Claude only moved it into code as theme tokens and components, and I checked and corrected the result in the browser.

What I did not delegate: choosing the scope and the order of work, deciding which validation rules are acceptable, reviewing behaviour in the browser, running Docker and the tests locally, and all commits.

## Feedback

The challenge was clear and the idea of refactoring a deliberately bad template is a good one: it is easy to see what to fix, and the requirements list leaves room for choices. The time limit is tight if the goal is a complete result with tests and Docker, so I had to cut scope on purpose and write the rest down as next steps.
