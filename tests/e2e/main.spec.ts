import { expect, test, type Page } from "@playwright/test";
import { mainSiteCopy } from "../../apps/main/lib/copy";

const localeCases = [
  {
    locale: "ar",
    direction: "rtl",
  },
  {
    locale: "he",
    direction: "rtl",
  },
  {
    locale: "en",
    direction: "ltr",
  },
] as const;

const qaViewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

async function documentOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test("resolves the root intentionally to the Arabic public experience", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#hero-title")).toHaveText(
    `${mainSiteCopy.ar.hero.titleLead}${mainSiteCopy.ar.hero.titleAccent}`,
  );
});

for (const localeCase of localeCases) {
  test(`renders the complete ${localeCase.locale} public site and localized metadata`, async ({
    page,
  }) => {
    await page.goto(`/${localeCase.locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", localeCase.locale);
    await expect(page.locator("html")).toHaveAttribute("dir", localeCase.direction);
    const copy = mainSiteCopy[localeCase.locale];
    await expect(page).toHaveTitle(copy.metadata.title);
    await expect(page.locator("#hero-title")).toHaveText(
      `${copy.hero.titleLead}${copy.hero.titleAccent}`,
    );
    await expect(page.locator(".threshold__description")).toHaveText(copy.hero.description);
    await expect(page.locator('[data-darb-mark="current"]').first()).toBeVisible();
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
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      copy.metadata.title,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    const structuredData = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    );
    expect(structuredData).toMatchObject({ "@type": "Organization", name: "Darb" });

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(6);
    await expect(page.getByText("Platform Admin", { exact: true })).toHaveCount(0);

    // Every important statement is real HTML, not canvas content.
    await expect(page.locator("#restaurant-title")).toHaveText(copy.restaurant.title);
    await expect(page.locator(".layers__list button")).toHaveCount(6);
    await expect(page.locator(".foundation__course li")).toHaveCount(6);
    await expect(page.locator(".sign--future")).toHaveCount(3);
    for (const future of await page.locator(".sign--future").all()) {
      await expect(future.locator(".sign__status")).toHaveText(copy.junction.future);
      await expect(future.locator("a")).toHaveCount(0);
    }
  });

  test(`hands the ${localeCase.locale} locale across every cross-app entry point`, async ({
    page,
  }) => {
    const { locale } = localeCase;
    const copy = mainSiteCopy[locale];
    const login = `https://admin.darb.co.il/login?locale=${locale}`;
    const register = `https://admin.darb.co.il/register?locale=${locale}`;
    const restaurant = `https://rest.darb.co.il/${locale}`;

    await page.goto(`/${locale}`);

    await expect(page.getByRole("link", { name: copy.nav.signIn }).first()).toHaveAttribute(
      "href",
      login,
    );
    await expect(page.locator(".site-header__actions .button--gold")).toHaveAttribute(
      "href",
      register,
    );
    await expect(page.locator(".threshold__actions .button--gold")).toHaveAttribute(
      "href",
      register,
    );
    await expect(page.locator(".threshold__actions .button--line")).toHaveAttribute("href", login);
    await expect(page.locator(".arrival__actions .button--gold")).toHaveAttribute("href", register);
    await expect(page.locator(".arrival__actions .button--line")).toHaveAttribute("href", login);
    await expect(page.locator(".sign__link")).toHaveAttribute("href", restaurant);
    await expect(page.locator(".restaurant__actions .button--gold")).toHaveAttribute(
      "href",
      restaurant,
    );

    const adminHrefs = await page
      .locator('a[href*="admin.darb.co.il"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(adminHrefs.length).toBeGreaterThan(4);
    for (const href of adminHrefs) {
      expect(href).toMatch(
        new RegExp(`^https://admin\\.darb\\.co\\.il/(login|register)\\?locale=${locale}$`),
      );
    }
  });
}

test("switches locale through stable public routes", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#hero-title")).toHaveText(
    `${mainSiteCopy.en.hero.titleLead}${mainSiteCopy.en.hero.titleAccent}`,
  );
  await page.getByRole("link", { name: "עברית", exact: true }).first().click();
  await expect(page).toHaveURL(/\/he$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("selects typography by rendered script instead of page locale", async ({ page }) => {
  await page.goto("/en");

  const baseFontStack = await page.locator("body").evaluate((element) => {
    return getComputedStyle(element).fontFamily;
  });
  expect(baseFontStack).toContain("Ubuntu");
  expect(baseFontStack).toContain("Cairo");
  expect(baseFontStack).toContain("Heebo");
  expect(baseFontStack).not.toContain("Fallback");

  const arabicBrand = page.locator('.site-header__home .public-brand [lang="ar"]');
  const hebrewVoice = page.locator('.voices__statement[lang="he"]');
  const arabicVoice = page.locator('.voices__statement[lang="ar"]');
  await expect(arabicBrand).toHaveText("درب");
  await expect
    .poll(() => arabicBrand.evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Cairo");
  await expect
    .poll(() => hebrewVoice.evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Heebo");
  await expect(hebrewVoice).toHaveAttribute("dir", "rtl");
  await expect(arabicVoice).toHaveAttribute("dir", "rtl");
  await expect(page.locator('.voices__statement[lang="en"]')).toHaveAttribute("dir", "ltr");

  await page.goto("/ar");
  const latinBrand = page.locator('.site-header__home .public-brand [lang="en"]');
  await expect(latinBrand).toHaveText("Darb");
  await expect
    .poll(() => latinBrand.evaluate((element) => getComputedStyle(element).fontFamily))
    .toContain("Ubuntu");
});

test("provides a focus-managed mobile directory with locale-preserving actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  const copy = mainSiteCopy.he;

  await expect(page.locator(".site-header__nav")).toBeHidden();
  const opener = page.getByRole("button", { name: copy.nav.openMenu });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: copy.brandDescriptor });
  await expect(dialog).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-navigation-open", "true");
  await expect(dialog.getByRole("link", { name: copy.nav.start })).toHaveAttribute(
    "href",
    "https://admin.darb.co.il/register?locale=he",
  );
  await expect(dialog.getByRole("link", { name: copy.nav.signIn })).toHaveAttribute(
    "href",
    "https://admin.darb.co.il/login?locale=he",
  );

  const targets = await dialog
    .locator("a, button")
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  for (const height of targets) expect(height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator("html")).not.toHaveAttribute("data-navigation-open", "true");

  await opener.click();
  await dialog.getByRole("link", { name: copy.nav.restaurant }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/he#restaurant$/);
});

test("art-directs the threshold poster by viewport and reading direction", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  const poster = page.locator(".threshold__poster img");
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toContain("threshold-tall");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toContain("threshold-wide-rtl");

  await page.goto("/en");
  await expect
    .poll(() => poster.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toContain("threshold-wide-ltr");
  await expect(page.locator(".threshold__canvas")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".threshold__media")).toHaveAttribute("aria-hidden", "true");
});

test("keeps the designed poster when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/en");
  await page.waitForTimeout(2000);

  await expect(page.locator("[data-threshold]")).not.toHaveAttribute("data-scene", "live");
  await expect(page.locator(".threshold__poster img")).toBeVisible();
  await expect(page.locator(".threshold__canvas")).toHaveCSS("opacity", "0");
  await expect(page.locator(".threshold__actions .button--gold")).toBeVisible();
});

