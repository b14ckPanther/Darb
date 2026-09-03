import { isSupportedLocale, supportedLocales, type SupportedLocale } from "@darb/i18n";

export type PublicRestaurantAvailability = "available" | "sold_out";

export interface PublicRestaurantTranslation {
  description: string | null;
  locale: SupportedLocale;
  name: string;
}

export interface PublicRestaurantTranslationWithoutDescription {
  locale: SupportedLocale;
  name: string;
}

export interface PublicRestaurantImage {
  altText: string | null;
  height: number | null;
  storageBucket: string;
  storagePath: string;
  width: number | null;
}

export type PublicRestaurantMediaKind = "image" | "video";

export interface PublicRestaurantBrandingMedia extends PublicRestaurantImage {
  durationMs: number | null;
  mediaKind: PublicRestaurantMediaKind;
  mimeType: string;
}

export interface PublicRestaurantBranding {
  hero: PublicRestaurantBrandingMedia | null;
  logo: PublicRestaurantBrandingMedia | null;
}

export interface PublicRestaurantLocation {
  addressLine: string | null;
  countryCode: string;
  displayName: string;
  id: string;
  locality: string | null;
  postalCode: string | null;
  timezone: string;
}

export interface PublicRestaurantAppearance {
  defaultTheme: unknown;
  overrides: unknown;
  templateKey: string;
  templateVersion: number;
  themeSchemaVersion: number;
}

interface PublicRestaurantVariant {
  availabilityStatus: PublicRestaurantAvailability;
  id: string;
  priceMinor: number;
  translations: PublicRestaurantTranslationWithoutDescription[];
}

interface PublicRestaurantModifier {
  availabilityStatus: PublicRestaurantAvailability;
  id: string;
  priceDeltaMinor: number;
  translations: PublicRestaurantTranslationWithoutDescription[];
}

interface PublicRestaurantModifierGroup {
  id: string;
  maximumSelections: number;
  minimumSelections: number;
  modifiers: PublicRestaurantModifier[];
  translations: PublicRestaurantTranslation[];
}

interface PublicRestaurantLocationAvailability {
  availabilityStatus: PublicRestaurantAvailability;
  locationId: string;
}

interface PublicRestaurantItem {
  availabilityStatus: PublicRestaurantAvailability;
  basePriceMinor: number;
  id: string;
  image: PublicRestaurantImage | null;
  locationAvailability: PublicRestaurantLocationAvailability[];
  modifierGroups: PublicRestaurantModifierGroup[];
  translations: PublicRestaurantTranslation[];
  variants: PublicRestaurantVariant[];
}

interface PublicRestaurantCategory {
  id: string;
  image: PublicRestaurantImage | null;
  items: PublicRestaurantItem[];
  translations: PublicRestaurantTranslation[];
}

interface PublicRestaurantMenu {
  categories: PublicRestaurantCategory[];
  id: string;
  translations: PublicRestaurantTranslation[];
}

export interface PublicRestaurantPublication {
  appearance: PublicRestaurantAppearance;
  branding: PublicRestaurantBranding;
  business: {
    currencyCode: string;
    defaultLocale: SupportedLocale;
    displayName: string;
    slug: string;
    timezone: string;
  };
  locales: SupportedLocale[];
  locations: PublicRestaurantLocation[];
  menus: PublicRestaurantMenu[];
  version: 1;
}

export interface PublicRestaurantSitemapEntry {
  businessSlug: string;
  defaultLocale: SupportedLocale;
  locales: SupportedLocale[];
  primaryHostname: string | null;
}

interface LocalizedRestaurantText {
  description: string | null;
  locale: SupportedLocale;
  name: string;
}

export interface LocalizedRestaurantVariant extends Omit<PublicRestaurantVariant, "translations"> {
  locale: SupportedLocale;
  name: string;
}

export interface LocalizedRestaurantModifier extends Omit<
  PublicRestaurantModifier,
  "translations"
> {
  locale: SupportedLocale;
  name: string;
}

export interface LocalizedRestaurantModifierGroup
  extends
    Omit<PublicRestaurantModifierGroup, "modifiers" | "translations">,
    LocalizedRestaurantText {
  modifiers: LocalizedRestaurantModifier[];
}

export interface LocalizedRestaurantItem
  extends
    Omit<
      PublicRestaurantItem,
      "availabilityStatus" | "locationAvailability" | "modifierGroups" | "translations" | "variants"
    >,
    LocalizedRestaurantText {
  availabilityStatus: PublicRestaurantAvailability;
  modifierGroups: LocalizedRestaurantModifierGroup[];
  variants: LocalizedRestaurantVariant[];
}

