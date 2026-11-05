import { generateShortCode } from "./code-generator";
import {
  CodeAlreadyExistsError,
  CodeGenerationError,
  LinkNotFoundError,
} from "./domain/errors";
import type { Link } from "./domain/link";
import type { LinkRepository } from "./domain/link-repository";

export type LinkServiceOptions = {
  /** Injectable so tests can force collisions. */
  generateCode?: () => string;
  maxCodeAttempts?: number;
};

export class LinkService {
  private readonly generateCode: () => string;
  private readonly maxCodeAttempts: number;

  constructor(
    private readonly repository: LinkRepository,
    options: LinkServiceOptions = {},
  ) {
    this.generateCode = options.generateCode ?? generateShortCode;
    this.maxCodeAttempts = options.maxCodeAttempts ?? 5;
  }

  /**
   * Creates a link with a unique code. We do not "check, then insert":
   * that is racy. We insert and retry when the repository reports a duplicate
   * (backed by a unique constraint in the database).
   */
  async create(url: string): Promise<Link> {
    for (let attempt = 0; attempt < this.maxCodeAttempts; attempt++) {
      try {
        return await this.repository.create({ code: this.generateCode(), url });
      } catch (error) {
        if (!(error instanceof CodeAlreadyExistsError)) throw error;
      }
    }
    throw new CodeGenerationError(this.maxCodeAttempts);
  }

  /** Returns the target URL and records the click. */
  async resolve(code: string): Promise<string> {
    const link = await this.repository.incrementClicks(code);
    if (!link) throw new LinkNotFoundError(code);
    return link.url;
  }

  list(): Promise<Link[]> {
    return this.repository.list();
  }
}
