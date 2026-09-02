import { expect, test } from "@playwright/test";

const localeCases = [
  {
    locale: "ar",
    direction: "rtl",
    heading: "عملك. بطريقك.",
    title: "درب — أساس رقمي بطريق عملك",
  },
  {
    locale: "he",
    direction: "rtl",
    heading: "העסק שלך. בדרך שלך.",
    title: "Darb — בסיס דיגיטלי בדרך של העסק שלך",
  },
  {
    locale: "en",
    direction: "ltr",
    heading: "Your business. Your way.",
    title: "Darb — A digital foundation, your way",
  },
] as const;

test("resolves the root intentionally to the Arabic public experience", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: "عملك. بطريقك." })).toBeVisible();
});

for (const localeCase of localeCases) {
  test(`renders the complete ${localeCase.locale} public site and localized metadata`, async ({
    page,
  }) => {
    await page.goto(`/${localeCase.locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", localeCase.locale);
    await expect(page.locator("html")).toHaveAttribute("dir", localeCase.direction);
    await expect(page).toHaveTitle(localeCase.title);
    await expect(page.getByRole("heading", { level: 1, name: localeCase.heading })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://darb.co.il/${localeCase.locale}`,
    );
    await expect(page.locator('link[hreflang="ar-IL"]')).toHaveAttribute(
      "href",
      "https://darb.co.il/ar",
    );
    await expect(page.locator('link[hreflang="he-IL"]')).toHaveAttribute(
      "href",
      "https://darb.co.il/he",
    );
    await expect(page.locator('link[hreflang="en-IL"]')).toHaveAttribute(
      "href",
      "https://darb.co.il/en",
    );
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      "href",
      "https://darb.co.il",
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(6);
    await expect(page.getByText("Platform Admin", { exact: true })).toHaveCount(0);
  });
}

test("switches locale through stable public routes", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your business. Your way." }),
  ).toBeVisible();
});

test("provides a focus-managed mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");

  const opener = page.getByRole("button", { name: "Open menu" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Business Experience Platform" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-navigation-open", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator("html")).not.toHaveAttribute("data-navigation-open", "true");
});

test("uses the approved mobile and desktop hero art deliberately", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  const heroImage = page.locator(".hero-art__image");
  await expect(heroImage).toBeVisible();
  await expect
    .poll(() => heroImage.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toContain("darb-hero-mobile");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect
    .poll(() => heroImage.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toContain("darb-hero-desktop");
});

test("reflows without document overflow and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const animationDuration = await page
    .locator(".hero__scroll-line")
    .evaluate((element) => getComputedStyle(element, "::after").animationDuration);
  expect(Number.parseFloat(animationDuration)).toBeLessThanOrEqual(0.00001);
  await expect(page.getByRole("heading", { level: 1, name: "העסק שלך. בדרך שלך." })).toBeVisible();
});

test("publishes index, sitemap, manifest, health, and hardened headers", async ({ request }) => {
  const [pageResponse, robots, sitemap, manifest, health] = await Promise.all([
    request.get("/en"),
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
    request.get("/manifest.webmanifest"),
    request.get("/health"),
  ]);

  expect(pageResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expect(pageResponse.headers()["x-frame-options"]).toBe("DENY");
  expect(pageResponse.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(pageResponse.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");

  const robotsText = await robots.text();
  expect(robotsText).toContain("Allow: /ar");
  expect(robotsText).toContain("Allow: /he");
  expect(robotsText).toContain("Allow: /en");
  expect(robotsText).toContain("Disallow: /health");

  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("https://darb.co.il/ar");
  expect(sitemapText).toContain("https://darb.co.il/he");
  expect(sitemapText).toContain("https://darb.co.il/en");
  expect(sitemapText).toContain('hreflang="ar-IL"');
  expect(sitemapText).toContain('hreflang="he-IL"');
  expect(sitemapText).toContain('hreflang="en-IL"');
  expect(sitemapText).toContain('hreflang="x-default"');

  const manifestBody = await manifest.json();
  expect(manifestBody).toMatchObject({
    name: "Darb — درب",
    short_name: "Darb",
    start_url: "/ar",
    theme_color: "#09291f",
  });
  expect(manifestBody.icons).toHaveLength(3);

  expect(await health.json()).toEqual({ service: "darb-main", status: "ok" });
  expect(health.headers()["cache-control"]).toContain("no-store");
});
