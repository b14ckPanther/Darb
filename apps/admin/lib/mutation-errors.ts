import type { FormState } from "./forms";

interface DatabaseErrorLike {
  code?: string;
  message?: string;
}

export type MutationKind =
  | "business"
  | "domain"
  | "languages"
  | "location-archive"
  | "location-create"
  | "location-update"
  | "media"
  | "module";

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

  if (error.message?.includes("MODULE_UNAVAILABLE")) {
    return {
      message: "This capability is not currently available for enablement.",
      status: "error",
    };
  }

  if (error.message?.includes("MODULE_NOT_FOUND")) {
    return {
      message: "That capability is not part of the current Darb registry.",
      status: "error",
    };
  }

  if (error.code === "23505" && kind === "domain") {
    return {
      fieldErrors: { hostname: "That hostname is already claimed on Darb." },
      status: "error",
    };
  }

  if (error.message?.includes("DOMAIN_MUST_BE_VERIFIED")) {
    return {
      message: "Verify the DNS TXT record before making this domain primary.",
      status: "error",
    };
  }

  if (
    error.message?.includes("DOMAIN_HOSTNAME_RESERVED") ||
    error.message?.includes("INVALID_DOMAIN_HOSTNAME")
  ) {
    return { fieldErrors: { hostname: "Enter a valid non-Darb hostname." }, status: "error" };
  }

  if (
    error.message?.includes("BUSINESS_DOMAINS_NOT_ACTIVE") ||
    error.message?.includes("BUSINESS_MEDIA_NOT_ACTIVE") ||
    error.message?.includes("BUSINESS_LOCALES_NOT_ACTIVE")
  ) {
    return {
      message: "This setting cannot be changed while the business is not active.",
      status: "error",
    };
  }

  if (error.message?.includes("DEFAULT_LOCALE_MUST_REMAIN_ENABLED")) {
    return { message: "The default language must remain enabled.", status: "error" };
  }

  if (
    error.message?.includes("MEDIA_UPLOAD_NOT_FOUND") ||
    error.message?.includes("MEDIA_ASSET_NOT_ACTIVE")
  ) {
    return {
      message: "The media upload could not be verified. Start the upload again.",
      status: "error",
    };
  }

  if (
    error.message?.includes("BUSINESS_MODULES_ARCHIVED") ||
    error.message?.includes("BUSINESS_MODULES_SUSPENDED")
  ) {
    return {
      message: "Capabilities cannot be changed while this business is not active.",
      status: "error",
    };
  }

  if (error.code === "22023") {
    return {
      message: "Some details were not accepted. Review the form and try again.",
      status: "error",
    };
  }

  const fallback =
    kind === "business"
      ? "business settings"
      : kind === "module"
        ? "capability"
        : kind === "domain"
          ? "domain"
          : kind === "media"
            ? "media"
            : kind === "languages"
              ? "languages"
              : "location";
  return {
    message: `We could not save the ${fallback}. Please try again.`,
    status: "error",
  };
}
