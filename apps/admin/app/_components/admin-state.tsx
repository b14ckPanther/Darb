import type { ReactNode } from "react";

import { AlertCircleIcon, InformationCircleIcon } from "@darb/icons";

interface AdminStateProps {
  action?: ReactNode;
  description: string;
  eyebrow?: string;
  headingLevel?: 1 | 2;
  icon?: ReactNode;
  title: string;
  tone?: "error" | "neutral";
}

export function AdminState({
  action,
  description,
  eyebrow,
  headingLevel = 1,
  icon,
  title,
  tone = "neutral",
}: AdminStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h1";

  return (
    <section className={`admin-state admin-state--${tone}`}>
      <span className="admin-state__icon">
        {icon ??
          (tone === "error" ? <AlertCircleIcon size={24} /> : <InformationCircleIcon size={24} />)}
      </span>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Heading>{title}</Heading>
      <p>{description}</p>
      {action ? <div className="admin-state__action">{action}</div> : null}
    </section>
  );
}
