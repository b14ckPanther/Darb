"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowRightIcon } from "@darb/icons";
import { useAdminI18n } from "../../lib/i18n-client";

export interface PageHeaderCrumb {
  href?: string;
  label: string;
}

interface PageHeaderProps {
  actions?: ReactNode;
  breadcrumbs?: readonly PageHeaderCrumb[];
  eyebrow: string;
  status?: ReactNode;
  summary: string;
  title: string;
}

export function PageHeader({
  actions,
  breadcrumbs,
  eyebrow,
  status,
  summary,
  title,
}: PageHeaderProps) {
  const { t } = useAdminI18n();
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="page-breadcrumbs" aria-label={t("Breadcrumb")}>
            <ol>
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`}>
                  {index > 0 ? <ArrowRightIcon size={14} /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href}>{t(crumb.label)}</Link>
                  ) : (
                    <span>{t(crumb.label)}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <p className="eyebrow">{t(eyebrow)}</p>
        <div className="page-header__title-row">
          <h1>{t(title)}</h1>
          {status}
        </div>
        <p className="page-header__summary">{t(summary)}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
