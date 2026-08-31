import { LockIcon } from "@darb/icons";

interface PermissionNoticeProps {
  children: string;
  title?: string;
}

export function PermissionNotice({
  children,
  title = "This section is read-only for your access level.",
}: PermissionNoticeProps) {
  return (
    <section className="permission-notice" aria-label="Permission information">
      <span>
        <LockIcon size={20} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
