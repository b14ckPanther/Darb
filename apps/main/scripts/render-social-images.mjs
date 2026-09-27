/**
 * Renders Darb's localized social share images (1200x630) from approved inputs only: the
 * threshold scene masters in `art/threshold`, the approved symbol raster in
 * `public/brand/logo/darb-symbol.png`, and the Cairo / Heebo / Ubuntu wordmark typography used by
 * `@darb/ui`. Nothing is redrawn. Output: `public/brand/social/darb-og-{ar,he,en}.jpg`.
 *
 * Usage: node apps/main/scripts/render-social-images.mjs   (needs network access for Google Fonts)
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public/brand/social");

const copy = {
  ar: {
    lead: "مجالات كثيرة.",
    accent: "درب واحد.",
    line: "منصة وحدة، وكل مجال إله دربه.",
  },
  he: {
    lead: "עולמות שונים.",
    accent: "בסיס אחד.",
    line: "פלטפורמה אחת, ולכל תחום הדרך שלו.",
  },
  en: {
    lead: "Many worlds.",
    accent: "One platform.",
    line: "A path for every kind of business.",
  },
};

const fontFamily = { ar: "Cairo", he: "Heebo", en: "Ubuntu" };

async function dataUri(path, type) {
  return `data:${type};base64,${(await readFile(path)).toString("base64")}`;
}

function page({ locale, corridor, mark }) {
  const rtl = locale !== "en";
  const text = copy[locale];
  return `<!doctype html>
<html lang="${locale}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&family=Heebo:wght@500;600&family=Ubuntu:wght@500;700&display=block" />
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; background: #051711; }
  body { position: relative; color: #fffdf6; font-family: "${fontFamily[locale]}", "Ubuntu", sans-serif; }
  .corridor { position: absolute; inset: 0; background: url(${corridor}) ${rtl ? "33%" : "67%"} 50% / cover no-repeat; transform: scale(1.12); transform-origin: ${rtl ? "33%" : "67%"} 50%; }
  .veil { position: absolute; inset: 0; background:
      linear-gradient(${rtl ? "270deg" : "90deg"}, #051711 0%, rgb(5 23 17 / 94%) 34%, rgb(5 23 17 / 30%) 58%, transparent 74%),
      linear-gradient(180deg, transparent 70%, rgb(5 23 17 / 70%)); }
  .rail { position: absolute; inset-block: 0; inset-inline-start: 72px; width: 2px; background: #daa64d; }
  .rail::before { content: ""; position: absolute; top: 96px; inset-inline-start: -6px; width: 14px; height: 14px; background: #daa64d; transform: rotate(45deg); }
  .content { position: absolute; inset-block: 72px; inset-inline-start: 120px; width: 600px; display: grid; align-content: space-between; }
  .lockup { display: inline-flex; align-items: center; gap: 18px; direction: ltr; justify-self: start; }
  .lockup img { width: 74px; height: auto; filter: drop-shadow(0 10px 22px rgb(0 0 0 / 30%)); }
  .names { display: grid; font-weight: 700; letter-spacing: 0.035em; line-height: 0.94; font-size: 30px; }
  .names .ar { font-family: "Cairo", sans-serif; font-size: 1.18em; letter-spacing: 0; direction: rtl; }
  .names .en { font-family: "Ubuntu", sans-serif; }
  h1 { font-size: ${locale === "ar" ? 78 : 84}px; font-weight: ${locale === "ar" ? 700 : 600}; line-height: ${locale === "ar" ? 1.2 : 1.02}; letter-spacing: ${locale === "en" ? "-0.04em" : "0"}; }
  h1 span { display: block; }
  h1 em { display: block; color: #daa64d; font-style: normal; }
  p { margin-top: 22px; color: rgb(255 253 246 / 76%); font-size: 26px; line-height: 1.45; max-width: 520px; }
  .domain { display: inline-flex; align-items: center; gap: 12px; color: #f2e3bd; font-family: "Ubuntu", sans-serif; font-size: 22px; font-weight: 500; letter-spacing: 0.02em; direction: ltr; justify-self: start; }
  .domain::before { content: ""; width: 34px; height: 2px; background: #daa64d; }
</style>
</head>
<body>
  <div class="corridor"></div>
  <div class="veil"></div>
  <div class="rail"></div>
  <div class="content">
    <div class="lockup"><img src="${mark}" alt="" /><div class="names"><span class="ar">درب</span><span class="en">Darb</span></div></div>
    <div>
      <h1><span>${text.lead}</span><em>${text.accent}</em></h1>
      <p>${text.line}</p>
    </div>
    <div class="domain">darb.co.il</div>
  </div>
</body>
</html>`;
}

const mark = await dataUri(join(root, "public/brand/logo/darb-symbol.png"), "image/png");
const browser = await chromium.launch();

for (const locale of ["ar", "he", "en"]) {
  const direction = locale === "en" ? "ltr" : "rtl";
  const corridor = await dataUri(
    join(root, `art/threshold/threshold-wide-${direction}.webp`),
    "image/webp",
  );
  const tab = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { width: 1200, height: 630 },
  });
  await tab.setContent(page({ locale, corridor, mark }), { waitUntil: "networkidle" });
  await tab.evaluate(() => globalThis.document.fonts.ready);
  const png = await tab.screenshot({ type: "png" });
  await sharp(png)
    .resize(1200, 630)
    .jpeg({ mozjpeg: true, quality: 86 })
    .toFile(join(output, `darb-og-${locale}.jpg`));
  await tab.close();
  globalThis.console.log(`rendered darb-og-${locale}.jpg`);
}

await browser.close();
