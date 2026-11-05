import { describe, expect, it } from "vitest";
import { DEFAULT_CODE_LENGTH, generateShortCode } from "./code-generator";

describe("generateShortCode", () => {
  it("uses the default length", () => {
    expect(generateShortCode()).toHaveLength(DEFAULT_CODE_LENGTH);
  });

  it("supports a custom length", () => {
    expect(generateShortCode(12)).toHaveLength(12);
  });

  it("only contains base62 characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateShortCode()).toMatch(/^[0-9A-Za-z]+$/);
    }
  });

  it("does not repeat itself in practice", () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateShortCode()));
    expect(codes.size).toBe(1000);
  });
});
