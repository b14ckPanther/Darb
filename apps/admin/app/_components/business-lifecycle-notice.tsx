"use client";

import { ArchiveIcon, ShieldIcon } from "@darb/icons";

import { getBusinessLifecyclePresentation } from "../../lib/admin-foundation";
import { useAdminI18n } from "../../lib/i18n-client";

interface BusinessLifecycleNoticeProps {
  status: "active" | "archived" | "suspended";
}

export function BusinessLifecycleNotice({ status }: BusinessLifecycleNoticeProps) {
  const { t } = useAdminI18n();
  if (status === "active") return null;

  const presentation = getBusinessLifecyclePresentation(status);
  const Icon = status === "suspended" ? ShieldIcon : ArchiveIcon;

  return (
    <aside
      className={`lifecycle-notice lifecycle-notice--${presentation.tone}`}
      aria-label={t("Business lifecycle restriction")}
    >
      <span className="lifecycle-notice__icon">
        <Icon size={20} />
      </span>
      <div>
        <strong>{t(presentation.label)}</strong>
        <p>{t(presentation.description)}</p>
      </div>
    </aside>
  );
}
