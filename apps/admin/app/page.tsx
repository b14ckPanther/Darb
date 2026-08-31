import { darbApplications, darbPlatform } from "@darb/config/platform";

export default function AdminPage() {
  return (
    <main id="main-content" className="foundation">
      <section className="foundation__content" aria-labelledby="foundation-title">
        <p className="foundation__brand">
          <span lang="ar" dir="rtl">
            {darbPlatform.nameArabic}
          </span>
          <span aria-hidden="true">/</span>
          <span>{darbPlatform.name}</span>
        </p>
        <h1 id="foundation-title">Administration foundation</h1>
        <p className="foundation__description">
          The administration workspace is ready for deliberate product development.
        </p>
        <p className="foundation__host">{darbApplications.admin.productionHost}</p>
      </section>
    </main>
  );
}
