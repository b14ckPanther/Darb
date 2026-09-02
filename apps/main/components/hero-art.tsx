import { getImageProps } from "next/image";

export function HeroArt({ alt }: { alt: string }) {
  const common = {
    alt,
    fetchPriority: "high" as const,
    sizes: "100vw",
  };
  const {
    props: { srcSet: desktopSource },
  } = getImageProps({
    ...common,
    src: "/brand/hero/darb-hero-desktop.webp",
    width: 1672,
    height: 941,
    quality: 86,
  });
  const {
    props: { srcSet: mobileSource, ...imageProps },
  } = getImageProps({
    ...common,
    src: "/brand/hero/darb-hero-mobile.webp",
    width: 853,
    height: 1844,
    quality: 84,
  });

  return (
    <picture className="hero-art">
      <source media="(min-width: 64rem)" srcSet={desktopSource} />
      <source media="(min-width: 0px)" srcSet={mobileSource} />
      <img {...imageProps} className="hero-art__image" />
    </picture>
  );
}
