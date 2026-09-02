"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowRightIcon, CancelIcon, MenuIcon } from "@darb/icons";
import type { SupportedLocale } from "@darb/i18n";

import type { MainSiteCopy } from "../lib/copy";
import { getPublicLocalePath } from "../lib/site";
import { BrandLockup } from "./brand-lockup";
import { LocaleLinks } from "./locale-links";

const adminUrl = "https://admin.darb.co.il";

export function SiteHeader({ copy, locale }: { copy: MainSiteCopy; locale: SupportedLocale }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (menuOpen && !dialog.open) {
      dialog.showModal();
      document.documentElement.dataset.navigationOpen = "true";
    } else if (!menuOpen && dialog.open) {
      dialog.close();
    }

    return () => {
      delete document.documentElement.dataset.navigationOpen;
    };
  }, [menuOpen]);

  function handleDialogClose() {
    delete document.documentElement.dataset.navigationOpen;
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  const links = [
    { href: "#story", label: copy.nav.story },
    { href: "#paths", label: copy.nav.paths },
    { href: "#products", label: copy.nav.products },
    { href: "#foundation", label: copy.nav.foundation },
  ] as const;

  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link className="public-header__home" href={getPublicLocalePath(locale)} aria-label="Darb">
          <BrandLockup compact />
        </Link>

        <nav className="public-header__desktop-nav" aria-label={copy.nav.primaryNavigation}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="public-header__desktop-actions">
          <LocaleLinks currentLocale={locale} label={copy.nav.language} />
          <a className="header-admin-link" href={adminUrl}>
            {copy.nav.signIn}
            <ArrowRightIcon size={16} />
          </a>
        </div>

        <button
          ref={menuButtonRef}
          className="public-header__menu-button"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon size={23} />
          <span className="sr-only">{copy.nav.openMenu}</span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        className="mobile-navigation"
        aria-labelledby="mobile-navigation-title"
        onCancel={closeMenu}
        onClose={handleDialogClose}
      >
        <div className="mobile-navigation__panel">
          <div className="mobile-navigation__header">
            <p id="mobile-navigation-title">{copy.brandDescriptor}</p>
            <button type="button" onClick={closeMenu}>
              <CancelIcon size={24} />
              <span className="sr-only">{copy.nav.closeMenu}</span>
            </button>
          </div>

          <nav className="mobile-navigation__links" aria-label={copy.nav.primaryNavigation}>
            {links.map((link, index) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                <span aria-hidden="true">0{index + 1}</span>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mobile-navigation__footer">
            <p>{copy.nav.language}</p>
            <LocaleLinks currentLocale={locale} label={copy.nav.language} />
            <a className="button button--gold" href={adminUrl}>
              {copy.nav.signIn}
              <ArrowRightIcon size={18} />
            </a>
          </div>
        </div>
      </dialog>
    </header>
  );
}
