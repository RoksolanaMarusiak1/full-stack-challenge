import { randomInt } from "node:crypto";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const DEFAULT_CODE_LENGTH = 7;

/**
 * Random base62 code. 62^7 ≈ 3.5 trillion combinations (the original had 9).
 * Uses crypto.randomInt so codes are not predictable like Math.random() ones.
 * Collisions are still possible in theory; the service retries on them.
 */
export function generateShortCode(length: number = DEFAULT_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
