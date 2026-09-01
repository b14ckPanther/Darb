export type AdminSemanticStatus =
  | "active"
  | "archived"
  | "available"
  | "disabled"
  | "enabled"
  | "failed"
  | "inactive"
  | "optional"
  | "pending"
  | "recommended"
  | "required"
  | "suspended"
  | "unavailable"
  | "verified";

export type AdminStatusTone = "danger" | "neutral" | "positive" | "warning";

export interface AdminStatusSemantic {
  label: string;
  tone: AdminStatusTone;
}

const statusSemantics: Record<AdminSemanticStatus, AdminStatusSemantic> = {
  active: { label: "Active", tone: "positive" },
  archived: { label: "Archived", tone: "neutral" },
  available: { label: "Available", tone: "positive" },
  disabled: { label: "Disabled", tone: "neutral" },
  enabled: { label: "Enabled", tone: "positive" },
  failed: { label: "Failed", tone: "danger" },
  inactive: { label: "Inactive", tone: "warning" },
  optional: { label: "Optional", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  recommended: { label: "Recommended", tone: "warning" },
  required: { label: "Required", tone: "danger" },
  suspended: { label: "Suspended", tone: "warning" },
  unavailable: { label: "Unavailable", tone: "neutral" },
  verified: { label: "Verified", tone: "positive" },
};

export function getAdminStatusSemantic(status: AdminSemanticStatus): AdminStatusSemantic {
  return statusSemantics[status];
}
