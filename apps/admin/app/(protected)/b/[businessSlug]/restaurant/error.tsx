"use client";

import { AlertCircleIcon, ResetIcon } from "@darb/icons";

import styles from "./restaurant.module.css";

export default function RestaurantError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className={styles.empty} role="alert">
      <AlertCircleIcon size={27} />
      <h2>Restaurant administration could not be loaded</h2>
      <p>Your business navigation remains available. Retry without exposing internal details.</p>
      <button className="primary-button" type="button" onClick={reset}>
        <ResetIcon size={17} /> Retry
      </button>
    </section>
  );
}
