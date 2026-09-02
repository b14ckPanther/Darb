import Link from "next/link";

import { AdminState } from "../../_components/admin-state";
import { platformPaths } from "../../../lib/platform-model";

export default function PlatformNotFound() {
  return (
    <AdminState
      eyebrow="Platform administration"
      title="That platform resource is unavailable."
      description="It may no longer exist, or the identifier is not valid for this control-plane route."
      action={
        <Link className="primary-link" href={platformPaths.home}>
          Return to overview
        </Link>
      }
    />
  );
}