export interface LocalizedRestaurantCategory
  extends Omit<PublicRestaurantCategory, "items" | "translations">, LocalizedRestaurantText {
  items: LocalizedRestaurantItem[];
}

export interface LocalizedRestaurantMenu
  extends Omit<PublicRestaurantMenu, "categories" | "translations">, LocalizedRestaurantText {
  categories: LocalizedRestaurantCategory[];
}

export interface LocalizedRestaurantPublication extends Omit<PublicRestaurantPublication, "menus"> {
  locale: SupportedLocale;
  menus: LocalizedRestaurantMenu[];
  selectedLocation: PublicRestaurantLocation | null;
}

export function parsePublicRestaurantPublication(
  value: unknown,
): PublicRestaurantPublication | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const business = parseBusiness(value.business);
  const appearance = parseAppearance(value.appearance);
  const branding =
    value.branding === undefined ? { hero: null, logo: null } : parseBranding(value.branding);
  const locales = parseArray(value.locales, parseLocale);
  const locations = parseArray(value.locations, parseLocation);
  const menus = parseArray(value.menus, parseMenu);

  if (!business || !appearance || !branding || !locales || !locations || !menus) return null;
  if (!locales.includes(business.defaultLocale)) return null;

  return { appearance, branding, business, locales, locations, menus, version: 1 };
}

export function parsePublicRestaurantSitemapEntries(
  value: unknown,
): PublicRestaurantSitemapEntry[] | null {
  return parseArray(value, parseSitemapEntry);
}

export function resolvePublicRestaurantLocale(
  requestedLocale: string | null | undefined,
  enabledLocales: readonly SupportedLocale[],
  defaultLocale: SupportedLocale,
): SupportedLocale | null {
  if (requestedLocale === null || requestedLocale === undefined || requestedLocale === "") {
    return enabledLocales.includes(defaultLocale) ? defaultLocale : null;
  }
  return isSupportedLocale(requestedLocale) && enabledLocales.includes(requestedLocale)
    ? requestedLocale
    : null;
}

export function resolvePublicRestaurantTranslation<
  T extends PublicRestaurantTranslation | PublicRestaurantTranslationWithoutDescription,
>(
  translations: readonly T[],
  requestedLocale: SupportedLocale,
  defaultLocale: SupportedLocale,
  enabledLocales: readonly SupportedLocale[],
): T | null {
  const candidates = [requestedLocale, defaultLocale, ...supportedLocales].filter(
    (locale, index, all) => enabledLocales.includes(locale) && all.indexOf(locale) === index,
  );

  for (const locale of candidates) {
    const translation = translations.find((candidate) => candidate.locale === locale);
    if (translation) return translation;
  }
  return null;
}

export function resolvePublicRestaurantLocation(
  locations: readonly PublicRestaurantLocation[],
  requestedLocationId: string | null | undefined,
): PublicRestaurantLocation | null {
  if (requestedLocationId) {
    return locations.find((location) => location.id === requestedLocationId) ?? null;
  }
  return locations.length === 1 ? (locations[0] ?? null) : null;
}

