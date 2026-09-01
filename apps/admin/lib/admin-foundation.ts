import type { BusinessModuleState } from "./module-state";

export type ReadinessImportance = "optional" | "recommended" | "required";
export type ReadinessState = "complete" | "not-applicable" | "unavailable" | "attention";

export interface AdminReadinessItem {
  description: string;
  href?: string;
  importance: ReadinessImportance;
  key: string;
  label: string;
  state: ReadinessState;
}

export interface AdminReadinessInput {
  appearanceContextCount: number;
  businessPath: string;
  businessProfileValid: boolean;
  defaultLocaleEnabled: boolean;
  enabledModuleCount: number;
  hasCompleteLocationVisibility: boolean;
  mediaAssetCount: number;
  primaryDomain: string | null;
  visibleLocationCount: number;
}

export interface BusinessLifecyclePresentation {
  description: string;
  label: string;
  mutationRestricted: boolean;
  tone: "danger" | "neutral" | "positive" | "warning";
}

export function deriveAdminReadiness(input: AdminReadinessInput): AdminReadinessItem[] {
  return [
    {
      description: input.businessProfileValid
        ? "Canonical identity and regional defaults are configured."
        : "Complete the business identity and regional defaults.",
      href: `${input.businessPath}/settings`,
      importance: "required",
      key: "business-profile",
      label: "Business profile",
      state: input.businessProfileValid ? "complete" : "attention",
    },
    {
      description: input.defaultLocaleEnabled
        ? "The default language is part of the enabled language set."
        : "The default language must remain enabled.",
      href: `${input.businessPath}/languages`,
      importance: "required",
      key: "language-foundation",
      label: "Language foundation",
      state: input.defaultLocaleEnabled ? "complete" : "attention",
    },
    {
      description: !input.hasCompleteLocationVisibility
        ? "Your access is scoped, so workspace-wide location readiness cannot be evaluated."
        : input.visibleLocationCount > 0
          ? `${input.visibleLocationCount} ${input.visibleLocationCount === 1 ? "location is" : "locations are"} available.`
          : "Add a location when the business operates from a physical or service base.",
      href: `${input.businessPath}/locations`,
      importance: "recommended",
      key: "locations",
      label: "Locations",
      state: !input.hasCompleteLocationVisibility
        ? "unavailable"
        : input.visibleLocationCount > 0
          ? "complete"
          : "attention",
    },
    {
      description:
        input.enabledModuleCount > 0
          ? `${input.enabledModuleCount} ${input.enabledModuleCount === 1 ? "capability is" : "capabilities are"} enabled; engines remain separate.`
          : "Enable only the capabilities this business intends to use.",
      href: `${input.businessPath}/modules`,
      importance: "recommended",
      key: "capabilities",
      label: "Product capabilities",
      state: input.enabledModuleCount > 0 ? "complete" : "attention",
    },
    {
      description:
        input.appearanceContextCount > 0
          ? "A validated template foundation is available for an enabled capability."
          : "Appearance becomes available when an enabled capability has a registered template.",
      href: `${input.businessPath}/appearance`,
      importance: "recommended",
      key: "appearance",
      label: "Appearance",
      state: input.appearanceContextCount > 0 ? "complete" : "not-applicable",
    },
    {
      description:
        input.mediaAssetCount > 0
          ? `${input.mediaAssetCount} active ${input.mediaAssetCount === 1 ? "asset is" : "assets are"} ready for future experiences.`
          : "Shared media is optional until a real experience needs it.",
      href: `${input.businessPath}/media`,
      importance: "optional",
      key: "media",
      label: "Shared media",
      state: input.mediaAssetCount > 0 ? "complete" : "not-applicable",
    },
    {
      description: input.primaryDomain
        ? `${input.primaryDomain} is the verified primary domain.`
        : "A custom domain is optional and does not block the workspace.",
      href: `${input.businessPath}/domains`,
      importance: "optional",
      key: "domain",
      label: "Custom domain",
      state: input.primaryDomain ? "complete" : "not-applicable",
    },
  ];
}

export function getBusinessLifecyclePresentation(
  status: "active" | "archived" | "suspended",
): BusinessLifecyclePresentation {
  switch (status) {
    case "active":
      return {
        description: "This business is active and available for authorized administration.",
        label: "Active",
        mutationRestricted: false,
        tone: "positive",
      };
    case "archived":
      return {
        description:
          "This workspace is retained for history. Most changes are unavailable until an authorized administrator reactivates it from Business settings.",
        label: "Archived · read-only",
        mutationRestricted: true,
        tone: "neutral",
      };
    case "suspended":
      return {
        description:
          "Darb has suspended this workspace at platform level. Tenant administration is read-only, and business users cannot reactivate it.",
        label: "Suspended by Darb",
        mutationRestricted: true,
        tone: "warning",
      };
  }
}

export function getHonestModuleAvailability(
  module: BusinessModuleState,
  engineAdminAvailable = false,
): {
  detail: string;
  label: string;
  state: "available" | "disabled" | "enabled" | "unavailable";
} {
  if (!module.isAvailable) {
    return {
      detail: module.isEnabled
        ? "Stored as enabled, but platform availability currently prevents use."
        : "This capability is not currently available for enablement.",
      label: "Unavailable",
      state: "unavailable",
    };
  }

  if (module.isEffectivelyEnabled) {
    if (engineAdminAvailable) {
      return {
        detail: "Capability enabled. Its authenticated engine administration is available.",
        label: "Enabled · admin ready",
        state: "enabled",
      };
    }

    return {
      detail: "Capability enabled. Its engine administration is not available yet.",
      label: "Enabled · engine pending",
      state: "enabled",
    };
  }

  return {
    detail: module.isEnabled
      ? "Stored as enabled, but this business lifecycle currently prevents use."
      : "Capability disabled for this business.",
    label: module.isEnabled ? "Unavailable" : "Disabled",
    state: module.isEnabled ? "unavailable" : "disabled",
  };
}
