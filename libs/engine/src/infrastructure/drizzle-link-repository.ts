import { desc, eq, sql } from "drizzle-orm";
import { CodeAlreadyExistsError } from "../domain/errors";
import type { Link, NewLink } from "../domain/link";
import type { LinkRepository } from "../domain/link-repository";
import type { Database } from "./db/client";
import { links, type LinkRow } from "./db/schema";

const PG_UNIQUE_VIOLATION = "23505";

function toLink(row: LinkRow): Link {
  return { code: row.code, url: row.url, clicks: row.clicks, createdAt: row.createdAt };
}

/** Drizzle wraps driver errors, so the Postgres error code may be on `cause`. */
function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === PG_UNIQUE_VIOLATION || e?.cause?.code === PG_UNIQUE_VIOLATION;
}

export class DrizzleLinkRepository implements LinkRepository {
  constructor(private readonly db: Database) {}

  async create({ code, url }: NewLink): Promise<Link> {
    try {
      const [row] = await this.db.insert(links).values({ code, url }).returning();
      return toLink(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new CodeAlreadyExistsError(code);
      throw error;
    }
  }

  async findByCode(code: string): Promise<Link | null> {
    const [row] = await this.db.select().from(links).where(eq(links.code, code)).limit(1);
    return row ? toLink(row) : null;
  }

  async incrementClicks(code: string): Promise<Link | null> {
    // Single atomic UPDATE: two simultaneous clicks cannot overwrite each other
    // (a read-then-write in JS could lose one of them).
    const [row] = await this.db
      .update(links)
      .set({ clicks: sql`${links.clicks} + 1` })
      .where(eq(links.code, code))
      .returning();
    return row ? toLink(row) : null;
  }

  async list(): Promise<Link[]> {
    const rows = await this.db.select().from(links).orderBy(desc(links.createdAt));
    return rows.map(toLink);
  }
}
