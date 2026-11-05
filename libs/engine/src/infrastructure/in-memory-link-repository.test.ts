import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodeAlreadyExistsError } from "../domain/errors";
import { InMemoryLinkRepository } from "./in-memory-link-repository";

describe("InMemoryLinkRepository", () => {
  let repo: InMemoryLinkRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    repo = new InMemoryLinkRepository();
  });
  afterEach(() => vi.useRealTimers());

  it("creates a link with zero clicks", async () => {
    const link = await repo.create({ code: "abc", url: "https://a.com/" });
    expect(link).toMatchObject({ code: "abc", url: "https://a.com/", clicks: 0 });
    expect(await repo.findByCode("abc")).toMatchObject({ code: "abc" });
  });

  it("throws CodeAlreadyExistsError on a duplicate code", async () => {
    await repo.create({ code: "abc", url: "https://a.com/" });
    await expect(repo.create({ code: "abc", url: "https://b.com/" })).rejects.toBeInstanceOf(
      CodeAlreadyExistsError,
    );
  });

  it("returns null for unknown codes", async () => {
    expect(await repo.findByCode("nope")).toBeNull();
    expect(await repo.incrementClicks("nope")).toBeNull();
  });

  it("increments clicks", async () => {
    await repo.create({ code: "abc", url: "https://a.com/" });
    await repo.incrementClicks("abc");
    const link = await repo.incrementClicks("abc");
    expect(link?.clicks).toBe(2);
  });

  it("returns copies so callers cannot change stored data", async () => {
    const created = await repo.create({ code: "abc", url: "https://a.com/" });
    created.clicks = 999;
    expect((await repo.findByCode("abc"))?.clicks).toBe(0);
  });

  it("lists newest first", async () => {
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    await repo.create({ code: "old", url: "https://a.com/" });
    vi.setSystemTime(new Date("2026-01-01T11:00:00Z"));
    await repo.create({ code: "new", url: "https://b.com/" });
    expect((await repo.list()).map((l) => l.code)).toEqual(["new", "old"]);
  });
});
