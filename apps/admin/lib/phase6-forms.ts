import { isSupportedLocale, type SupportedLocale } from "@darb/i18n";

import type { FieldErrors } from "./forms";
import { validateMediaCandidate, type ValidMediaCandidate } from "./media-validation";

type ParseResult<T> = { data: T; success: true } | { errors: FieldErrors; success: false };

export interface MediaUploadInput extends ValidMediaCandidate {
  altText: string;
  durationMs: number | null;
  height: number | null;
  width: number | null;
}

export interface MediaUploadRequest {
  altText?: string;
  byteSize: number;
  durationMs?: number | null;
  filename: string;
  height?: number | null;
  mimeType: string;
  width?: number | null;
}

export function parseMediaUploadRequest(
  request: MediaUploadRequest,
): ParseResult<MediaUploadInput> {
  const candidate = validateMediaCandidate(request);
  const altText = request.altText?.trim() ?? "";
  const width = normalizeOptionalInteger(request.width);
  const height = normalizeOptionalInteger(request.height);
  const durationMs = normalizeOptionalInteger(request.durationMs);
  const errors: Record<string, string> = {};

  if (!candidate.success) {
    errors.file = candidate.message;
  }

  if (altText.length > 500) {
    errors.altText = "Alternative text must be 500 characters or fewer.";
  }

  if (
    (width === null) !== (height === null) ||
    !isValidDimension(width) ||
    !isValidDimension(height)
  ) {
    errors.file = "The image dimensions could not be validated.";
  }

  if (durationMs !== null && (durationMs <= 0 || !Number.isSafeInteger(durationMs))) {
    errors.file = "The video duration could not be validated.";
  }

  if (!candidate.success || Object.keys(errors).length > 0) {
    return { errors, success: false };
  }

  if (candidate.data.kind === "image" && durationMs !== null) {
    return { errors: { file: "Image uploads cannot include video duration." }, success: false };
  }

  return {
    data: { ...candidate.data, altText, durationMs, height, width },
    success: true,
  };
}

export function parseMediaAltText(formData: FormData): ParseResult<{ altText: string }> {
  const value = formData.get("altText");
  const altText = typeof value === "string" ? value.trim() : "";

  return altText.length <= 500
    ? { data: { altText }, success: true }
    : {
        errors: { altText: "Alternative text must be 500 characters or fewer." },
        success: false,
      };
}

export function parseBusinessLocalesInput(
  formData: FormData,
): ParseResult<{ defaultLocale: SupportedLocale; enabledLocales: SupportedLocale[] }> {
  const defaultValue = formData.get("defaultLocale");
  const defaultLocale = typeof defaultValue === "string" ? defaultValue : "";
  const enabledLocales = formData
    .getAll("enabledLocales")
    .filter((value): value is string => typeof value === "string")
    .filter(isSupportedLocale);
  const uniqueEnabledLocales = [...new Set(enabledLocales)];
  const errors: Record<string, string> = {};

  if (!isSupportedLocale(defaultLocale)) {
    errors.defaultLocale = "Choose Arabic, Hebrew, or English as the default.";
  }

  if (uniqueEnabledLocales.length === 0) {
    errors.enabledLocales = "Enable at least one supported language.";
  }

  if (isSupportedLocale(defaultLocale) && !uniqueEnabledLocales.includes(defaultLocale)) {
    errors.enabledLocales = "The default language must remain enabled.";
  }

  if (Object.keys(errors).length > 0 || !isSupportedLocale(defaultLocale)) {
    return { errors, success: false };
  }

  return {
    data: { defaultLocale, enabledLocales: uniqueEnabledLocales },
    success: true,
  };
}

function normalizeOptionalInteger(value: number | null | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function isValidDimension(value: number | null): boolean {
  return value === null || (Number.isSafeInteger(value) && value >= 1 && value <= 50_000);
}
