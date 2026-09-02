"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  AuditIcon,
  BuildingIcon,
  CancelIcon,
  DomainIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ModulesIcon,
  TemplatesIcon,
  UsersIcon,
} from "@darb/icons";

import type { CurrentUser } from "../../lib/auth";
import { platformPaths } from "../../lib/platform-model";
import { signOutAction } from "../actions/auth";
import { DarbAdminBrand } from "./brand";

interface PlatformShellProps {
  children: ReactNode;
  user: CurrentUser;
}

const navigation = [
  {
    key: "overview",
    label: "Overview",
    href: platformPaths.home,
    icon: HomeIcon,
    group: "Platform",
  },
  {
    key: "businesses",
    label: "Businesses",
    href: platformPaths.businesses,
    icon: BuildingIcon,
    group: "Operations",
  },
  {
    key: "users",
    label: "Users",
    href: platformPaths.users,
    icon: UsersIcon,
    group: "Operations",
  },
  {
    key: "domains",
    label: "Domains",
    href: platformPaths.domains,
    icon: DomainIcon,
    group: "Operations",
  },
  {
    key: "modules",
    label: "Modules",
    href: platformPaths.modules,
    icon: ModulesIcon,
    group: "Registry",
  },
  {
    key: "templates",
    label: "Templates",
    href: platformPaths.templates,
    icon: TemplatesIcon,
    group: "Registry",
  },
  {
    key: "audit",
    label: "Audit",
    href: platformPaths.audit,
    icon: AuditIcon,
    group: "Governance",
  },
] as const;

export function PlatformShell({ children, user }: PlatformShellProps) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!navigationOpen) return;
    const openButton = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavigationOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
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
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      openButton?.focus();
    };
  }, [navigationOpen]);

  function openNavigation() {
    setNavigationOpen(true);
    window.setTimeout(() => {
      if (sidebarRef.current?.classList.contains("is-open")) {
        closeButtonRef.current?.focus();
      }
    }, 50);
  }

  return (
    <div className="core-admin-shell platform-admin-shell">
      <button
        type="button"
        className={`admin-shell-backdrop${navigationOpen ? " is-visible" : ""}`}
        aria-label="Close platform navigation"
        tabIndex={navigationOpen ? 0 : -1}
        onClick={() => setNavigationOpen(false)}
      />
      <aside
        ref={sidebarRef}
        className={`admin-sidebar platform-sidebar${navigationOpen ? " is-open" : ""}`}
        aria-label="Darb platform administration navigation"
        aria-modal={navigationOpen || undefined}
        role={navigationOpen ? "dialog" : undefined}
      >
        <div className="admin-sidebar__brand">
          <DarbAdminBrand />
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button admin-sidebar__close"
            aria-label="Close platform navigation"
            onClick={() => setNavigationOpen(false)}
          >
            <CancelIcon size={20} />
          </button>
        </div>
        <div className="platform-context-mark">
          <span aria-hidden="true">
            <AuditIcon size={19} />
          </span>
          <div>
            <small>Active context</small>
            <strong>Darb Platform</strong>
          </div>
        </div>
        <nav className="admin-navigation" aria-label="Platform administration">
          {["Platform", "Operations", "Registry", "Governance"].map((group) => {
            const items = navigation.filter((item) => item.group === group);
            if (items.length === 0) return null;
            return (
              <section className="admin-navigation__group" key={group}>
                <h2 className="admin-navigation__label">{group}</h2>
                <ul>
                  {items.map((item) => {
                    const active =
                      item.href === platformPaths.home
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={active ? "is-active" : undefined}
                          aria-current={active ? "page" : undefined}
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
            );
          })}
        </nav>
        <div className="admin-sidebar__footer">
          <Link className="all-businesses-link" href="/" onClick={() => setNavigationOpen(false)}>
            <BuildingIcon size={18} />
            Business workspaces
          </Link>
          <div className="account-summary">
            <span className="account-summary__avatar" aria-hidden="true">
              {(user.email?.[0] ?? "D").toUpperCase()}
            </span>
            <span className="account-summary__identity">
              <small>Platform operator</small>
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
        <header className="admin-mobile-bar platform-mobile-bar">
          <button
            ref={openButtonRef}
            type="button"
            className="icon-button"
            aria-label="Open platform navigation"
            aria-expanded={navigationOpen}
            onClick={openNavigation}
          >
            <MenuIcon size={21} />
          </button>
          <div>
            <small>Platform administration</small>
            <strong>Darb Platform</strong>
          </div>
          <span className="platform-mobile-mark">
            <AuditIcon size={18} />
          </span>
        </header>
        <main id="main-content" className="core-admin-content platform-admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
