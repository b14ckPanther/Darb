"use client";

import { usePathname, useRouter } from "next/navigation";

import { ArrowDownIcon, BuildingIcon } from "@darb/icons";

import type { AccessibleBusiness } from "../../lib/auth";
import { getBusinessSwitchPath } from "../../lib/navigation";
import { useAdminI18n } from "../../lib/i18n-client";

interface BusinessSwitcherProps {
  businesses: AccessibleBusiness[];
  currentBusiness: AccessibleBusiness;
  onNavigate?: () => void;
}

export function BusinessSwitcher({
  businesses,
  currentBusiness,
  onNavigate,
}: BusinessSwitcherProps) {
  const { t } = useAdminI18n();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="business-switcher">
      <BuildingIcon size={19} />
      <label className="visually-hidden" htmlFor="business-switcher-select">
        {t("Current business")}
      </label>
      <div className="business-switcher__field">
        <span>
          {t("Current business")} ·{" "}
          {t(currentBusiness.status[0]!.toUpperCase() + currentBusiness.status.slice(1))}
        </span>
        <select
          id="business-switcher-select"
          aria-label={t("Current business")}
          value={currentBusiness.slug}
          onChange={(event) => {
            onNavigate?.();
            router.push(
              getBusinessSwitchPath(pathname, currentBusiness.slug, event.currentTarget.value),
            );
          }}
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.slug} lang={business.default_locale}>
              {business.display_name}
            </option>
          ))}
        </select>
      </div>
      <ArrowDownIcon className="business-switcher__arrow" size={16} />
    </div>
  );
}
