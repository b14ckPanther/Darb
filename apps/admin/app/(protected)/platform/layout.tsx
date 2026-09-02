import type { ReactNode } from "react";

import { PlatformShell } from "../../_components/platform-shell";
import { requirePlatformAdmin } from "../../../lib/platform";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const context = await requirePlatformAdmin();
  return <PlatformShell user={context.user}>{children}</PlatformShell>;
}
