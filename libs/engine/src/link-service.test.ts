import { describe, expect, it, vi } from "vitest";
import {
  CodeAlreadyExistsError,
  CodeGenerationError,
  InvalidUrlError,
  LinkNotFoundError,
} from "./domain/errors";
import type { LinkRepository } from "./domain/link-repository";
import { InMemoryLinkRepository } from "./infrastructure/in-memory-link-repository";
import { LinkService } from "./link-service";

/** A generator that returns the given codes one by one. */
function codes(...values: string[]) {
  const queue = [...values];
  return () => {
    const next = queue.shift();
    if (!next) throw new Error("test generator ran out of codes");
    return next;
  };
}

describe("LinkService", () => {
  describe("create", () => {
    it("stores the normalised URL under a generated code", async () => {
      const service = new LinkService(new InMemoryLinkRepository());
      const link = await service.create("  https://Example.com/path  ");
      expect(link.url).toBe("https://example.com/path");
      expect(link.code).toMatch(/^[0-9A-Za-z]{7}$/);
      expect(link.clicks).toBe(0);
    });

    it("rejects an invalid URL and stores nothing", async () => {
      const repo = new InMemoryLinkRepository();
      const service = new LinkService(repo);
      await expect(service.create("javascript:alert(1)")).rejects.toBeInstanceOf(InvalidUrlError);
      expect(await repo.list()).toEqual([]);
    });

    it("retries with a new code when the code is already taken", async () => {
      const repo = new InMemoryLinkRepository();
      await repo.create({ code: "taken", url: "https://other.com/" });
      const service = new LinkService(repo, { generateCode: codes("taken", "taken", "free") });

      const link = await service.create("https://a.com");

      expect(link.code).toBe("free");
      expect(await repo.list()).toHaveLength(2); // the existing link was not overwritten
    });

    it("gives up after the maximum number of attempts", async () => {
      const repo = new InMemoryLinkRepository();
      await repo.create({ code: "taken", url: "https://other.com/" });
      const service = new LinkService(repo, {
        generateCode: () => "taken",
        maxCodeAttempts: 3,
      });
      await expect(service.create("https://a.com")).rejects.toBeInstanceOf(CodeGenerationError);
    });

    it("does not retry on other repository errors", async () => {
      const create = vi.fn().mockRejectedValue(new Error("db is down"));
      const repo = { create } as unknown as LinkRepository;
      const service = new LinkService(repo);

      await expect(service.create("https://a.com")).rejects.toThrow("db is down");
      expect(create).toHaveBeenCalledTimes(1);
    });

    it("retries only on CodeAlreadyExistsError", async () => {
      const create = vi
        .fn()
        .mockRejectedValueOnce(new CodeAlreadyExistsError("x"))
        .mockResolvedValueOnce({ code: "ok", url: "https://a.com/", clicks: 0, createdAt: new Date() });
      const service = new LinkService({ create } as unknown as LinkRepository);

      await service.create("https://a.com");
      expect(create).toHaveBeenCalledTimes(2);
    });
  });

  describe("resolve", () => {
    it("returns the target URL and counts the click", async () => {
      const repo = new InMemoryLinkRepository();
      const service = new LinkService(repo);
      const { code } = await service.create("https://a.com");

      expect(await service.resolve(code)).toBe("https://a.com/");
      await service.resolve(code);

      expect((await repo.findByCode(code))?.clicks).toBe(2);
    });

    it("throws LinkNotFoundError for an unknown code", async () => {
      const service = new LinkService(new InMemoryLinkRepository());
      await expect(service.resolve("nope")).rejects.toBeInstanceOf(LinkNotFoundError);
    });
  });

  describe("list", () => {
    it("returns the stored links", async () => {
      const service = new LinkService(new InMemoryLinkRepository());
      await service.create("https://a.com");
      await service.create("https://b.com");
      expect(await service.list()).toHaveLength(2);
    });
  });
});
