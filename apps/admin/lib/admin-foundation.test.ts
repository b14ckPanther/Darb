import { describe, expect, it } from "vitest";

import type { BusinessModuleState } from "./module-state";
import {
  deriveAdminReadiness,
  getBusinessLifecyclePresentation,
  getHonestModuleAvailability,
} from "./admin-foundation";

describe("admin readiness", () => {
  it("keeps required, recommended, and optional setup explicit without a score", () => {
    const readiness = deriveAdminReadiness({
      appearanceContextCount: 0,
      businessPath: "/b/darb",
      businessProfileValid: true,
      defaultLocaleEnabled: true,
      enabledModuleCount: 0,
      hasCompleteLocationVisibility: true,
      mediaAssetCount: 0,
      primaryDomain: null,
      visibleLocationCount: 0,
    });

    expect(readiness.find((item) => item.key === "business-profile")).toMatchObject({
      importance: "required",
      state: "complete",
    });
    expect(readiness.find((item) => item.key === "locations")).toMatchObject({
      importance: "recommended",
      state: "attention",
    });
    expect(readiness.find((item) => item.key === "domain")).toMatchObject({
      importance: "optional",
      state: "not-applicable",
    });
    expect(readiness.every((item) => !("score" in item))).toBe(true);
  });

  it("does not infer workspace-wide location readiness from scoped RLS visibility", () => {
    const locations = deriveAdminReadiness({
      appearanceContextCount: 1,
      businessPath: "/b/darb",
      businessProfileValid: true,
      defaultLocaleEnabled: true,
      enabledModuleCount: 1,
      hasCompleteLocationVisibility: false,
      mediaAssetCount: 2,
      primaryDomain: "example.com",
      visibleLocationCount: 1,
    }).find((item) => item.key === "locations");

    expect(locations?.state).toBe("unavailable");
    expect(locations?.description).toContain("scoped");
  });
});

describe("lifecycle presentation", () => {
  it("keeps platform suspension distinct from tenant archival", () => {
    expect(getBusinessLifecyclePresentation("suspended")).toMatchObject({
      label: "Suspended by Darb",
      mutationRestricted: true,
      tone: "warning",
    });
    expect(getBusinessLifecyclePresentation("archived")).toMatchObject({
      label: "Archived · read-only",
      mutationRestricted: true,
      tone: "neutral",
    });
    expect(getBusinessLifecyclePresentation("active").mutationRestricted).toBe(false);
  });
});

describe("honest engine readiness", () => {
  const moduleState: BusinessModuleState = {
    description: "A platform capability",
    displayName: "Pages",
    isAvailable: true,
    isEffectivelyEnabled: true,
    isEnabled: true,
    key: "pages",
    sortOrder: 10,
    updatedAt: null,
  };

  it("states that an enabled capability still has no engine administration", () => {
    expect(getHonestModuleAvailability(moduleState)).toEqual({
      detail: "Capability enabled. Its engine administration is not available yet.",
      label: "Enabled · engine pending",
      state: "enabled",
    });
  });

  it("states when a registered engine administration is available", () => {
    expect(getHonestModuleAvailability(moduleState, true)).toEqual({
      detail: "Capability enabled. Its authenticated engine administration is available.",
      label: "Enabled · admin ready",
      state: "enabled",
    });
  });
});
