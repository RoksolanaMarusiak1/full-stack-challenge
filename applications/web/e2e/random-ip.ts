import { randomInt } from "node:crypto";

/**
 * A random client address for the X-Forwarded-For header. The app rate-limits per
 * client, so giving every run (and the rate-limit test) its own address keeps the
 * tests independent from earlier runs and from manual testing.
 */
export function randomIp(): string {
  return `${randomInt(1, 223)}.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
}
