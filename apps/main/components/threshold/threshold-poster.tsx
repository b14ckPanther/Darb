const base = "/experience/threshold";
const wideWidths = [1280, 1920, 2560] as const;
const tallWidths = [720, 1080] as const;

/** Mirrors the scene's compact test: phones and portrait tablets use the centered frame. */
const wideMedia = "(min-width: 64rem), (min-width: 48rem) and (orientation: landscape)";

function sourceSet(name: string, widths: readonly number[], format: "avif" | "webp") {
  return widths.map((width) => `${base}/${name}-${width}.${format} ${width}w`).join(", ");
}

/**
 * Pre-rendered frames of the threshold scene. They are the complete first-viewport artwork when
 * WebGL is unavailable, motion is reduced, data saving is on, or scripts have not loaded yet.
 */
export function ThresholdPoster({ direction }: { direction: "ltr" | "rtl" }) {
  const wide = `threshold-wide-${direction}`;

  return (
    <picture className="threshold__poster">
      <source
        media={wideMedia}
        sizes="100vw"
        srcSet={sourceSet(wide, wideWidths, "avif")}
        type="image/avif"
      />
      <source
        media={wideMedia}
        sizes="100vw"
        srcSet={sourceSet(wide, wideWidths, "webp")}
        type="image/webp"
      />
      <source
        sizes="100vw"
        srcSet={sourceSet("threshold-tall", tallWidths, "avif")}
        type="image/avif"
      />
      <source
        sizes="100vw"
        srcSet={sourceSet("threshold-tall", tallWidths, "webp")}
        type="image/webp"
      />
      <img
        alt=""
        decoding="async"
        fetchPriority="high"
        height={1920}
        src={`${base}/threshold-tall-1080.webp`}
        width={1080}
      />
    </picture>
  );
}