export function localizeRestaurantPublication(
  publication: PublicRestaurantPublication,
  locale: SupportedLocale,
  requestedLocationId?: string | null,
): LocalizedRestaurantPublication {
  const selectedLocation = resolvePublicRestaurantLocation(
    publication.locations,
    requestedLocationId,
  );
  const translate = <
    T extends PublicRestaurantTranslation | PublicRestaurantTranslationWithoutDescription,
  >(
    translations: readonly T[],
  ) =>
    resolvePublicRestaurantTranslation(
      translations,
      locale,
      publication.business.defaultLocale,
      publication.locales,
    );

  const menus = publication.menus.flatMap<LocalizedRestaurantMenu>((menu) => {
    const text = translate(menu.translations);
    if (!text) return [];
    const categories = menu.categories.flatMap<LocalizedRestaurantCategory>((category) => {
      const categoryText = translate(category.translations);
      if (!categoryText) return [];
      const items = category.items.flatMap<LocalizedRestaurantItem>((item) => {
        const itemText = translate(item.translations);
        if (!itemText) return [];
        const locationOverride = selectedLocation
          ? item.locationAvailability.find(
              (availability) => availability.locationId === selectedLocation.id,
            )?.availabilityStatus
          : null;
        const variants = item.variants.flatMap<LocalizedRestaurantVariant>((variant) => {
          const variantText = translate(variant.translations);
          return variantText
            ? [
                {
                  ...withoutTranslations(variant),
                  locale: variantText.locale,
                  name: variantText.name,
                },
              ]
            : [];
        });
        const modifierGroups = item.modifierGroups.flatMap<LocalizedRestaurantModifierGroup>(
          (group) => {
            const groupText = translate(group.translations);
            if (!groupText) return [];
            const modifiers = group.modifiers.flatMap<LocalizedRestaurantModifier>((modifier) => {
              const modifierText = translate(modifier.translations);
              return modifierText
                ? [
                    {
                      ...withoutTranslations(modifier),
                      locale: modifierText.locale,
                      name: modifierText.name,
                    },
                  ]
                : [];
            });
            return [
              {
                ...withoutTranslationsAndModifiers(group),
                description: groupText.description,
                locale: groupText.locale,
                modifiers,
                name: groupText.name,
              },
            ];
          },
        );

        return [
          {
            availabilityStatus: locationOverride ?? item.availabilityStatus,
            basePriceMinor: item.basePriceMinor,
            description: itemText.description,
            id: item.id,
            image: item.image,
            locale: itemText.locale,
            modifierGroups,
            name: itemText.name,
            variants,
          },
        ];
      });

      return [
        {
          description: categoryText.description,
          id: category.id,
          image: category.image,
          items,
          locale: categoryText.locale,
          name: categoryText.name,
        },
      ];
    });

    return [
      {
        categories,
        description: text.description,
        id: menu.id,
        locale: text.locale,
        name: text.name,
      },
    ];
  });

  return { ...publication, locale, menus, selectedLocation };
}

export function formatRestaurantMoney(
  amountMinor: number,
  currencyCode: string,
  locale: SupportedLocale,
  showPositiveSign = false,
): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError("Invalid minor-unit amount");
  }
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new RangeError("Invalid currency code");

  const localeTag = { ar: "ar-IL", en: "en-IL", he: "he-IL" }[locale];
  const currencyFormatter = new Intl.NumberFormat(localeTag, {
    currency: currencyCode,
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
    signDisplay: showPositiveSign ? "always" : "auto",
    style: "currency",
  });
  const fractionDigits =
    new Intl.NumberFormat(localeTag, {
      currency: currencyCode,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits ?? 2;
  const scale = 10n ** BigInt(fractionDigits);
  const amount = BigInt(amountMinor);
  const whole = amount / scale;
  const fraction = amount % scale;
  const hasFraction = fraction !== 0n;
  const wholeText = new Intl.NumberFormat(localeTag, {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(whole);
  const fractionText = hasFraction
    ? new Intl.NumberFormat(localeTag, {
        minimumIntegerDigits: fractionDigits,
        useGrouping: false,
      }).format(fraction)
    : "";
  const template = currencyFormatter.formatToParts(hasFraction ? 1.1 : 1);
  let insertedInteger = false;

  return template
    .flatMap((part) => {
      if (part.type === "integer") {
        if (insertedInteger) return [];
        insertedInteger = true;
        return [wholeText];
      }
      if (part.type === "group") return [];
      if (part.type === "fraction") return hasFraction ? [fractionText] : [];
      if (part.type === "decimal") return hasFraction ? [part.value] : [];
      return [part.value];
    })
    .join("");
}

export function restaurantMoneyToDecimalString(amountMinor: number, currencyCode: string): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new RangeError("Invalid minor-unit amount");
  }
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new RangeError("Invalid currency code");

  const fractionDigits =
    new Intl.NumberFormat("en", {
      currency: currencyCode,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits ?? 2;
  const scale = 10n ** BigInt(fractionDigits);
  const amount = BigInt(amountMinor);
  const whole = amount / scale;
  const fraction = amount % scale;

  return fractionDigits === 0
    ? whole.toString()
    : `${whole}.${fraction.toString().padStart(fractionDigits, "0")}`;
}

function parseBusiness(value: unknown): PublicRestaurantPublication["business"] | null {
  if (!isRecord(value)) return null;
  const defaultLocale = parseLocale(value.defaultLocale);
  if (
    !defaultLocale ||
    !isNonemptyString(value.currencyCode) ||
    !isNonemptyString(value.displayName) ||
    !isNonemptyString(value.slug) ||
    !isNonemptyString(value.timezone)
  ) {
    return null;
  }
  return {
    currencyCode: value.currencyCode,
    defaultLocale,
    displayName: value.displayName,
    slug: value.slug,
    timezone: value.timezone,
  };
}

function parseSitemapEntry(value: unknown): PublicRestaurantSitemapEntry | null {
  if (!isRecord(value) || !isNonemptyString(value.business_slug)) return null;
  const defaultLocale = parseLocale(value.default_locale);
  const locales = parseArray(value.locales, parseLocale);
  const primaryHostname = parseNullableString(value.primary_hostname);
  if (!defaultLocale || !locales || primaryHostname === undefined) return null;
  if (!locales.includes(defaultLocale)) return null;
  if (
    primaryHostname !== null &&
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      primaryHostname,
    )
  ) {
    return null;
  }
  return {
    businessSlug: value.business_slug,
    defaultLocale,
    locales,
    primaryHostname,
  };
}

function parseAppearance(value: unknown): PublicRestaurantAppearance | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.templateKey) ||
    !isNonnegativeInteger(value.templateVersion) ||
    value.templateVersion === 0 ||
    !isNonnegativeInteger(value.themeSchemaVersion) ||
    value.themeSchemaVersion === 0
  ) {
    return null;
  }
  return {
    defaultTheme: value.defaultTheme,
    overrides: value.overrides,
    templateKey: value.templateKey,
    templateVersion: value.templateVersion,
    themeSchemaVersion: value.themeSchemaVersion,
  };
}

