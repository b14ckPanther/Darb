"use client";

import { usePathname, useRouter } from "next/navigation";

import { ArrowDownIcon, BuildingIcon } from "@darb/icons";

import type { AccessibleBusiness } from "../../lib/auth";
import { getBusinessSwitchPath } from "../../lib/navigation";

interface BusinessSwitcherProps {
  businesses: AccessibleBusiness[];
  currentBusiness: AccessibleBusiness;
}

export function BusinessSwitcher({ businesses, currentBusiness }: BusinessSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="business-switcher">
      <BuildingIcon size={19} />
      <label className="visually-hidden" htmlFor="business-switcher-select">
        Current business
      </label>
      <select
        id="business-switcher-select"
        aria-label="Current business"
        value={currentBusiness.slug}
        onChange={(event) => {
          router.push(
            getBusinessSwitchPath(pathname, currentBusiness.slug, event.currentTarget.value),
          );
        }}
      >
        {businesses.map((business) => (
          <option key={business.id} value={business.slug}>
            {business.display_name}
          </option>
        ))}
      </select>
      <ArrowDownIcon className="business-switcher__arrow" size={16} />
    </div>
  );
}
