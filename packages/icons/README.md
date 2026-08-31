# `@darb/icons`

This package is the single product-facing boundary for Darb icons and custom SVG artwork.

- Hugeicons is the default icon family.
- Lucide may be used when it is a better semantic or visual fit.
- Custom SVG icons and illustrations are welcome when they improve the product's distinction.
- Product code must not use emojis as icon fallbacks.
- New exports should be curated here; applications should not assemble unrelated icon families.

The package exports only the small Hugeicons set currently required by Darb's authentication and
onboarding interfaces. Add icons deliberately as real interface needs emerge; do not export an
entire family wholesale.
