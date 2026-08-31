import { describe, expect, it } from "vitest";

import { mapMutationError } from "./mutation-errors";

describe("safe mutation error mapping", () => {
  it("maps slug conflicts to the correct field", () => {
    expect(
      mapMutationError({ code: "23505", message: "internal constraint detail" }, "business"),
    ).toEqual({
      fieldErrors: { slug: "That business slug is already in use." },
      status: "error",
    });
  });

  it("does not expose database details for permission errors", () => {
    expect(
      mapMutationError(
        { code: "42501", message: "BUSINESS_MANAGE_REQUIRED: private detail" },
        "business",
      ),
    ).toEqual({
      message: "You do not have permission to make this change.",
      status: "error",
    });
  });

  it("returns a stable archived-location explanation", () => {
    expect(
      mapMutationError({ code: "P0001", message: "LOCATION_ARCHIVED" }, "location-update"),
    ).toEqual({
      message: "Archived locations are retained as read-only records.",
      status: "error",
    });
  });
});
