"use client";

import { useAdminI18n } from "../../../../../lib/i18n-client";

import { AlertCircleIcon, ResetIcon } from "@darb/icons";

import styles from "./restaurant.module.css";

export default function RestaurantError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useAdminI18n();
  return (
    <section className={styles.empty} role="alert">
      <AlertCircleIcon size={27} />
      <h2>{t("Restaurant administration could not be loaded")}</h2>
      <p>
        {t("Your business navigation remains available. Retry without exposing internal details.")}
      </p>
      <button className="primary-button" type="button" onClick={reset}>
        <ResetIcon size={17} /> {t("Retry")}
      </button>
    </section>
  );
}
