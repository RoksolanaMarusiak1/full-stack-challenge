import { redirect } from "react-router";
import type { Route } from "./+types/s.$code";
import { LinkNotFoundError, linkService } from "@url-shortener/engine";
import { clientKey, redirectLimiter } from "~/.server/rate-limits";

// Our codes are base62 and short; anything else cannot exist, so skip the database.
const CODE_PATTERN = /^[0-9A-Za-z]{1,16}$/;

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!CODE_PATTERN.test(params.code)) {
    throw new Response("Not Found", { status: 404 });
  }

  const limit = redirectLimiter.check(clientKey(request));
  if (!limit.allowed) {
    throw new Response("Too many requests", {
      status: 429,
      statusText: "Too many requests, please slow down",
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  try {
    // resolve() also records the click
    const url = await linkService.resolve(params.code);
    return redirect(url);
  } catch (error) {
    if (error instanceof LinkNotFoundError) {
      throw new Response("Not Found", { status: 404 });
    }
    throw error;
  }
}
