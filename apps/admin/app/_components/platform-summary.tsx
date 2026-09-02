import type { ReactNode } from "react";

interface PlatformMetricProps {
  detail: string;
  icon: ReactNode;
  label: string;
  value: number;
}

export function PlatformMetric({ detail, icon, label, value }: PlatformMetricProps) {
  return (
    <article className="platform-metric">
      <span className="platform-metric__icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value.toLocaleString("en-IL")}</strong>
        <small>{detail}</small>
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
  return (
    <header className="platform-section-heading">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </header>
  );
}
