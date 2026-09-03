import type { CSSProperties, HTMLAttributes } from "react";

import mark from "./assets/darb-mark.png";
import styles from "./darb-brand.module.css";

const markAsset = typeof mark === "string" ? { height: 128, src: mark, width: 128 } : mark;

export type DarbBrandTone = "dark" | "light";
export type DarbBrandVariant = "arabic" | "bilingual" | "latin" | "mark";
export type DarbWordmarkVariant = Exclude<DarbBrandVariant, "mark">;

export interface DarbMarkProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label?: string;
  size?: number | string;
}

export interface DarbBrandLockupProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  accessibleLabel?: string;
  compact?: boolean;
  tone?: DarbBrandTone;
  variant?: DarbBrandVariant;
}

export interface DarbWordmarkProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  tone?: DarbBrandTone;
  variant?: DarbWordmarkVariant;
}

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function markSize(size: number | string): CSSProperties {
  return {
    "--darb-brand-mark-size": typeof size === "number" ? `${size}px` : size,
  } as CSSProperties;
}

export function DarbMark({ className, label = "Darb", size = 48, ...props }: DarbMarkProps) {
  const decorative = props["aria-hidden"] === true || props["aria-hidden"] === "true";

  return (
    <span
      {...props}
      className={classNames(styles.mark, className)}
      style={{ ...markSize(size), ...props.style }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      data-darb-mark="current"
    >
      <img
        src={markAsset.src}
        width={markAsset.width}
        height={markAsset.height}
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}

export function DarbWordmark({
  className,
  tone = "dark",
  variant = "bilingual",
  ...props
}: DarbWordmarkProps) {
  return (
    <span
      {...props}
      className={classNames(styles.names, styles[`tone-${tone}`], className)}
      data-darb-wordmark={variant}
    >
      {variant !== "latin" ? (
        <span className={styles.arabic} lang="ar" dir="rtl">
          درب
        </span>
      ) : null}
      {variant !== "arabic" ? (
        <span className={styles.latin} lang="en" dir="ltr">
          Darb
        </span>
      ) : null}
    </span>
  );
}

export function DarbBrandLockup({
  accessibleLabel,
  className,
  compact = false,
  tone = "dark",
  variant = "bilingual",
  ...props
}: DarbBrandLockupProps) {
  const markOnly = variant === "mark";
  const hidden = accessibleLabel ? true : undefined;

  return (
    <span
      {...props}
      className={classNames(
        styles.lockup,
        styles[`tone-${tone}`],
        compact && styles.compact,
        className,
      )}
      aria-label={accessibleLabel}
      role={accessibleLabel ? "img" : undefined}
      data-darb-brand={variant}
    >
      <DarbMark
        className={styles.lockupMark}
        label={accessibleLabel ?? "Darb"}
        size={compact ? 36 : 48}
        aria-hidden={markOnly ? undefined : true}
      />
      {!markOnly ? <DarbWordmark tone={tone} variant={variant} aria-hidden={hidden} /> : null}
    </span>
  );
}
