import Link from "next/link";

import { AdminState } from "../../_components/admin-state";
import { platformPaths } from "../../../lib/platform-model";
import { getAdminI18n } from "../../../lib/i18n-server";

export default async function PlatformNotFound() {
  const { t } = await getAdminI18n();
  return (
    <AdminState
      eyebrow="Platform administration"
      title="That platform resource is unavailable."
      description="It may no longer exist, or the identifier is not valid for this control-plane route."
      action={
        <Link className="primary-link" href={platformPaths.home}>
          {t("Return to overview")}
        </Link>
      }
    />
  );
}
