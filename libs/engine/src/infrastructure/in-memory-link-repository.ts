import { CodeAlreadyExistsError } from "../domain/errors";
import type { Link, NewLink } from "../domain/link";
import type { LinkRepository } from "../domain/link-repository";

/** Temporary storage until the Postgres repository replaces it. Also used in tests. */
export class InMemoryLinkRepository implements LinkRepository {
  private readonly links = new Map<string, Link>();

  async create({ code, url }: NewLink): Promise<Link> {
    if (this.links.has(code)) {
      throw new CodeAlreadyExistsError(code);
    }
    const link: Link = { code, url, clicks: 0, createdAt: new Date() };
    this.links.set(code, link);
    return { ...link };
  }

  async findByCode(code: string): Promise<Link | null> {
    const link = this.links.get(code);
    return link ? { ...link } : null;
  }

  async incrementClicks(code: string): Promise<Link | null> {
    const link = this.links.get(code);
    if (!link) return null;
    link.clicks += 1;
    return { ...link };
  }

  async list(): Promise<Link[]> {
    return [...this.links.values()]
      .map((link) => ({ ...link }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
