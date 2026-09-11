import { describe, expect, it } from "vitest";

import { parseRestaurantLocationPublicDetailsInput } from "./restaurant-location-details-form";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = {
    email: "hello@example.com",
    mapUrl: "https://maps.example/place",
    openingHours: JSON.stringify([
      { closesAt: "14:00", opensAt: "09:00", weekday: 1 },
      { closesAt: "02:00", opensAt: "18:00", weekday: 1 },
    ]),
    phone: "+972501234567",
    websiteUrl: "https://example.com",
    whatsappPhone: "+972501234567",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("Restaurant location public details form", () => {
  it("accepts safe contact details and split/overnight opening hours", () => {
    expect(parseRestaurantLocationPublicDetailsInput(form())).toEqual({
      data: {
        email: "hello@example.com",
        mapUrl: "https://maps.example/place",
        openingHours: [
          { closesAt: "14:00", opensAt: "09:00", weekday: 1 },
          { closesAt: "02:00", opensAt: "18:00", weekday: 1 },
        ],
        phone: "+972501234567",
        websiteUrl: "https://example.com",
        whatsappPhone: "+972501234567",
      },
      success: true,
    });
  });

  it("rejects unsafe URLs, local phone formats, and overlapping intervals", () => {
    const parsed = parseRestaurantLocationPublicDetailsInput(
      form({
        mapUrl: "javascript:alert(1)",
        openingHours: JSON.stringify([
          { closesAt: "14:00", opensAt: "09:00", weekday: 1 },
          { closesAt: "13:00", opensAt: "12:00", weekday: 1 },
        ]),
        phone: "050-123-4567",
        websiteUrl: "http://example.com",
      }),
    );
    expect(parsed).toEqual({
      errors: expect.objectContaining({
        mapUrl: expect.any(String),
        openingHours: expect.any(String),
        phone: expect.any(String),
        websiteUrl: expect.any(String),
      }),
      success: false,
    });
  });

  it("allows intentionally empty contact details and closed days", () => {
    const parsed = parseRestaurantLocationPublicDetailsInput(
      form({
        email: "",
        mapUrl: "",
        openingHours: "[]",
        phone: "",
        websiteUrl: "",
        whatsappPhone: "",
      }),
    );
    expect(parsed).toMatchObject({ data: { openingHours: [] }, success: true });
  });
});
