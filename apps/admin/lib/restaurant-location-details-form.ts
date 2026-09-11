import {
  isRestaurantOpeningInterval,
  restaurantOpeningIntervalsOverlap,
  type RestaurantOpeningInterval,
} from "@darb/restaurant";

import type { FieldErrors } from "./forms";

export interface RestaurantLocationPublicDetailsInput {
  email: string;
  mapUrl: string;
  openingHours: RestaurantOpeningInterval[];
  phone: string;
  websiteUrl: string;
  whatsappPhone: string;
}

type ParseResult =
  | { data: RestaurantLocationPublicDetailsInput; success: true }
  | { errors: FieldErrors; success: false };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const e164Pattern = /^\+[1-9]\d{7,14}$/;

export function parseRestaurantLocationPublicDetailsInput(formData: FormData): ParseResult {
  const phone = read(formData, "phone");
  const email = read(formData, "email").toLowerCase();
  const websiteUrl = read(formData, "websiteUrl");
  const whatsappPhone = read(formData, "whatsappPhone");
  const mapUrl = read(formData, "mapUrl");
  const errors: Record<string, string> = {};

  if (phone && !e164Pattern.test(phone)) errors.phone = "Use an international phone number.";
  if (whatsappPhone && !e164Pattern.test(whatsappPhone))
    errors.whatsappPhone = "Use an international WhatsApp number.";
  if (email && (email.length > 254 || !emailPattern.test(email)))
    errors.email = "Enter a valid public email address.";
  if (websiteUrl && !isSafeHttpsUrl(websiteUrl))
    errors.websiteUrl = "Use a complete HTTPS website address.";
  if (mapUrl && !isSafeHttpsUrl(mapUrl)) errors.mapUrl = "Use a complete HTTPS map address.";

  let openingHours: RestaurantOpeningInterval[] = [];
  try {
    const parsed: unknown = JSON.parse(read(formData, "openingHours") || "[]");
    if (
      !Array.isArray(parsed) ||
      parsed.length > 56 ||
      !parsed.every(isRestaurantOpeningInterval)
    ) {
      errors.openingHours = "Check every opening and closing time.";
    } else if (restaurantOpeningIntervalsOverlap(parsed)) {
      errors.openingHours = "Opening intervals cannot overlap.";
    } else {
      openingHours = parsed;
    }
  } catch {
    errors.openingHours = "Check every opening and closing time.";
  }

  return Object.keys(errors).length > 0
    ? { errors, success: false }
    : {
        data: { email, mapUrl, openingHours, phone, websiteUrl, whatsappPhone },
        success: true,
      };
}

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isSafeHttpsUrl(value: string): boolean {
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
