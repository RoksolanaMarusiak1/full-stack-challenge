export { baseUrl } from "./base-url";

export type { Link } from "./domain/link";
export type { LinkRepository } from "./domain/link-repository";
export {
  CodeAlreadyExistsError,
  CodeGenerationError,
  InvalidUrlError,
  LinkNotFoundError,
} from "./domain/errors";
export { LinkService } from "./link-service";
export { generateShortCode } from "./code-generator";
export { parseTargetUrl } from "./domain/target-url";
export { RateLimiter } from "./rate-limiter";
export type { RateLimitResult } from "./rate-limiter";
export { InMemoryLinkRepository } from "./infrastructure/in-memory-link-repository";
export { DrizzleLinkRepository } from "./infrastructure/drizzle-link-repository";

import { createDb, type Database } from "./infrastructure/db/client";
import { DrizzleLinkRepository } from "./infrastructure/drizzle-link-repository";
import { LinkService } from "./link-service";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (see .env.example)");
}

// Keep one connection pool across dev hot reloads instead of opening a new one each time.
const globalForDb = globalThis as typeof globalThis & { __linksDb?: Database };
const db = (globalForDb.__linksDb ??= createDb(connectionString));

/**
 * Composition root: the single place that chooses the storage.
 * The service only knows the LinkRepository interface.
 */
export const linkService = new LinkService(new DrizzleLinkRepository(db));
