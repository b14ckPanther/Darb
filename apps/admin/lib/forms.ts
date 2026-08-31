import { isSupportedLocale, type SupportedLocale } from "@darb/i18n";

export type FieldErrors = Readonly<Record<string, string | undefined>>;

export interface FormState {
  fieldErrors?: FieldErrors;
  message?: string;
  status: "idle" | "error";
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

type ParseResult<T> = { data: T; success: true } | { errors: FieldErrors; success: false };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
