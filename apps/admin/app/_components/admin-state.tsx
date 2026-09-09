"use client";

import type { ReactNode } from "react";

import { AlertCircleIcon, InformationCircleIcon } from "@darb/icons";
import { DarbMark } from "@darb/ui";
import { useAdminI18n } from "../../lib/i18n-client";

interface AdminStateProps {
  action?: ReactNode;
  branded?: boolean;
  description: string;
  eyebrow?: string;
  headingLevel?: 1 | 2;
  icon?: ReactNode;
  title: string;
  tone?: "error" | "neutral";
}

export function AdminState({
  action,
  branded = false,
  description,
  eyebrow,
  headingLevel = 1,
  icon,
  title,
  tone = "neutral",
}: AdminStateProps) {
  const { t } = useAdminI18n();
  const Heading = headingLevel === 2 ? "h2" : "h1";

  return (
    <section className={`admin-state admin-state--${tone}`}>
      {branded ? <DarbMark className="admin-state__brand" size={42} /> : null}
      <span className="admin-state__icon">
        {icon ??
          (tone === "error" ? <AlertCircleIcon size={24} /> : <InformationCircleIcon size={24} />)}
      </span>
      {eyebrow ? <p className="eyebrow">{t(eyebrow)}</p> : null}
      <Heading>{t(title)}</Heading>
      <p>{t(description)}</p>
      {action ? <div className="admin-state__action">{action}</div> : null}
    </section>
  );
}
