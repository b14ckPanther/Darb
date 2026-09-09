"use client";

import { LockIcon } from "@darb/icons";

import { useAdminI18n } from "../../lib/i18n-client";

interface PermissionNoticeProps {
  children: string;
  title?: string;
}

export function PermissionNotice({
  children,
  title = "This section is read-only for your access level.",
}: PermissionNoticeProps) {
  const { t } = useAdminI18n();
  return (
    <section className="permission-notice" aria-label={t("Permission information")}>
      <span>
        <LockIcon size={20} />
      </span>
      <div>
        <h2>{t(title)}</h2>
        <p>{t(children)}</p>
      </div>
    </section>
  );
}
