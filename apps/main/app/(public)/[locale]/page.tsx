import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { supportedLocales } from "@darb/i18n";

import { Homepage } from "../../../components/homepage";
import { mainSiteCopy } from "../../../lib/copy";
import { serializeJsonLd } from "../../../lib/seo";
import {
  getPublicAlternates,
  getPublicLocaleUrl,
  mainOrigin,
  publicLocaleTags,
  resolvePublicLocale,
} from "../../../lib/site";

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#09291f",
};

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolvePublicLocale(localeParam);
  if (!locale) return {};

  const copy = mainSiteCopy[locale];
  const canonicalUrl = getPublicLocaleUrl(locale);
  const socialImage = `${mainOrigin}/brand/social/darb-og.webp`;

  return {
    applicationName: "Darb — درب",
    alternates: {
      canonical: canonicalUrl,
      languages: getPublicAlternates(),
    },
    description: copy.metadata.description,
    icons: {
      apple: [{ url: "/brand/icons/apple-touch-icon.png", sizes: "180x180" }],
      icon: [
        { url: "/brand/icons/icon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/brand/icons/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
    },
    manifest: "/manifest.webmanifest",
    metadataBase: new URL(mainOrigin),
    openGraph: {
      description: copy.metadata.description,
      images: [{ alt: "Darb", height: 630, url: socialImage, width: 1200 }],
      locale: publicLocaleTags[locale].replace("-", "_"),
      siteName: "Darb — درب",
      title: copy.metadata.title,
      type: "website",
      url: canonicalUrl,
    },
    robots: { follow: true, index: true },
    title: copy.metadata.title,
    twitter: {
      card: "summary_large_image",
      description: copy.metadata.description,
      images: [socialImage],
      title: copy.metadata.title,
    },
  };
}

export default async function PublicLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolvePublicLocale(localeParam);
  if (!locale) notFound();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Darb",
    alternateName: "درب",
    url: mainOrigin,
    logo: `${mainOrigin}/brand/icons/icon-512.png`,
  };

  return (
    <>
      <Homepage locale={locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }}
      />
    </>
  );
}