function parseBranding(value: unknown): PublicRestaurantBranding | null {
  if (!isRecord(value)) return null;
  const hero = parseNullable(value.hero, parseBrandingMedia);
  const logo = parseNullable(value.logo, parseBrandingMedia);
  if (hero === undefined || logo === undefined || logo?.mediaKind === "video") return null;
  return { hero, logo };
}

function parseBrandingMedia(value: unknown): PublicRestaurantBrandingMedia | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.storageBucket) ||
    !isNonemptyString(value.storagePath) ||
    !isNonemptyString(value.mimeType) ||
    !isMediaKind(value.mediaKind) ||
    !value.mimeType.startsWith(`${value.mediaKind}/`)
  ) {
    return null;
  }
  const altText = parseNullableString(value.altText);
  const durationMs = parseNullableInteger(value.durationMs);
  const height = parseNullableInteger(value.height);
  const width = parseNullableInteger(value.width);
  return altText !== undefined &&
    durationMs !== undefined &&
    height !== undefined &&
    width !== undefined
    ? {
        altText,
        durationMs,
        height,
        mediaKind: value.mediaKind,
        mimeType: value.mimeType,
        storageBucket: value.storageBucket,
        storagePath: value.storagePath,
        width,
      }
    : null;
}

function parseLocation(value: unknown): PublicRestaurantLocation | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.countryCode) ||
    !isNonemptyString(value.displayName) ||
    !isNonemptyString(value.id) ||
    !isNonemptyString(value.timezone)
  ) {
    return null;
  }
  const addressLine = parseNullableString(value.addressLine);
  const locality = parseNullableString(value.locality);
  const postalCode = parseNullableString(value.postalCode);
  if (addressLine === undefined || locality === undefined || postalCode === undefined) return null;
  return {
    addressLine,
    countryCode: value.countryCode,
    displayName: value.displayName,
    id: value.id,
    locality,
    postalCode,
    timezone: value.timezone,
  };
}

function parseMenu(value: unknown): PublicRestaurantMenu | null {
  if (!isRecord(value) || !isNonemptyString(value.id)) return null;
  const categories = parseArray(value.categories, parseCategory);
  const translations = parseArray(value.translations, parseTranslation);
  return categories && translations ? { categories, id: value.id, translations } : null;
}

function parseCategory(value: unknown): PublicRestaurantCategory | null {
  if (!isRecord(value) || !isNonemptyString(value.id)) return null;
  const image = parseNullable(value.image, parseImage);
  const items = parseArray(value.items, parseItem);
  const translations = parseArray(value.translations, parseTranslation);
  return image !== undefined && items && translations
    ? { id: value.id, image, items, translations }
    : null;
}

function parseItem(value: unknown): PublicRestaurantItem | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.id) ||
    !isNonnegativeInteger(value.basePriceMinor) ||
    !isAvailability(value.availabilityStatus)
  ) {
    return null;
  }
  const image = parseNullable(value.image, parseImage);
  const locationAvailability = parseArray(value.locationAvailability, parseLocationAvailability);
  const modifierGroups = parseArray(value.modifierGroups, parseModifierGroup);
  const translations = parseArray(value.translations, parseTranslation);
  const variants = parseArray(value.variants, parseVariant);
  return image !== undefined && locationAvailability && modifierGroups && translations && variants
    ? {
        availabilityStatus: value.availabilityStatus,
        basePriceMinor: value.basePriceMinor,
        id: value.id,
        image,
        locationAvailability,
        modifierGroups,
        translations,
        variants,
      }
    : null;
}

