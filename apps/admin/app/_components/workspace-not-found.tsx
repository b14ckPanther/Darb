import Link from "next/link";

import { ArrowRightIcon, BuildingIcon } from "@darb/icons";

import { AdminState } from "./admin-state";

export function WorkspaceNotFound() {
  return (
    <main id="main-content" className="route-state-page">
      <AdminState
        eyebrow="Unavailable workspace"
        title="That business is not available to this account."
        description="The link may be outdated, or your access may have changed. Darb does not reveal whether an inaccessible tenant exists."
        icon={<BuildingIcon size={24} />}
        action={
          <Link className="text-link" href="/">
            Choose an accessible business
            <ArrowRightIcon size={17} />
          </Link>
        }
      />
    </main>
  );
}
