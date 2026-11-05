// Policy lives here, mechanism lives in the engine (RateLimiter).
// Which limits apply and how a client is identified are HTTP concerns of the web app;
// the limiter itself knows nothing about requests, so it stays reusable and testable.
// The `.server` folder keeps this file out of the browser bundle.
import { RateLimiter } from "@url-shortener/engine";

// Creating links is the expensive/abusable action, so it is limited tightly.
export const createLinkLimiter = new RateLimiter({ limit: 20, windowMs: 60_000 });

// Redirects are cheap but still limited, to stop click-count inflation and scraping.
export const redirectLimiter = new RateLimiter({ limit: 120, windowMs: 60_000 });

/**
 * Identify the caller. Behind a trusted reverse proxy (nginx, a load balancer)
 * X-Forwarded-For holds the real client IP. If the app is exposed directly this
 * header can be spoofed and all clients without it share one bucket; a production
 * setup should terminate traffic at a proxy that sets it.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
