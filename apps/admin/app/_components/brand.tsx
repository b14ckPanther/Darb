import { darbPlatform } from "@darb/config/platform";

export function DarbAdminBrand() {
  return (
    <div className="brand-lockup" aria-label="Darb administration">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="brand-wordmark">
        <span>{darbPlatform.name}</span>
        <span lang="ar" dir="rtl">
          {darbPlatform.nameArabic}
        </span>
      </span>
    </div>
  );
}
