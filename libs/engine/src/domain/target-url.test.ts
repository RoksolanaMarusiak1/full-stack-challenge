import { describe, expect, it } from "vitest";
import { InvalidUrlError } from "./errors";
import { MAX_URL_LENGTH, parseTargetUrl } from "./target-url";

describe("parseTargetUrl", () => {
  describe("accepts and normalises valid URLs", () => {
    it.each([
      ["https://example.com/a?b=1#c", "https://example.com/a?b=1#c"],
      ["  http://example.com  ", "http://example.com/"],
      ["https://Example.COM", "https://example.com/"],
      ["https://example.com:8080/x", "https://example.com:8080/x"],
      ["http://172.32.0.1", "http://172.32.0.1/"], // just outside the private 172.16-31 range
    ])("%s", (input, expected) => {
      expect(parseTargetUrl(input)).toBe(expected);
    });
  });

  describe("rejects with a user-friendly message", () => {
    it.each([
      ["", "URL is required"],
      ["   ", "URL is required"],
      ["example.com", "valid URL"],
      ["javascript:alert(1)", "http:// and https://"],
      ["data:text/html,<script>1</script>", "http:// and https://"],
      ["ftp://example.com/file", "http:// and https://"],
      ["http://user:pass@example.com", "username or password"],
      ["http://localhost:3000", "local or private"],
      ["http://foo.localhost", "local or private"],
      ["http://foo.local", "local or private"],
      ["http://127.0.0.1", "local or private"],
      ["http://2130706433", "local or private"], // decimal form of 127.0.0.1
      ["http://10.0.0.5/admin", "local or private"],
      ["http://172.16.0.1", "local or private"],
      ["http://172.31.255.255", "local or private"], // upper end of the private 172.16-31 range
      ["http://192.168.1.1", "local or private"],
      ["http://169.254.169.254/latest/meta-data", "local or private"],
      ["http://[::1]/", "local or private"],
    ])("%s", (input, messagePart) => {
      expect(() => parseTargetUrl(input)).toThrow(InvalidUrlError);
      expect(() => parseTargetUrl(input)).toThrow(messagePart);
    });

    it("rejects non-string input", () => {
      expect(() => parseTargetUrl(undefined)).toThrow(InvalidUrlError);
      expect(() => parseTargetUrl(42)).toThrow(InvalidUrlError);
    });
  });

  describe("length", () => {
    const base = "https://a.com/";

    it("accepts exactly the maximum length", () => {
      const url = base + "a".repeat(MAX_URL_LENGTH - base.length);
      expect(parseTargetUrl(url)).toHaveLength(MAX_URL_LENGTH);
    });

    it("rejects one character over", () => {
      const url = base + "a".repeat(MAX_URL_LENGTH - base.length + 1);
      expect(() => parseTargetUrl(url)).toThrow(`at most ${MAX_URL_LENGTH}`);
    });

    it("measures length after normalisation (non-ASCII becomes %XX)", () => {
      // 2000 characters in, but about 12000 once percent-encoded
      const url = "https://example.com/" + "я".repeat(2000);
      expect(() => parseTargetUrl(url)).toThrow(`at most ${MAX_URL_LENGTH}`);
    });

    it("rejects huge input without parsing it", () => {
      expect(() => parseTargetUrl(base + "a".repeat(9000))).toThrow("too long");
    });
  });
});
