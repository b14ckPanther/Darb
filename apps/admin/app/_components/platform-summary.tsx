"use client";

import type { ReactNode } from "react";

import { useAdminI18n } from "../../lib/i18n-client";

interface PlatformMetricProps {
  detail: string;
  icon: ReactNode;
  label: string;
  value: number;
}

export function PlatformMetric({ detail, icon, label, value }: PlatformMetricProps) {
  const { locale, t } = useAdminI18n();
  return (
    <article className="platform-metric">
      <span className="platform-metric__icon">{icon}</span>
      <div>
        <p>{t(label)}</p>
        <strong>{value.toLocaleString(locale)}</strong>
        <small>{t(detail)}</small>
      </div>
    </article>
  );
}

export function PlatformSectionHeading({
  description,
  id,
  title,
}: {
  description: string;
  id?: string;
  title: string;
}) {
  const { t } = useAdminI18n();
  return (
    <header className="platform-section-heading">
      <h2 id={id}>{t(title)}</h2>
      <p>{t(description)}</p>
    </header>
  );
}
