import type { Link, NewLink } from "./link";

/**
 * Storage abstraction. The service depends only on this interface, so the
 * in-memory implementation (used in tests) and the Postgres/Drizzle one are
 * interchangeable.
 */
export interface LinkRepository {
  /** Must throw CodeAlreadyExistsError if the code is taken. */
  create(link: NewLink): Promise<Link>;
  findByCode(code: string): Promise<Link | null>;
  /** Atomically adds 1 to the click counter. Returns null if the code does not exist. */
  incrementClicks(code: string): Promise<Link | null>;
  /** Newest first. */
  list(): Promise<Link[]>;
}