test("enhances to the live scene only on hardware-accelerated WebGL", async ({ page }) => {
  await page.goto("/en");
  const renderer = await page.evaluate(() => {
    const context = document.createElement("canvas").getContext("webgl2");
    const debug = context?.getExtension("WEBGL_debug_renderer_info");
    return debug && context ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
  });
  const threshold = page.locator("[data-threshold]");

  if (/swiftshader|llvmpipe|software/i.test(renderer) || renderer === "") {
    await page.waitForTimeout(2000);
    await expect(threshold).not.toHaveAttribute("data-scene", "live");
    await expect(page.locator(".threshold__poster img")).toBeVisible();
  } else {
    await expect(threshold).toHaveAttribute("data-scene", "live", { timeout: 15_000 });
    await expect(page.locator(".threshold__canvas")).toHaveCSS("opacity", "1");
  }
});

test("keeps touch devices on the poster and its compositor-only dolly", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/ar");
  await page.waitForTimeout(2000);

  await expect(page.locator("[data-threshold]")).not.toHaveAttribute("data-scene", "live");
  await expect(page.locator(".threshold__poster img")).toBeVisible();
  await context.close();
});

test("stays usable when the threshold artwork fails to load", async ({ page }) => {
  await page.route("**/experience/threshold/**", (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        addEventListener() {},
        matches: query.includes("reduce"),
        media: query,
        removeEventListener() {},
      }),
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");

  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator(".threshold__actions .button--gold")).toBeInViewport();
  await expect(page.locator(".threshold__media")).toHaveCSS("background-color", "rgb(5, 23, 17)");
  expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
});

test("respects reduced motion without starting the 3D scene", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    (window as unknown as { webglRequests: number }).webglRequests = 0;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith("webgl")) {
        (window as unknown as { webglRequests: number }).webglRequests += 1;
      }
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/he");
  await page.waitForTimeout(2000);

  await expect(page.locator("[data-threshold]")).not.toHaveAttribute("data-scene", "live");
  expect(
    await page.evaluate(() => (window as unknown as { webglRequests: number }).webglRequests),
  ).toBe(0);
  const thresholdHeight = await page
    .locator(".threshold")
    .evaluate((element) => element.clientHeight);
  expect(thresholdHeight).toBeLessThanOrEqual(844 + 1);
  const dolly = await page
    .locator(".threshold__poster img")
    .evaluate((element) => getComputedStyle(element).animationName);
  expect(dolly).toBe("none");
});

test("reflows at 200% text without document overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const locale of ["ar", "he", "en"] as const) {
    await page.goto(`/${locale}`);
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
    await expect(page.locator("#hero-title")).toHaveText(
      `${mainSiteCopy[locale].hero.titleLead}${mainSiteCopy[locale].hero.titleAccent}`,
    );
  }
});

test("composes without horizontal overflow across the QA viewport matrix", async ({ page }) => {
  for (const locale of ["ar", "en"] as const) {
    for (const viewport of qaViewports) {
      await page.setViewportSize(viewport);
      await page.goto(`/${locale}`);
      expect(await documentOverflow(page), `${locale} ${viewport.width}x${viewport.height}`).toBe(
        0,
      );
      await expect(page.locator(".threshold__actions .button--gold")).toBeVisible();
    }
  }
});

test("lets keyboard and pointer users explore the Restaurant layers", async ({ page }) => {
  await page.goto("/en");
  const layers = page.locator(".layers");
  const buttons = page.locator(".layers__list button");

  await expect(buttons.first()).toHaveAttribute("aria-pressed", "true");
  await buttons.nth(2).focus();
  await expect(layers).toHaveAttribute("data-active", "availability");
  await expect(buttons.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(buttons.first()).toHaveAttribute("aria-pressed", "false");

  await buttons.nth(5).click();
  await expect(layers).toHaveAttribute("data-active", "presence");
  await expect(page.locator(".layers__stage")).toHaveAttribute("aria-hidden", "true");
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
