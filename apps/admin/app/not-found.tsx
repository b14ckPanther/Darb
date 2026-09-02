import Link from "next/link";

import { AdminState } from "./_components/admin-state";

export default function AdminNotFound() {
  return (
    <main id="main-content" className="route-state-page">
      <AdminState
        tone="neutral"
        eyebrow="Not found"
        title="This admin page is not available."
        description="The address may be outdated, or the workspace may no longer be accessible."
        action={
          <Link className="secondary-button" href="/">
            Return to Darb Admin
          </Link>
        }
      />
    </main>
  );
}
