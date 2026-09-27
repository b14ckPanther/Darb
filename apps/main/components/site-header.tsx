"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CancelIcon, DirectionArrowIcon, MenuIcon } from "@darb/icons";
import type { SupportedLocale } from "@darb/i18n";

import type { MainSiteCopy } from "../lib/copy";
import { getAdminRegistrationUrl, getAdminSignInUrl, getPublicLocalePath } from "../lib/site";
import { BrandLockup } from "./brand-lockup";
import { LocaleLinks } from "./locale-links";

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

  const signInUrl = getAdminSignInUrl(locale);
  const registrationUrl = getAdminRegistrationUrl(locale);
  const links = [
    { href: "#story", label: copy.nav.story },
    { href: "#paths", label: copy.nav.paths },
    { href: "#restaurant", label: copy.nav.restaurant },
    { href: "#foundation", label: copy.nav.foundation },
  ] as const;

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link className="site-header__home" href={getPublicLocalePath(locale)} aria-label="Darb">
          <BrandLockup compact />
        </Link>

        <nav className="site-header__nav" aria-label={copy.nav.primaryNavigation}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <LocaleLinks currentLocale={locale} label={copy.nav.language} />
          <a className="site-header__sign-in" href={signInUrl}>
            {copy.nav.signIn}
          </a>
          <a className="button button--gold button--compact" href={registrationUrl}>
            {copy.nav.start}
          </a>
        </div>

        <button
          ref={menuButtonRef}
          className="site-header__menu-button"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="site-directory"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon size={22} />
          <span className="sr-only">{copy.nav.openMenu}</span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id="site-directory"
        className="directory"
        aria-labelledby="site-directory-title"
        onCancel={closeMenu}
        onClose={handleDialogClose}
      >
        <div className="directory__panel">
          <div className="directory__header">
            <BrandLockup compact />
            <button type="button" className="directory__close" onClick={closeMenu}>
              <CancelIcon size={22} />
              <span className="sr-only">{copy.nav.closeMenu}</span>
            </button>
          </div>

          <p id="site-directory-title" className="directory__title">
            {copy.brandDescriptor}
          </p>

          <nav className="directory__links" aria-label={copy.nav.primaryNavigation}>
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                <span>{link.label}</span>
                <DirectionArrowIcon className="direction-icon" size={24} />
              </a>
            ))}
          </nav>

          <div className="directory__footer">
            <div className="directory__languages">
              <p>{copy.nav.language}</p>
              <LocaleLinks currentLocale={locale} label={copy.nav.language} />
            </div>
            <div className="directory__actions">
              <a className="button button--gold" href={registrationUrl}>
                {copy.nav.start}
                <DirectionArrowIcon className="direction-icon" size={18} />
              </a>
              <a className="button button--line" href={signInUrl}>
                {copy.nav.signIn}
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
