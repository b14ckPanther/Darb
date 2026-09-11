import Link from "next/link";

import { ArrowRightIcon, LocationIcon } from "@darb/icons";

import { PageHeader } from "../../../../../_components/page-header";
import { getAdminI18n } from "../../../../../../lib/i18n-server";
import { businessPath } from "../../../../../../lib/navigation";
import { loadRestaurantLocationPublicDetails } from "../../../../../../lib/restaurant";
import {
  canMutateRestaurant,
  requireRestaurantAdminContext,
} from "../../../../../../lib/restaurant-access";
import { createServerComponentSupabaseClient } from "../../../../../../lib/supabase/server";
import { LocationPublicDetailsForm } from "./public-details-form";
import styles from "../restaurant.module.css";

export default async function RestaurantLocationsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business, locations } = context.businessContext;
  const snapshot = await loadRestaurantLocationPublicDetails(
    await createServerComponentSupabaseClient(),
    business.id,
    locations,
  );
  const editable = canMutateRestaurant(context);
  const usableLocations = snapshot.locations.filter((location) => location.status !== "archived");

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: t("Overview") },
          { href: `${businessPath(business.slug)}/restaurant`, label: t("Restaurant") },
          { label: t("Hours & contact") },
        ]}
        eyebrow={t("Public location details")}
        title={t("Hours & contact")}
        summary={t(
          "Set trustworthy opening hours and public contact details for each Restaurant location.",
        )}
      />

      {usableLocations.length === 0 ? (
        <section className={styles.empty}>
          <LocationIcon size={34} />
          <h2>{t("Add an active location first")}</h2>
          <p>{t("Restaurant hours and contact details belong to a business location.")}</p>
          <Link className="primary-link" href={`${businessPath(business.slug)}/locations/new`}>
            {t("Create location")}
            <ArrowRightIcon size={16} />
          </Link>
        </section>
      ) : (
        <div className={styles.locationPublicList}>
          {usableLocations.map((location) => (
            <section
              className={styles.panel}
              key={location.id}
              aria-labelledby={`location-public-${location.id}`}
            >
              <div className={styles.panelHeader}>
                <div>
                  <h2 id={`location-public-${location.id}`} dir="auto">
                    {location.display_name}
                  </h2>
                  <p>
                    {location.timezone ?? business.timezone} · {t(location.status)}
                  </p>
                </div>
                <LocationIcon size={22} />
              </div>
              <LocationPublicDetailsForm
                businessId={business.id}
                businessSlug={business.slug}
                editable={editable}
                hours={snapshot.hours.filter((row) => row.location_id === location.id)}
                locationId={location.id}
                locationName={location.display_name}
                timezone={location.timezone ?? business.timezone}
                profile={snapshot.profiles.find((row) => row.location_id === location.id) ?? null}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
