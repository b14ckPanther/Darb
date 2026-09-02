import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#09291f",
    description: "Darb is a multilingual Business Experience Platform.",
    dir: "auto",
    display: "standalone",
    icons: [
      { sizes: "192x192", src: "/brand/icons/icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "/brand/icons/icon-512.png", type: "image/png" },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/brand/icons/icon-maskable-512.png",
        type: "image/png",
      },
    ],
    lang: "ar",
    name: "Darb — درب",
    orientation: "any",
    scope: "/",
    short_name: "Darb",
    start_url: "/ar",
    theme_color: "#09291f",
  };
}