function parseVariant(value: unknown): PublicRestaurantVariant | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.id) ||
    !isNonnegativeInteger(value.priceMinor) ||
    !isAvailability(value.availabilityStatus)
  ) {
    return null;
  }
  const translations = parseArray(value.translations, parseTranslationWithoutDescription);
  return translations
    ? {
        availabilityStatus: value.availabilityStatus,
        id: value.id,
        priceMinor: value.priceMinor,
        translations,
      }
    : null;
}

function parseModifierGroup(value: unknown): PublicRestaurantModifierGroup | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.id) ||
    !isNonnegativeInteger(value.minimumSelections) ||
    !isNonnegativeInteger(value.maximumSelections) ||
    value.maximumSelections < 1 ||
    value.minimumSelections > value.maximumSelections
  ) {
    return null;
  }
  const modifiers = parseArray(value.modifiers, parseModifier);
  const translations = parseArray(value.translations, parseTranslation);
  return modifiers && translations
    ? {
        id: value.id,
        maximumSelections: value.maximumSelections,
        minimumSelections: value.minimumSelections,
        modifiers,
        translations,
      }
    : null;
}

function parseModifier(value: unknown): PublicRestaurantModifier | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.id) ||
    !isNonnegativeInteger(value.priceDeltaMinor) ||
    !isAvailability(value.availabilityStatus)
  ) {
    return null;
  }
  const translations = parseArray(value.translations, parseTranslationWithoutDescription);
  return translations
    ? {
        availabilityStatus: value.availabilityStatus,
        id: value.id,
        priceDeltaMinor: value.priceDeltaMinor,
        translations,
      }
    : null;
}

function parseLocationAvailability(value: unknown): PublicRestaurantLocationAvailability | null {
  return isRecord(value) &&
    isNonemptyString(value.locationId) &&
    isAvailability(value.availabilityStatus)
    ? { availabilityStatus: value.availabilityStatus, locationId: value.locationId }
    : null;
}

function parseTranslation(value: unknown): PublicRestaurantTranslation | null {
  if (!isRecord(value) || !isNonemptyString(value.name)) return null;
  const locale = parseLocale(value.locale);
  const description = parseNullableString(value.description);
  return locale && description !== undefined ? { description, locale, name: value.name } : null;
}

function parseTranslationWithoutDescription(
  value: unknown,
): PublicRestaurantTranslationWithoutDescription | null {
  if (!isRecord(value) || !isNonemptyString(value.name)) return null;
  const locale = parseLocale(value.locale);
  return locale ? { locale, name: value.name } : null;
}

function parseImage(value: unknown): PublicRestaurantImage | null {
  if (
    !isRecord(value) ||
    !isNonemptyString(value.storageBucket) ||
    !isNonemptyString(value.storagePath)
  ) {
    return null;
  }
  const altText = parseNullableString(value.altText);
  const height = parseNullableInteger(value.height);
  const width = parseNullableInteger(value.width);
  return altText !== undefined && height !== undefined && width !== undefined
    ? { altText, height, storageBucket: value.storageBucket, storagePath: value.storagePath, width }
    : null;
}

function parseLocale(value: unknown): SupportedLocale | null {
  return typeof value === "string" && isSupportedLocale(value) ? value : null;
}

function parseArray<T>(value: unknown, parser: (entry: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const entries = value.map(parser);
  return entries.every((entry): entry is T => entry !== null) ? entries : null;
}

function parseNullable<T>(
  value: unknown,
  parser: (entry: unknown) => T | null,
): T | null | undefined {
  if (value === null) return null;
  return parser(value) ?? undefined;
}

function parseNullableString(value: unknown): string | null | undefined {
  return value === null ? null : typeof value === "string" ? value : undefined;
}

function parseNullableInteger(value: unknown): number | null | undefined {
  return value === null ? null : isNonnegativeInteger(value) ? value : undefined;
}

function isAvailability(value: unknown): value is PublicRestaurantAvailability {
  return value === "available" || value === "sold_out";
}

function isMediaKind(value: unknown): value is PublicRestaurantMediaKind {
  return value === "image" || value === "video";
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withoutTranslations<T extends { translations: unknown }>(
  value: T,
): Omit<T, "translations"> {
  const { translations, ...rest } = value;
  void translations;
  return rest;
}

function withoutTranslationsAndModifiers<T extends { modifiers: unknown; translations: unknown }>(
  value: T,
): Omit<T, "modifiers" | "translations"> {
  const { modifiers, translations, ...rest } = value;
  void modifiers;
  void translations;
  return rest;
}
