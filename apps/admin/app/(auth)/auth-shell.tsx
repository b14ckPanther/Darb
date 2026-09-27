import type { ReactNode } from "react";

import { DarbAdminBrand, DarbPublicSiteLink } from "../_components/brand";
import { AdminLanguageSwitcher } from "../_components/language-switcher";

const art = "/experience/threshold";

/**
 * The threshold frame from Main, one step further in: the authentication surfaces continue the
 * public route rather than starting a new world. The doorway art is never mirrored; RTL uses its
 * own pre-rendered wide frame on narrow screens.
 */
function ThresholdArt({ direction }: { direction: "ltr" | "rtl" }) {
  return (
    <picture className="auth-story__art" aria-hidden="true">
      <source
        media="(min-width: 56rem)"
        srcSet={`${art}/threshold-tall-720.avif 720w, ${art}/threshold-tall-1080.avif 1080w`}
        sizes="45vw"
        type="image/avif"
      />
      <source
        media="(min-width: 56rem)"
        srcSet={`${art}/threshold-tall-720.webp 720w, ${art}/threshold-tall-1080.webp 1080w`}
        sizes="45vw"
        type="image/webp"
      />
      <source srcSet={`${art}/threshold-wide-${direction}-1280.avif`} type="image/avif" />
      <source srcSet={`${art}/threshold-wide-${direction}-1280.webp`} type="image/webp" />
      <img
        alt=""
        decoding="async"
        fetchPriority="high"
        height={1920}
        src={`${art}/threshold-tall-1080.webp`}
        width={1080}
      />
    </picture>
  );
}

export function AuthShell({
  children,
  direction,
  panelLabelledBy,
  storyBody,
  storyId,
  storyTitle,
}: Readonly<{
  children: ReactNode;
  direction: "ltr" | "rtl";
  panelLabelledBy: string;
  storyBody: string;
  storyId: string;
  storyTitle: string;
}>) {
  return (
    <main id="main-content" className="auth-layout" data-direction={direction}>
      <div className="auth-arrival-veil" aria-hidden="true" />
      <section className="auth-story" aria-labelledby={storyId}>
        <ThresholdArt direction={direction} />
        <div className="auth-story__veil" aria-hidden="true" />
        <div className="auth-story__brandline">
          <DarbAdminBrand tone="light" />
          <div className="auth-story__actions">
            <AdminLanguageSwitcher />
            <DarbPublicSiteLink className="auth-public-link" label="Back to Darb" />
          </div>
        </div>
        <div className="auth-story__copy">
          <h2 id={storyId}>{storyTitle}</h2>
          <p>{storyBody}</p>
        </div>
      </section>
      <section className="auth-panel" aria-labelledby={panelLabelledBy}>
        {children}
      </section>
    </main>
  );
}
