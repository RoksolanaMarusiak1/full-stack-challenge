import { z } from "zod";
import { InvalidUrlError } from "./errors";

/** Length of the URL we actually store and send in the Location header. */
export const MAX_URL_LENGTH = 2048;

/**
 * Cheap first check on the raw input, before any parsing, so a huge string is
 * rejected without being processed. Must be larger than MAX_URL_LENGTH because
 * normalisation can make a URL longer (non-ASCII characters become %XX).
 */
const MAX_RAW_INPUT_LENGTH = 8192;

function parse(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isPrivateIPv4(host: string): boolean {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const a = Number(match[1]);
  const b = Number(match[2]);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(host: string): boolean {
  if (!host.startsWith("[")) return false;
  const h = host.slice(1, -1).toLowerCase();
  return (
    h === "::" ||
    h === "::1" ||
    h.startsWith("fc") ||
    h.startsWith("fd") ||
    h.startsWith("fe80") ||
    h.startsWith("::ffff:") // IPv4-mapped addresses
  );
}

/** URL parsing already normalises tricks like 2130706433 -> 127.0.0.1. */
function isLocalOrPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    isPrivateIPv4(h) ||
    isPrivateIPv6(h)
  );
}

// Checks run in order; the first failing message is shown to the user.
const targetUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(MAX_RAW_INPUT_LENGTH, "That URL is too long")
  .refine(
    (value) => parse(value) !== null,
    "That doesn't look like a valid URL. Start it with http:// or https://",
  )
  // Measured after normalisation: this is what is stored and redirected to.
  .refine(
    (value) => (parse(value)?.href.length ?? 0) <= MAX_URL_LENGTH,
    `URL must be at most ${MAX_URL_LENGTH} characters`,
  )
  .refine(
    (value) => ["http:", "https:"].includes(parse(value)?.protocol ?? ""),
    "Only http:// and https:// links are allowed",
  )
  .refine((value) => {
    const url = parse(value);
    return !url?.username && !url?.password;
  }, "Links with a username or password are not allowed")
  .refine(
    (value) => !isLocalOrPrivateHost(parse(value)?.hostname ?? ""),
    "Links to local or private addresses are not allowed",
  );

/**
 * Validates user input and returns the normalised URL to store.
 * Throws InvalidUrlError with a user-friendly message otherwise.
 */
export function parseTargetUrl(input: unknown): string {
  const result = targetUrlSchema.safeParse(input);
  if (!result.success) {
    throw new InvalidUrlError(result.error.issues[0]?.message ?? "Invalid URL");
  }
  return new URL(result.data).toString();
}
