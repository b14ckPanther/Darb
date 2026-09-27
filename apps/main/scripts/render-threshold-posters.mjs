/**
 * Renders the threshold scene's poster frames from the live WebGL scene, then derives the
 * delivery set. Masters (lossless WebP) stay in `art/threshold`; optimized AVIF/WebP ship from
 * `public/experience/threshold`.
 *
 * Usage: start Main (`pnpm --filter @darb/main dev`), then
 *   node apps/main/scripts/render-threshold-posters.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const masters = join(root, "art/threshold");
const delivery = join(root, "public/experience/threshold");
const baseUrl = globalThis.process.argv[2] ?? "http://localhost:3000";

const frames = [
  {
    name: "threshold-wide-ltr",
    path: "/en",
    viewport: { width: 1463, height: 823 },
    scale: 1.75,
    widths: [1280, 1920, 2560],
  },
  {
    name: "threshold-wide-rtl",
    path: "/ar",
    viewport: { width: 1463, height: 823 },
    scale: 1.75,
    widths: [1280, 1920, 2560],
  },
  {
    name: "threshold-tall",
    path: "/en",
    viewport: { width: 720, height: 1280 },
    scale: 1.5,
    widths: [720, 1080],
  },
];

await mkdir(masters, { recursive: true });
await mkdir(delivery, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu"] });

for (const frame of frames) {
  const page = await browser.newPage({ deviceScaleFactor: frame.scale, viewport: frame.viewport });
  await page.goto(new globalThis.URL(frame.path, baseUrl).toString(), { waitUntil: "networkidle" });
  await page.locator('[data-threshold][data-scene="live"]').waitFor({ timeout: 20_000 });
  await page.addStyleTag({
    content:
      ".site-header, .threshold__content, .threshold__veil, nextjs-portal { visibility: hidden !important; }",
  });
  await page.waitForTimeout(1200);

  const png = await page.locator(".threshold__media").screenshot({ animations: "disabled" });
  const master = join(masters, `${frame.name}.webp`);
  await sharp(png).webp({ lossless: true }).toFile(master);

  for (const width of frame.widths) {
    const resized = sharp(png).resize({ width });
    await resized
      .clone()
      .avif({ effort: 6, quality: 52 })
      .toFile(join(delivery, `${frame.name}-${width}.avif`));
    await resized
      .clone()
      .webp({ effort: 6, quality: 80 })
      .toFile(join(delivery, `${frame.name}-${width}.webp`));
  }
  await page.close();
  globalThis.console.log(`rendered ${frame.name}`);
}

await browser.close();
