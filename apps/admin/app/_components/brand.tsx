"use client";

import { darbPlatform } from "@darb/config/platform";
import { ExternalLinkIcon } from "@darb/icons";
import { DarbBrandLockup, type DarbBrandTone } from "@darb/ui";
import { useAdminI18n } from "../../lib/i18n-client";

export const darbPublicWebsiteUrl = `https://${darbPlatform.rootDomain}`;

export function DarbAdminBrand({
  context = "admin",
  tone = "dark",
}: {
  context?: "admin" | "platform";
  tone?: DarbBrandTone;
}) {
  const { t } = useAdminI18n();
  const contextLabel = context === "platform" ? "Platform" : "Admin";

  return (
    <div
      className="brand-lockup"
      aria-label={`${darbPlatform.name} ${t(contextLabel)}`}
      data-admin-brand={context}
      role="img"
    >
      <DarbBrandLockup aria-hidden="true" compact tone={tone} />
      <span className="brand-context" aria-hidden="true">
        {t(contextLabel)}
      </span>
    </div>
  );
}

export function DarbPublicSiteLink({
  className,
  label = "Visit Darb",
}: {
  className?: string;
  label?: string;
}) {
  const { t } = useAdminI18n();
  return (
    <a className={className} href={darbPublicWebsiteUrl}>
      <span>{t(label)}</span>
      <ExternalLinkIcon size={17} />
    </a>
  );
}
