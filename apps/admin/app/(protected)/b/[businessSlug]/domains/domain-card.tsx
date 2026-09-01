"use client";

import { useActionState, useState } from "react";

import { CopyIcon, DomainIcon } from "@darb/icons";

import {
  disableBusinessDomainAction,
  restartBusinessDomainVerificationAction,
  setBusinessDomainPrimaryAction,
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
  const [copied, setCopied] = useState<string>();
  const verifyAction = verifyBusinessDomainAction.bind(null, businessId, businessSlug, domain.id);
  const primaryAction = setBusinessDomainPrimaryAction.bind(
    null,
    businessId,
    businessSlug,
    domain.id,
  );
  const disableAction = disableBusinessDomainAction.bind(null, businessId, businessSlug, domain.id);
  const restartAction = restartBusinessDomainVerificationAction.bind(
    null,
    businessId,
    businessSlug,
    domain.id,
  );
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    verifyAction,
    initialFormState,
  );
  const [primaryState, primaryFormAction, primaryPending] = useActionState(
    primaryAction,
    initialFormState,
  );
  const [disableState, disableFormAction, disablePending] = useActionState(
    disableAction,
    initialFormState,
  );
  const [restartState, restartFormAction, restartPending] = useActionState(
    restartAction,
    initialFormState,
  );
  const dnsName = buildDnsTxtRecordName(domain.hostname);
  const dnsValue = buildDnsTxtRecordValue(domain.verification_token);
  const pending = verifyPending || primaryPending || disablePending || restartPending;

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied(undefined);
    }
  }

  const feedback = [verifyState, primaryState, disableState, restartState].find(
    (state) => state.message,
  );

  return (
    <article
      className={`domain-card domain-card--${domain.status}`}
      aria-labelledby={`domain-${domain.id}`}
    >
      <div className="domain-card__heading">
        <span>
          <DomainIcon size={22} />
        </span>
        <div>
          <h3 id={`domain-${domain.id}`} dir="ltr">
            {domain.hostname}
          </h3>
          <p>{domain.is_primary ? "Primary domain" : "Custom domain claim"}</p>
        </div>
        <StatusBadge className="domain-state" status={domain.status} />
      </div>

      {domain.status !== "disabled" ? (
        <div className="dns-instructions">
          <p>Publish this exact DNS TXT record</p>
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
        <p className="domain-card__disabled-note">This claim is retained but no longer active.</p>
      )}

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
          {domain.status === "pending" || domain.status === "failed" ? (
            <form action={verifyFormAction}>
              <button type="submit" className="primary-button" disabled={pending}>
                {verifyPending ? "Checking DNS…" : "Verify TXT record"}
              </button>
            </form>
          ) : null}
          {domain.status === "verified" && !domain.is_primary ? (
            <form action={primaryFormAction}>
              <button type="submit" className="secondary-button" disabled={pending}>
                {primaryPending ? "Updating…" : "Make primary"}
              </button>
            </form>
          ) : null}
          {domain.status === "disabled" ? (
            <form action={restartFormAction}>
              <button type="submit" className="secondary-button" disabled={pending}>
                {restartPending ? "Restarting…" : "Restart verification"}
              </button>
            </form>
          ) : confirmingDisable ? (
            <div className="inline-confirmation" role="group" aria-label="Disable domain">
              <p>Disable this claim and clear primary status?</p>
              <div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmingDisable(false)}
                  disabled={pending}
                >
                  Keep active
                </button>
                <form action={disableFormAction}>
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
