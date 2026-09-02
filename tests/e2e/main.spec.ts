import { expect, test } from "@playwright/test";

test("renders the public application foundation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Platform foundation" })).toBeVisible();
  await expect(page.getByText("darb.co.il", { exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://darb.co.il");
});

test("publishes a minimal index policy, sitemap, health response, and security headers", async ({
  request,
}) => {
  const [pageResponse, robots, sitemap, health] = await Promise.all([
    request.get("/"),
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
    request.get("/health"),
  ]);
  expect(pageResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expect(pageResponse.headers()["x-frame-options"]).toBe("DENY");
  expect(pageResponse.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(pageResponse.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(robots.text()).resolves.toContain("Allow: /");
  await expect(sitemap.text()).resolves.toContain("https://darb.co.il");
  expect(await health.json()).toEqual({ service: "darb-main", status: "ok" });
  expect(health.headers()["cache-control"]).toContain("no-store");
});
