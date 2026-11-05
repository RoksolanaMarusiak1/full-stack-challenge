export { baseUrl } from "./base-url";

export type { Link } from "./domain/link";
export type { LinkRepository } from "./domain/link-repository";
export {
  CodeAlreadyExistsError,
  CodeGenerationError,
  LinkNotFoundError,
} from "./domain/errors";
export { LinkService } from "./link-service";
export { generateShortCode } from "./code-generator";
export { InMemoryLinkRepository } from "./infrastructure/in-memory-link-repository";

import { InMemoryLinkRepository } from "./infrastructure/in-memory-link-repository";
import { LinkService } from "./link-service";

/**
 * Composition root: the single place that chooses the storage.
 * Swapping to Postgres later is a one-line change here.
 */
export const linkService = new LinkService(new InMemoryLinkRepository());
