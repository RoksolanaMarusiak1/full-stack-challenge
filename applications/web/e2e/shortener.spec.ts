import { expect, test, type Page } from "@playwright/test";
import { randomIp } from "./random-ip";

const SHORT_LINK = /\/s\/[0-9A-Za-z]{7}$/;

async function shorten(page: Page, url: string) {
  await page.goto("/");
  await page.getByLabel("Paste a long URL").fill(url);
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
}

test("shortens a URL and shows the short link", async ({ page }) => {
  await shorten(page, "https://example.com/e2e-shorten");

  const link = page.getByRole("link", { name: SHORT_LINK });
  await expect(link).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
});

test.describe("rejects bad input with a clear message", () => {
  const cases: Array<[string, string, RegExp]> = [
    ["empty input", "", /URL is required/],
    ["no scheme", "example.com", /valid URL/],
    ["javascript: URL", "javascript:alert(1)", /http:\/\/ and https:\/\//],
    ["localhost", "http://localhost:3000", /local or private/],
    ["private IP", "http://192.168.1.1/admin", /local or private/],
    ["credentials in URL", "http://user:pass@example.com", /username or password/],
  ];

  for (const [name, input, message] of cases) {
    test(name, async ({ page }) => {
      await shorten(page, input);

      await expect(page.getByRole("alert")).toContainText(message);
      await expect(page.getByRole("link", { name: SHORT_LINK })).toHaveCount(0);
    });
  }
});

test("redirects with 302 and counts every click", async ({ page, request }) => {
  const target = `https://example.com/e2e-${Date.now()}`;
  await shorten(page, target);

  const href = await page.getByRole("link", { name: SHORT_LINK }).getAttribute("href");
  const path = new URL(href!).pathname; // use the path so it works on any host/port

  const first = await request.get(path, { maxRedirects: 0 });
  expect(first.status()).toBe(302);
  expect(first.headers()["location"]).toBe(target);

  await page.goto("/links");
  const row = page.getByRole("row").filter({ hasText: target });
  await expect(row.getByRole("cell").nth(2)).toHaveText("1");

  await request.get(path, { maxRedirects: 0 });
  await page.reload();
  await expect(row.getByRole("cell").nth(2)).toHaveText("2");
});

test("returns 404 for unknown or malformed codes", async ({ request }) => {
  for (const code of ["doesnotexist", "abc!", "a".repeat(40)]) {
    const response = await request.get(`/s/${encodeURIComponent(code)}`, { maxRedirects: 0 });
    expect(response.status(), code).toBe(404);
  }
});

test("limits link creation per client (20 per minute)", async ({ request }) => {
  const headers = { "X-Forwarded-For": randomIp() }; // own client, own limit
  const statuses: number[] = [];
  let last;

  for (let i = 0; i < 22; i++) {
    last = await request.post("/?index", {
      form: { url: `https://example.com/rl-${Date.now()}-${i}` },
      headers,
    });
    statuses.push(last.status());
  }

  expect(statuses.slice(0, 20).every((status) => status === 200)).toBe(true);
  expect(statuses.slice(20)).toEqual([429, 429]);
  expect(last!.headers()["retry-after"]).toMatch(/^\d+$/);
});
