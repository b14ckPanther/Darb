import type { FormState } from "./forms";

interface DatabaseErrorLike {
  code?: string;
  message?: string;
}

export type MutationKind = "business" | "location-archive" | "location-create" | "location-update";

export function mapMutationError(error: DatabaseErrorLike, kind: MutationKind): FormState {
  if (error.code === "23505" && kind === "business") {
    return {
      fieldErrors: { slug: "That business slug is already in use." },
      status: "error",
    };
  }

  if (error.code === "42501") {
    return {
      message: "You do not have permission to make this change.",
      status: "error",
    };
  }

  if (error.message?.includes("LOCATION_ARCHIVED")) {
    return {
      message: "Archived locations are retained as read-only records.",
      status: "error",
    };
  }

  if (error.message?.includes("BUSINESS_STATUS_PLATFORM_CONTROLLED")) {
    return {
      message: "Suspended business status is controlled by Darb platform administration.",
      status: "error",
    };
  }

  if (error.code === "22023") {
    return {
      message: "Some details were not accepted. Review the form and try again.",
      status: "error",
    };
  }

  const fallback = kind === "business" ? "business settings" : "location";
  return {
    message: `We could not save the ${fallback}. Please try again.`,
    status: "error",
  };
}
