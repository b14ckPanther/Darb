import { ArchiveIcon, ShieldIcon } from "@darb/icons";

import { getBusinessLifecyclePresentation } from "../../lib/admin-foundation";

interface BusinessLifecycleNoticeProps {
  status: "active" | "archived" | "suspended";
}

export function BusinessLifecycleNotice({ status }: BusinessLifecycleNoticeProps) {
  if (status === "active") return null;

  const presentation = getBusinessLifecyclePresentation(status);
  const Icon = status === "suspended" ? ShieldIcon : ArchiveIcon;

  return (
    <aside
      className={`lifecycle-notice lifecycle-notice--${presentation.tone}`}
      aria-label="Business lifecycle restriction"
    >
      <span className="lifecycle-notice__icon">
        <Icon size={20} />
      </span>
      <div>
        <strong>{presentation.label}</strong>
        <p>{presentation.description}</p>
      </div>
    </aside>
  );
}
