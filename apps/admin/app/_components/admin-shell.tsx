"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  AppearanceIcon,
  BuildingIcon,
  CancelIcon,
  DomainIcon,
  HomeIcon,
  ImageIcon,
  LanguagesSettingsIcon,
  LocationIcon,
  LogoutIcon,
  MenuIcon,
  ModulesIcon,
  RestaurantIcon,
  SettingsIcon,
  ShieldIcon,
} from "@darb/icons";

import { signOutAction } from "../actions/auth";
import type { AccessibleBusiness, CurrentUser } from "../../lib/auth";
import {
  isAdminNavigationItemActive,
  type AdminNavigationIconKey,
  type ResolvedAdminNavigationGroup,
} from "../../lib/navigation";
import { DarbAdminBrand } from "./brand";
import { BusinessLifecycleNotice } from "./business-lifecycle-notice";
import { BusinessSwitcher } from "./business-switcher";
import { StatusBadge } from "./status-badge";

interface AdminShellProps {
  businesses: AccessibleBusiness[];
  children: ReactNode;
  currentBusiness: AccessibleBusiness;
  navigation: ResolvedAdminNavigationGroup[];
  user: CurrentUser;
}

const navigationIcons: Record<AdminNavigationIconKey, typeof HomeIcon> = {
  appearance: AppearanceIcon,
  audit: ShieldIcon,
  business: SettingsIcon,
  domains: DomainIcon,
  languages: LanguagesSettingsIcon,
  locations: LocationIcon,
  media: ImageIcon,
  modules: ModulesIcon,
  overview: HomeIcon,
  restaurant: RestaurantIcon,
};

export function AdminShell({
  businesses,
  children,
  currentBusiness,
  navigation,
  user,
}: AdminShellProps) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!navigationOpen) {
      return;
    }

    const openButton = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavigationOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      openButton?.focus();
    };
  }, [navigationOpen]);

  return (
    <div className="core-admin-shell">
      <button
        type="button"
        className={`admin-shell-backdrop${navigationOpen ? " is-visible" : ""}`}
        aria-label="Close navigation"
        tabIndex={navigationOpen ? 0 : -1}
        onClick={() => setNavigationOpen(false)}
      />

      <aside
        ref={sidebarRef}
        className={`admin-sidebar${navigationOpen ? " is-open" : ""}`}
        aria-label="Business workspace navigation"
        aria-modal={navigationOpen || undefined}
        role={navigationOpen ? "dialog" : undefined}
      >
        <div className="admin-sidebar__brand">
          <DarbAdminBrand />
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button admin-sidebar__close"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          >
            <CancelIcon size={20} />
          </button>
        </div>

        <BusinessSwitcher
          businesses={businesses}
          currentBusiness={currentBusiness}
          onNavigate={() => setNavigationOpen(false)}
        />

        <nav className="admin-navigation" aria-label="Business administration">
          {navigation.map((group) => (
            <section className="admin-navigation__group" key={group.key}>
              <h2 className="admin-navigation__label">{group.label}</h2>
              <ul>
                {group.items.map((item) => {
                  const Icon = navigationIcons[item.icon];
                  const active = isAdminNavigationItemActive(pathname, item);
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={active ? "is-active" : undefined}
                        onClick={() => setNavigationOpen(false)}
                      >
                        <Icon size={19} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
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
            ref={openButtonRef}
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
          <StatusBadge status={currentBusiness.status} />
        </header>
        <main id="main-content" className="core-admin-content">
          <BusinessLifecycleNotice status={currentBusiness.status} />
          {children}
        </main>
      </div>
    </div>
  );
}
