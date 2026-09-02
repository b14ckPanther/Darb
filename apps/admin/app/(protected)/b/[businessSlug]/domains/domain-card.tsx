"use client";

import { useActionState, useState } from "react";
import { CopyIcon, DomainIcon } from "@darb/icons";
import {
  checkBusinessDomainRoutingAction,
  connectBusinessDomainAction,
  disableBusinessDomainAction,
  disconnectBusinessDomainAction,
  restartBusinessDomainVerificationAction,
  setBusinessDomainPrimaryAction,
  setBusinessDomainTargetAction,
  verifyBusinessDomainAction,
} from "../../../../actions/domains";
import { StatusBadge } from "../../../../_components/status-badge";
import {
  buildDnsTxtRecordName,
  buildDnsTxtRecordValue,
} from "../../../../../lib/domain-validation";
import type { AccessibleBusinessDomain } from "../../../../../lib/domains";
import { initialFormState } from "../../../../../lib/forms";

interface DomainCardProps {
  businessId: string;
  businessSlug: string;
  domain: AccessibleBusinessDomain;
  editable: boolean;
}

export function DomainCard({ businessId, businessSlug, domain, editable }: DomainCardProps) {
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [copied, setCopied] = useState<string>();
  const args = [businessId, businessSlug, domain.id] as const;
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyBusinessDomainAction.bind(null, ...args),
    initialFormState,
  );
  const [targetState, targetAction, targetPending] = useActionState(
    setBusinessDomainTargetAction.bind(null, ...args),
    initialFormState,
  );
  const [connectState, connectAction, connectPending] = useActionState(
    connectBusinessDomainAction.bind(null, ...args),
    initialFormState,
  );
  const [checkState, checkAction, checkPending] = useActionState(
    checkBusinessDomainRoutingAction.bind(null, ...args),
    initialFormState,
  );
  const [primaryState, primaryAction, primaryPending] = useActionState(
    setBusinessDomainPrimaryAction.bind(null, ...args),
    initialFormState,
  );
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectBusinessDomainAction.bind(null, ...args),
    initialFormState,
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableBusinessDomainAction.bind(null, ...args),
    initialFormState,
  );
  const [restartState, restartAction, restartPending] = useActionState(
    restartBusinessDomainVerificationAction.bind(null, ...args),
    initialFormState,
  );
  const pending = [
    verifyPending,
    targetPending,
    connectPending,
    checkPending,
    primaryPending,
    disconnectPending,
    disablePending,
    restartPending,
  ].some(Boolean);
  const feedback = [
    verifyState,
    targetState,
    connectState,
    checkState,
    primaryState,
    disconnectState,
    disableState,
    restartState,
  ].find((state) => state.message);
  const dnsName = buildDnsTxtRecordName(domain.hostname);
  const dnsValue = buildDnsTxtRecordValue(domain.verification_token);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied(undefined);
    }
  }

  return (
    <article className="domain-card" aria-labelledby={`domain-${domain.id}`}>
      <div className="domain-card__heading">
        <span>
          <DomainIcon size={22} />
        </span>
        <div>
          <h3 id={`domain-${domain.id}`} dir="ltr">
            {domain.hostname}
          </h3>
          <p>{domain.is_primary ? "Primary Restaurant hostname" : "Custom domain"}</p>
        </div>
        <div className="domain-card__statuses" aria-label="Domain states">
          <StatusBadge label={`Ownership: ${domain.status}`} status={domain.status} />
          <StatusBadge
            label={`Routing: ${routingLabel(domain.routing_status)}`}
            status={domain.routing_status}
          />
        </div>
      </div>

      {domain.status !== "disabled" ? (
        <div className="dns-instructions">
          <p>Ownership TXT record</p>
          <CopyField
            label="Host / name"
            value={dnsName}
            copied={copied === "name"}
            onCopy={() => copyValue("name", dnsName)}
          />
          <CopyField
            label="TXT value"
            value={dnsValue}
            copied={copied === "value"}
            onCopy={() => copyValue("value", dnsValue)}
          />
        </div>
      ) : (
        <p className="domain-card__disabled-note">This ownership claim is retained but disabled.</p>
      )}

      {domain.status === "verified" ? (
        <section className="domain-routing" aria-label="Public routing">
          <div>
            <p className="eyebrow">Public destination</p>
            <h4>{domain.target_module_key === "restaurant" ? "Restaurant" : "Not assigned"}</h4>
          </div>
          <p>{routingDescription(domain.routing_status, domain.target_module_key)}</p>
        </section>
      ) : null}

      {feedback?.message ? (
        <p
          className={feedback.status === "success" ? "inline-success" : "inline-error"}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      {editable ? (
        <div className="domain-card__actions">
          {(domain.status === "pending" || domain.status === "failed") && (
            <form action={verifyAction}>
              <button type="submit" className="primary-button" disabled={pending}>
                {verifyPending ? "Checking DNS…" : "Verify ownership"}
              </button>
            </form>
          )}
          {domain.status === "verified" && domain.target_module_key !== "restaurant" && (
            <form action={targetAction}>
              <input type="hidden" name="moduleKey" value="restaurant" />
              <button type="submit" className="primary-button" disabled={pending}>
                {targetPending ? "Assigning…" : "Use for Restaurant"}
              </button>
            </form>
          )}
          {domain.status === "verified" &&
            domain.target_module_key === "restaurant" &&
            ["unconfigured", "disconnected"].includes(domain.routing_status) && (
              <form action={connectAction}>
                <button type="submit" className="primary-button" disabled={pending}>
                  {connectPending ? "Connecting…" : "Connect deployment"}
                </button>
              </form>
            )}
          {domain.status === "verified" &&
            domain.target_module_key === "restaurant" &&
            ["provisioning", "failed"].includes(domain.routing_status) && (
              <form action={checkAction}>
                <button type="submit" className="primary-button" disabled={pending}>
                  {checkPending ? "Checking…" : "Check routing"}
                </button>
              </form>
            )}
          {domain.routing_status === "live" && !domain.is_primary && (
            <form action={primaryAction}>
              <button type="submit" className="secondary-button" disabled={pending}>
                {primaryPending ? "Updating…" : "Make primary"}
              </button>
            </form>
          )}
          {["live", "provisioning", "failed"].includes(domain.routing_status) &&
            (confirmingDisconnect ? (
              <div className="inline-confirmation" role="group" aria-label="Disconnect deployment">
                <p>Stop Darb routing before removing this hostname from the deployment?</p>
                <div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setConfirmingDisconnect(false)}
                    disabled={pending}
                  >
                    Keep connected
                  </button>
                  <form action={disconnectAction}>
                    <button type="submit" className="danger-button" disabled={pending}>
                      {disconnectPending ? "Disconnecting…" : "Confirm disconnect"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="text-danger-button"
                onClick={() => setConfirmingDisconnect(true)}
              >
                Disconnect deployment
              </button>
            ))}
          {domain.status === "disabled" ? (
            <form action={restartAction}>
              <button type="submit" className="secondary-button" disabled={pending}>
                {restartPending ? "Restarting…" : "Restart verification"}
              </button>
            </form>
          ) : confirmingDisable ? (
            <div className="inline-confirmation" role="group" aria-label="Disable domain">
              <p>Disable ownership and routing while retaining this domain for history?</p>
              <div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmingDisable(false)}
                  disabled={pending}
                >
                  Keep active
                </button>
                <form action={disableAction}>
                  <button type="submit" className="danger-button" disabled={pending}>
                    {disablePending ? "Disabling…" : "Confirm disable"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-danger-button"
              onClick={() => setConfirmingDisable(true)}
            >
              Disable domain
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}

function routingLabel(status: AccessibleBusinessDomain["routing_status"]) {
  return {
    disconnected: "disconnected",
    failed: "needs attention",
    live: "live",
    provisioning: "provisioning",
    unconfigured: "not configured",
  }[status];
}

function routingDescription(
  status: AccessibleBusinessDomain["routing_status"],
  target: string | null,
) {
  if (!target) return "Choose an implemented public capability before connecting this hostname.";
  return {
    disconnected: "Darb no longer resolves this hostname. The ownership claim is retained.",
    failed: "The provider could not attest a safe live deployment. Review and check again.",
    live: "The deployment provider attested this hostname ready for secure Restaurant routing.",
    provisioning: "The hostname is attached, but DNS or TLS configuration is still pending.",
    unconfigured: "Ownership is verified. Connect the hostname to start deployment provisioning.",
  }[status];
}

function CopyField({
  copied,
  label,
  onCopy,
  value,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="copy-field">
      <span>{label}</span>
      <code dir="ltr">{value}</code>
      <button type="button" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
        <CopyIcon size={16} />
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
