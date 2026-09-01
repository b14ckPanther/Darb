import { describe, expect, it } from "vitest";

import { getAdminStatusSemantic } from "./status";

describe("semantic admin statuses", () => {
  it("uses shared labels and tones for common lifecycle states", () => {
    expect(getAdminStatusSemantic("active")).toEqual({ label: "Active", tone: "positive" });
    expect(getAdminStatusSemantic("suspended")).toEqual({
      label: "Suspended",
      tone: "warning",
    });
    expect(getAdminStatusSemantic("failed")).toEqual({ label: "Failed", tone: "danger" });
    expect(getAdminStatusSemantic("disabled")).toEqual({
      label: "Disabled",
      tone: "neutral",
    });
  });
});
