import { DarbBrandLockup } from "@darb/ui";

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <DarbBrandLockup
      accessibleLabel="Darb — درب"
      className={`public-brand${compact ? " public-brand--compact" : ""}`}
      compact={compact}
      tone="light"
    />
  );
}
