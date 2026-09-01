"use server";

import { revalidatePath } from "next/cache";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import { normalizeHostname } from "../../lib/domain-validation";
import { verifyDomainDnsTxt } from "../../lib/domain-verification";
import { resolveBusinessDomain } from "../../lib/domains";
import type { FormState } from "../../lib/forms";
import { mapMutationError } from "../../lib/mutation-errors";
import { businessSectionPath } from "../../lib/navigation";
import { createDomainAttestationSupabaseClient } from "../../lib/supabase/privileged";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";
import { resolveCurrentUser } from "../../lib/auth";

export async function addBusinessDomainAction(
  businessId: string,
  businessSlug: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawHostname = formData.get("hostname");
  const parsed = normalizeHostname(typeof rawHostname === "string" ? rawHostname : "");

  if (!parsed.success) {
    return { fieldErrors: { hostname: parsed.message }, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "domains.manage"))) {
    return mapMutationError({ code: "42501" }, "domain");
  }

  const { error } = await supabase.schema("core").rpc("add_business_domain", {
    requested_hostname: parsed.hostname,
    target_business_id: business.id,
  });

  if (error) {
    return mapMutationError(error, "domain");
  }

  revalidatePath(businessSectionPath(businessSlug, "domains"));
  return {
    message: `${parsed.hostname} added. Publish the TXT record before verifying.`,
    status: "success",
  };
}

export async function verifyBusinessDomainAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "domains.manage"))) {
    return mapMutationError({ code: "42501" }, "domain");
  }

  if (business.status !== "active") {
    return mapMutationError({ message: "BUSINESS_DOMAINS_NOT_ACTIVE" }, "domain");
  }

  const domain = await resolveBusinessDomain(supabase, business.id, domainId);

  if (!domain || domain.status === "disabled") {
    return mapMutationError({ message: "BUSINESS_DOMAIN_ACCESS_DENIED" }, "domain");
  }

  const verification = await verifyDomainDnsTxt(domain.hostname, domain.verification_token);

  if (verification.status === "temporary-error") {
    return {
      message:
        "DNS could not be checked reliably. No verification state was changed; try again shortly.",
      status: "error",
    };
  }

  const user = await resolveCurrentUser(supabase);
  if (!user) {
    return mapMutationError({ code: "42501" }, "domain");
  }

  try {
    const attestationClient = createDomainAttestationSupabaseClient();
    const { error } = await attestationClient
      .schema("core")
      .rpc("record_business_domain_verification", {
        requesting_user_id: user.id,
        target_domain_id: domain.id,
        verification_succeeded: verification.status === "verified",
      });

    if (error) {
      return mapMutationError(error, "domain");
    }
  } catch {
    return {
      message: "The trusted DNS attestation service is not configured for this environment.",
      status: "error",
    };
  }

  revalidatePath(businessSectionPath(businessSlug, "domains"));
  return verification.status === "verified"
    ? { message: `${domain.hostname} is verified.`, status: "success" }
    : {
        message: "The exact TXT value was not found. The domain remains unverified.",
        status: "error",
      };
}

export async function restartBusinessDomainVerificationAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  return runDomainMutation(
    businessId,
    businessSlug,
    "restart_business_domain_verification",
    domainId,
    "Verification restarted with a new TXT value.",
  );
}

export async function setBusinessDomainPrimaryAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  return runDomainMutation(
    businessId,
    businessSlug,
    "set_business_domain_primary",
    domainId,
    "Primary domain updated.",
  );
}

export async function disableBusinessDomainAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  return runDomainMutation(
    businessId,
    businessSlug,
    "disable_business_domain",
    domainId,
    "Domain disabled and retained for history.",
  );
}

type DomainMutationName =
  | "disable_business_domain"
  | "restart_business_domain_verification"
  | "set_business_domain_primary";

async function runDomainMutation(
  businessId: string,
  businessSlug: string,
  mutation: DomainMutationName,
  domainId: string,
  successMessage: string,
): Promise<FormState> {
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "domains.manage"))) {
    return mapMutationError({ code: "42501" }, "domain");
  }

  const { error } = await supabase.schema("core").rpc(mutation, {
    target_business_id: business.id,
    target_domain_id: domainId,
  });

  if (error) {
    return mapMutationError(error, "domain");
  }

  revalidatePath(businessSectionPath(businessSlug, "domains"));
  return { message: successMessage, status: "success" };
}
