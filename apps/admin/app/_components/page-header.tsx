import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowRightIcon } from "@darb/icons";

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
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="page-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`}>
                  {index > 0 ? <ArrowRightIcon size={14} /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <p className="eyebrow">{eyebrow}</p>
        <div className="page-header__title-row">
          <h1>{title}</h1>
          {status}
        </div>
        <p className="page-header__summary">{summary}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
