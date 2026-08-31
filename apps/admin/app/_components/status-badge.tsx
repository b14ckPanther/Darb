interface StatusBadgeProps {
  status: "active" | "archived" | "inactive" | "suspended";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{status}</span>;
}
