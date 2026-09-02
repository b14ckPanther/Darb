import Image from "next/image";

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`public-brand${compact ? " public-brand--compact" : ""}`}>
      <Image
        className="public-brand__mark"
        src="/brand/logo/darb-symbol.png"
        width={660}
        height={769}
        sizes="48px"
        alt=""
        aria-hidden="true"
      />
      <span className="public-brand__names">
        <span lang="ar" dir="rtl">
          درب
        </span>
        <span lang="en" dir="ltr">
          Darb
        </span>
      </span>
    </span>
  );
}
