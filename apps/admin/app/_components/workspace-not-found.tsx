import Link from "next/link";

import { ArrowRightIcon, BuildingIcon } from "@darb/icons";

export function WorkspaceNotFound() {
  return (
    <main id="main-content" className="route-state-page">
      <span className="route-state-page__icon">
        <BuildingIcon size={24} />
      </span>
      <p className="eyebrow">Unavailable workspace</p>
      <h1>That business is not available to this account.</h1>
      <p>The link may be outdated, or your access may have changed.</p>
      <Link className="text-link" href="/">
        Choose an accessible business
        <ArrowRightIcon size={17} />
      </Link>
    </main>
  );
}
