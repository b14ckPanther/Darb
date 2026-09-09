"use client";

import { useAdminI18n } from "../../lib/i18n-client";

export function AdminPageSkeleton({ label = "Loading business workspace" }: { label?: string }) {
  const { t } = useAdminI18n();
  return (
    <div className="admin-page-skeleton" role="status" aria-live="polite" aria-busy="true">
      <div className="admin-page-skeleton__header">
        <span className="skeleton-line skeleton-line--eyebrow" />
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line skeleton-line--copy" />
      </div>
      <div className="admin-page-skeleton__grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="visually-hidden">{t(label)}…</span>
    </div>
  );
}
