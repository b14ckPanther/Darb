"use server";

import { revalidatePath } from "next/cache";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import { normalizeHostname } from "../../lib/domain-validation";
import {
  createDomainDeploymentProvider,
  DomainProviderError,
  type DomainDeploymentStatus,
} from "../../lib/domain-deployment-provider";
import { verifyDomainDnsTxt } from "../../lib/domain-verification";
import { resolveBusinessDomain } from "../../lib/domains";
import type { FormState } from "../../lib/forms";
import { mapMutationError } from "../../lib/mutation-errors";
import { businessSectionPath } from "../../lib/navigation";
import {
  createDomainAttestationSupabaseClient,
  createDomainRoutingAttestationSupabaseClient,
} from "../../lib/supabase/privileged";
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

export async function setBusinessDomainTargetAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const moduleKey = formData.get("moduleKey");
  if (moduleKey !== "restaurant") {
    return { message: "That public capability is not implemented yet.", status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);
  if (!(await hasBusinessPermission(supabase, business.id, "domains.manage"))) {
    return mapMutationError({ code: "42501" }, "domain");
  }

  const { error } = await supabase.schema("core").rpc("set_business_domain_target", {
    requested_module_key: moduleKey,
    target_business_id: business.id,
    target_domain_id: domainId,
  });
  if (error) return mapMutationError(error, "domain");

  revalidatePath(businessSectionPath(businessSlug, "domains"));
  return { message: "Restaurant selected. Connect the deployment when ready.", status: "success" };
}

export async function connectBusinessDomainAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  return runDomainProviderMutation(businessId, businessSlug, domainId, "connect");
}

export async function checkBusinessDomainRoutingAction(
  businessId: string,
  businessSlug: string,
  domainId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  return runDomainProviderMutation(businessId, businessSlug, domainId, "status");
}

export async function disconnectBusinessDomainAction(
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
  const domain = await resolveBusinessDomain(supabase, business.id, domainId);
  if (!domain) return mapMutationError({ code: "42501" }, "domain");

  const { error } = await supabase.schema("core").rpc("disconnect_business_domain_routing", {
    target_business_id: business.id,
    target_domain_id: domain.id,
  });
  if (error) return mapMutationError(error, "domain");

  let cleanupFailed = false;
  try {
    await createDomainDeploymentProvider().disconnect(domain.hostname);
  } catch {
    cleanupFailed = true;
  }

  revalidatePath(businessSectionPath(businessSlug, "domains"));
  return cleanupFailed
    ? {
        message:
          "Darb routing is disabled. Provider cleanup could not be confirmed and needs an operator check.",
        status: "error",
      }
    : { message: "Domain disconnected from the Restaurant deployment.", status: "success" };
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

async function runDomainProviderMutation(
  businessId: string,
  businessSlug: string,
  domainId: string,
  operation: "connect" | "status",
): Promise<FormState> {
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);
  if (!(await hasBusinessPermission(supabase, business.id, "domains.manage"))) {
    return mapMutationError({ code: "42501" }, "domain");
  }
  const domain = await resolveBusinessDomain(supabase, business.id, domainId);
  if (!domain || domain.status !== "verified" || domain.target_module_key !== "restaurant") {
    return mapMutationError({ message: "DOMAIN_ROUTING_NOT_ALLOWED" }, "domain");
  }
  const user = await resolveCurrentUser(supabase);
  if (!user) return mapMutationError({ code: "42501" }, "domain");

  if (operation === "connect") {
    const { error } = await supabase.schema("core").rpc("begin_business_domain_routing", {
      target_business_id: business.id,
      target_domain_id: domain.id,
    });
    if (error) return mapMutationError(error, "domain");
  }

  let deployment: DomainDeploymentStatus;
  try {
    const provider = createDomainDeploymentProvider();
    deployment = await provider[operation](domain.hostname);
  } catch (error) {
    const safeCode = error instanceof DomainProviderError ? error.safeCode : "provider-unavailable";
    console.error("Domain deployment provider operation failed", {
      hostname: domain.hostname,
      moduleKey: domain.target_module_key,
      operation,
      safeCode,
    });
    await attestDomainRouting(domain.id, user.id, "failed");
    return {
      message:
        safeCode === "configuration"
          ? "The trusted domain deployment service is not configured for this environment."
          : "The deployment provider could not complete this check. Darb will not route the domain.",
      status: "error",
    };
  }

  const attestation = deployment.state === "live" ? "live" : "provisioning";
  const attestationError = await attestDomainRouting(domain.id, user.id, attestation);
  if (attestationError) return attestationError;

  revalidatePath(businessSectionPath(businessSlug, "domains"));
  if (deployment.state === "live") {
    return {
      message: `${domain.hostname} is live on the Restaurant deployment.`,
      status: "success",
    };
  }
  const records = deployment.dnsRecords
    .map((record) => `${record.type} ${record.name} → ${record.value}`)
    .join(" · ");
  return {
    message: records
      ? `Provider configuration is still required: ${records}`
      : "Provider configuration is still pending. Check again after DNS and TLS provisioning complete.",
    status: "error",
  };
}

async function attestDomainRouting(
  domainId: string,
  userId: string,
  status: "failed" | "live" | "provisioning",
): Promise<FormState | null> {
  try {
    const attestationClient = createDomainRoutingAttestationSupabaseClient();
    const { error } = await attestationClient
      .schema("core")
      .rpc("record_business_domain_routing_attestation", {
        attested_status: status,
        requesting_user_id: userId,
        target_domain_id: domainId,
      });
    return error ? mapMutationError(error, "domain") : null;
  } catch {
    return {
      message: "The trusted domain routing attestation service is not configured.",
      status: "error",
    };
  }
}
