import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DarbBrandLockup, DarbMark, DarbWordmark } from "./darb-brand";

describe("Darb corporate identity", () => {
  it("renders the current shared mark and semantically scoped bilingual wordmark", () => {
    const html = renderToStaticMarkup(<DarbBrandLockup />);

    expect(html).toContain('data-darb-mark="current"');
    expect(html).toContain("src=");
    expect(html).toContain('data-darb-brand="bilingual"');
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="en"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("درب");
    expect(html).toContain("Darb");
  });

  it("supports an accessible mark-only form without duplicating visible wordmarks", () => {
    const html = renderToStaticMarkup(<DarbBrandLockup variant="mark" accessibleLabel="Darb" />);

    expect(html).toContain('aria-label="Darb"');
    expect(html).toContain('data-darb-brand="mark"');
    expect(html).not.toContain("درب");
  });

  it("supports independently composed script-aware wordmarks", () => {
    const arabic = renderToStaticMarkup(<DarbWordmark variant="arabic" />);
    const latin = renderToStaticMarkup(<DarbWordmark variant="latin" />);

    expect(arabic).toContain('lang="ar"');
    expect(arabic).not.toContain("Darb");
    expect(latin).toContain('lang="en"');
    expect(latin).not.toContain("درب");
  });

  it("keeps decorative marks out of the accessibility tree", () => {
    const html = renderToStaticMarkup(<DarbMark aria-hidden="true" />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("aria-label");
  });
});
