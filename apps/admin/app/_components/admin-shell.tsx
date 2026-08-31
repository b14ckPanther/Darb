"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  BuildingIcon,
  CancelIcon,
  HomeIcon,
  LocationIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
} from "@darb/icons";

import { signOutAction } from "../actions/auth";
import type { AccessibleBusiness, CurrentUser } from "../../lib/auth";
import { businessPath, businessSectionPath } from "../../lib/navigation";
import { DarbAdminBrand } from "./brand";
import { BusinessSwitcher } from "./business-switcher";

interface AdminShellProps {
  businesses: AccessibleBusiness[];
  children: ReactNode;
  currentBusiness: AccessibleBusiness;
  showLocations: boolean;
  user: CurrentUser;
}

export function AdminShell({
  businesses,
  children,
  currentBusiness,
  showLocations,
  user,
}: AdminShellProps) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const basePath = businessPath(currentBusiness.slug);
  const items = [
    { href: basePath, icon: HomeIcon, label: "Overview", match: pathname === basePath },
    {
      href: businessSectionPath(currentBusiness.slug, "settings"),
      icon: SettingsIcon,
      label: "Business settings",
      match: pathname.startsWith(`${basePath}/settings`),
    },
    ...(showLocations
      ? [
          {
            href: businessSectionPath(currentBusiness.slug, "locations"),
            icon: LocationIcon,
            label: "Locations",
            match: pathname.startsWith(`${basePath}/locations`),
          },
        ]
      : []),
  ];

  return (
    <div className="core-admin-shell">
      <button
        type="button"
        className={`admin-shell-backdrop${navigationOpen ? " is-visible" : ""}`}
        aria-label="Close navigation"
        tabIndex={navigationOpen ? 0 : -1}
        onClick={() => setNavigationOpen(false)}
      />

      <aside className={`admin-sidebar${navigationOpen ? " is-open" : ""}`}>
        <div className="admin-sidebar__brand">
          <DarbAdminBrand />
          <button
            type="button"
            className="icon-button admin-sidebar__close"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          >
            <CancelIcon size={20} />
          </button>
        </div>

        <BusinessSwitcher businesses={businesses} currentBusiness={currentBusiness} />

        <nav className="admin-navigation" aria-label="Business administration">
          <p className="admin-navigation__label">Manage</p>
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.match ? "page" : undefined}
                  className={item.match ? "is-active" : undefined}
                  onClick={() => setNavigationOpen(false)}
                >
                  <item.icon size={19} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar__footer">
          <Link className="all-businesses-link" href="/" onClick={() => setNavigationOpen(false)}>
            <BuildingIcon size={18} />
            All businesses
          </Link>
          <div className="account-summary">
            <span className="account-summary__avatar" aria-hidden="true">
              {(user.email?.[0] ?? "D").toUpperCase()}
            </span>
            <span className="account-summary__identity">
              <small>Signed in</small>
              <bdi>{user.email ?? "Darb account"}</bdi>
            </span>
            <form action={signOutAction}>
              <button type="submit" className="icon-button" aria-label="Sign out">
                <LogoutIcon size={19} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-mobile-bar">
          <button
            type="button"
            className="icon-button"
            aria-label="Open navigation"
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen(true)}
          >
            <MenuIcon size={21} />
          </button>
          <div>
            <small>Current business</small>
            <strong dir="auto">{currentBusiness.display_name}</strong>
          </div>
          <span className={`status-dot status-dot--${currentBusiness.status}`} aria-hidden="true" />
        </header>
        <main id="main-content" className="core-admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
