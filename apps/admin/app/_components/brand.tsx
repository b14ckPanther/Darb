import { darbPlatform } from "@darb/config/platform";
import { ExternalLinkIcon } from "@darb/icons";
import { DarbBrandLockup, type DarbBrandTone } from "@darb/ui";

export const darbPublicWebsiteUrl = `https://${darbPlatform.rootDomain}`;

export function DarbAdminBrand({
  context = "admin",
  tone = "dark",
}: {
  context?: "admin" | "platform";
  tone?: DarbBrandTone;
}) {
  const contextLabel = context === "platform" ? "Platform" : "Admin";

  return (
    <div
      className="brand-lockup"
      aria-label={`${darbPlatform.name} ${contextLabel}`}
      data-admin-brand={context}
      role="img"
    >
      <DarbBrandLockup aria-hidden="true" compact tone={tone} />
      <span className="brand-context" aria-hidden="true">
        {contextLabel}
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
  return (
    <a className={className} href={darbPublicWebsiteUrl}>
      <span>{label}</span>
      <ExternalLinkIcon size={17} />
    </a>
  );
}
