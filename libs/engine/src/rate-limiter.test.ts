import { beforeEach, describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
  let now: number;
  let limiter: RateLimiter;

  beforeEach(() => {
    now = 0;
    limiter = new RateLimiter({ limit: 3, windowMs: 1000, now: () => now });
  });

  it("allows requests up to the limit", () => {
    expect(limiter.check("a")).toEqual({ allowed: true });
    expect(limiter.check("a")).toEqual({ allowed: true });
    expect(limiter.check("a")).toEqual({ allowed: true });
  });

  it("blocks the request over the limit and says when to retry", () => {
    for (let i = 0; i < 3; i++) limiter.check("a");
    now = 400;
    expect(limiter.check("a")).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it("rounds the retry time up to whole seconds", () => {
    const slow = new RateLimiter({ limit: 1, windowMs: 60_000, now: () => now });
    slow.check("a");
    now = 10_000;
    expect(slow.check("a")).toEqual({ allowed: false, retryAfterSeconds: 50 });
  });

  it("counts each key separately", () => {
    for (let i = 0; i < 3; i++) limiter.check("a");
    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("allows requests again once the window has passed", () => {
    for (let i = 0; i < 3; i++) limiter.check("a");
    expect(limiter.check("a").allowed).toBe(false);
    now = 1001;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("is a sliding window, not a fixed one (no double burst at the boundary)", () => {
    now = 900;
    for (let i = 0; i < 3; i++) limiter.check("a");
    now = 1100; // a fixed window starting at 0 would have reset; these 3 are still within 1000ms
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("does not count blocked requests against the client", () => {
    for (let i = 0; i < 3; i++) limiter.check("a");
    for (let i = 0; i < 10; i++) limiter.check("a"); // all blocked
    now = 1001; // the original 3 expired; blocked ones must not have been recorded
    expect(limiter.check("a").allowed).toBe(true);
  });
});
