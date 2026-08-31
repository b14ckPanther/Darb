import type { AnchorHTMLAttributes } from "react";

import styles from "./skip-link.module.css";

export type SkipLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function SkipLink({ className, ...props }: SkipLinkProps) {
  const resolvedClassName = className ? `${styles.root} ${className}` : styles.root;

  return <a {...props} className={resolvedClassName} />;
}
