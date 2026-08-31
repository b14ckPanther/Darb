import { darbApplications, darbPlatform } from "@darb/config/platform";

export default function MainPage() {
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
        <h1 id="foundation-title">Platform foundation</h1>
        <p className="foundation__description">
          The public application workspace is ready for deliberate product development.
        </p>
        <p className="foundation__host">{darbApplications.main.productionHost}</p>
      </section>
    </main>
  );
}
