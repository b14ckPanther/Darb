import { isSupportedLocale, type SupportedLocale } from "@darb/i18n";

import { isValidTimezone } from "./timezones";

export type FieldErrors = Readonly<Record<string, string | undefined>>;

export interface FormState {
  fieldErrors?: FieldErrors;
  message?: string;
  status: "idle" | "error" | "success";
}

export const initialFormState: FormState = { status: "idle" };

interface LoginInput {
  email: string;
  password: string;
}

interface BusinessBootstrapInput {
  defaultLocale: SupportedLocale;
  displayName: string;
  slug: string;
}

export interface BusinessSettingsInput {
  defaultLocale: SupportedLocale;
  displayName: string;
  slug: string;
  status: "active" | "archived";
  timezone: string;
}

export interface LocationInput {
  addressLine: string;
  countryCode: string;
  displayName: string;
  locality: string;
  postalCode: string;
  status: "active" | "inactive";
  timezone: string;
}

type ParseResult<T> = { data: T; success: true } | { errors: FieldErrors; success: false };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const currencyCodePattern = /^[A-Z]{3}$/;
const countryCodePattern = /^[A-Z]{2}$/;

export function parseLoginInput(formData: FormData): ParseResult<LoginInput> {
  const email = readString(formData, "email").trim().toLowerCase();
  const password = readString(formData, "password");
  const errors: Record<string, string> = {};

  if (!email || email.length > 254 || !emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  } else if (password.length > 1_024) {
    errors.password = "Password is too long.";
  }

  return Object.keys(errors).length > 0
    ? { errors, success: false }
    : { data: { email, password }, success: true };
}

export function parseBusinessBootstrapInput(
  formData: FormData,
): ParseResult<BusinessBootstrapInput> {
  const displayName = readString(formData, "displayName").trim();
  const slug = readString(formData, "slug").trim().toLowerCase();
  const locale = readString(formData, "defaultLocale");
  const errors: Record<string, string> = {};

  if (!displayName || displayName.length > 160) {
    errors.displayName = "Enter a business name between 1 and 160 characters.";
  }

  if (slug.length < 3 || slug.length > 63 || !slugPattern.test(slug)) {
    errors.slug = "Use 3–63 lowercase letters, numbers, and single hyphens.";
  }

  if (!isSupportedLocale(locale)) {
    errors.defaultLocale = "Choose Arabic, Hebrew, or English.";
  }

  if (Object.keys(errors).length > 0 || !isSupportedLocale(locale)) {
    return { errors, success: false };
  }

  return {
    data: { defaultLocale: locale, displayName, slug },
    success: true,
  };
}

export function parseBusinessSettingsInput(formData: FormData): ParseResult<BusinessSettingsInput> {
  const displayName = readString(formData, "displayName").trim();
  const slug = readString(formData, "slug").trim().toLowerCase();
  const defaultLocale = readString(formData, "defaultLocale");
  const timezone = readString(formData, "timezone").trim();
  const status = readString(formData, "status");
  const errors: Record<string, string> = {};

  validateBusinessIdentity(displayName, slug, defaultLocale, errors);

  if (!isValidTimezone(timezone)) {
    errors.timezone = "Choose a valid IANA timezone.";
  }

  if (status !== "active" && status !== "archived") {
    errors.status = "Choose active or archived.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isSupportedLocale(defaultLocale) ||
    (status !== "active" && status !== "archived")
  ) {
    return { errors, success: false };
  }

  return {
    data: { defaultLocale, displayName, slug, status, timezone },
    success: true,
  };
}

export function parseLocationInput(
  formData: FormData,
  mode: "create" | "update",
): ParseResult<LocationInput> {
  const displayName = readString(formData, "displayName").trim();
  const addressLine = readString(formData, "addressLine").trim();
  const locality = readString(formData, "locality").trim();
  const postalCode = readString(formData, "postalCode").trim();
  const countryCode = readString(formData, "countryCode").trim().toUpperCase();
  const timezone = readString(formData, "timezone").trim();
  const requestedStatus = readString(formData, "status");
  const status = mode === "create" ? "active" : requestedStatus;
  const errors: Record<string, string> = {};

  if (!displayName || displayName.length > 160) {
    errors.displayName = "Enter a location name between 1 and 160 characters.";
  }

  validateOptionalLength(addressLine, 500, "addressLine", "Address", errors);
  validateOptionalLength(locality, 160, "locality", "Locality", errors);
  validateOptionalLength(postalCode, 32, "postalCode", "Postal code", errors);

  if (!countryCodePattern.test(countryCode)) {
    errors.countryCode = "Use a two-letter ISO country code.";
  }

  if (timezone && !isValidTimezone(timezone)) {
    errors.timezone = "Choose a valid IANA timezone or inherit the business timezone.";
  }

  if (status !== "active" && status !== "inactive") {
    errors.status = "Choose active or inactive.";
  }

  if (Object.keys(errors).length > 0 || (status !== "active" && status !== "inactive")) {
    return { errors, success: false };
  }

  return {
    data: {
      addressLine,
      countryCode,
      displayName,
      locality,
      postalCode,
      status,
      timezone,
    },
    success: true,
  };
}

export function isValidCurrencyCode(value: string): boolean {
  return currencyCodePattern.test(value);
}

function validateBusinessIdentity(
  displayName: string,
  slug: string,
  locale: string,
  errors: Record<string, string>,
): void {
  if (!displayName || displayName.length > 160) {
    errors.displayName = "Enter a business name between 1 and 160 characters.";
  }

  if (slug.length < 3 || slug.length > 63 || !slugPattern.test(slug)) {
    errors.slug = "Use 3–63 lowercase letters, numbers, and single hyphens.";
  }

  if (!isSupportedLocale(locale)) {
    errors.defaultLocale = "Choose Arabic, Hebrew, or English.";
  }
}

function validateOptionalLength(
  value: string,
  maximum: number,
  field: string,
  label: string,
  errors: Record<string, string>,
): void {
  if (value.length > maximum) {
    errors[field] = `${label} must be ${maximum} characters or fewer.`;
  }
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
