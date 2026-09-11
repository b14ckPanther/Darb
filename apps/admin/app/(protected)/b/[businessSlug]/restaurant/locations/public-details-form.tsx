"use client";

import { useState } from "react";

import { CancelIcon } from "@darb/icons";
import { formatRestaurantWeekday, type RestaurantOpeningInterval } from "@darb/restaurant";

import { saveRestaurantLocationPublicDetailsAction } from "../../../../../actions/restaurant";
import { useAdminI18n } from "../../../../../../lib/i18n-client";
import type {
  RestaurantLocationOpeningInterval,
  RestaurantLocationPublicProfile,
} from "../../../../../../lib/restaurant";
import { useRestaurantActionState } from "../use-restaurant-action-state";
import styles from "../restaurant.module.css";

export function LocationPublicDetailsForm({
  businessId,
  businessSlug,
  editable,
  hours,
  locationId,
  locationName,
  profile,
  timezone,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  hours: RestaurantLocationOpeningInterval[];
  locationId: string;
  locationName: string;
  profile: RestaurantLocationPublicProfile | null;
  timezone: string;
}) {
  const { locale, t } = useAdminI18n();
  const [contact, setContact] = useState({
    email: profile?.public_email ?? "",
    mapUrl: profile?.map_url ?? "",
    phone: profile?.public_phone ?? "",
    websiteUrl: profile?.website_url ?? "",
    whatsappPhone: profile?.whatsapp_phone ?? "",
  });
  const [intervals, setIntervals] = useState<RestaurantOpeningInterval[]>(
    hours.map((row) => ({
      closesAt: row.closes_at.slice(0, 5),
      opensAt: row.opens_at.slice(0, 5),
      weekday: row.iso_weekday,
    })),
  );
  const action = saveRestaurantLocationPublicDetailsAction.bind(
    null,
    businessId,
    businessSlug,
    locationId,
  );
  const [state, formAction, pending] = useRestaurantActionState(action);

  const updateInterval = (index: number, field: "closesAt" | "opensAt", value: string) => {
    setIntervals((current) =>
      current.map((interval, candidateIndex) =>
        candidateIndex === index ? { ...interval, [field]: value } : interval,
      ),
    );
  };
  const updateContact = (field: keyof typeof contact, value: string) => {
    setContact((current) => ({ ...current, [field]: value }));
  };

  return (
    <form className={styles.form} action={formAction} aria-busy={pending}>
      <input type="hidden" name="openingHours" value={JSON.stringify(intervals)} />
      {state.message ? (
        <p
          className={`${styles.feedback}${state.status === "error" ? ` ${styles.feedbackError}` : ""}`}
          role="status"
        >
          {t(state.message)}
        </p>
      ) : null}
      <div className={styles.publicContactGrid}>
        <label className={styles.field}>
          <span>{t("Public phone")}</span>
          <input
            name="phone"
            type="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="+972501234567"
            value={contact.phone}
            onChange={(event) => updateContact("phone", event.target.value)}
            disabled={!editable}
            aria-invalid={Boolean(state.fieldErrors?.phone)}
          />
          {state.fieldErrors?.phone ? (
            <small className={styles.error}>{t(state.fieldErrors.phone)}</small>
          ) : null}
        </label>
        <label className={styles.field}>
          <span>{t("Public email")}</span>
          <input
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={contact.email}
            onChange={(event) => updateContact("email", event.target.value)}
            disabled={!editable}
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email ? (
            <small className={styles.error}>{t(state.fieldErrors.email)}</small>
          ) : null}
        </label>
        <label className={styles.field}>
          <span>{t("Website")}</span>
          <input
            name="websiteUrl"
            type="url"
            dir="ltr"
            inputMode="url"
            placeholder="https://example.com"
            value={contact.websiteUrl}
            onChange={(event) => updateContact("websiteUrl", event.target.value)}
            disabled={!editable}
            aria-invalid={Boolean(state.fieldErrors?.websiteUrl)}
          />
          {state.fieldErrors?.websiteUrl ? (
            <small className={styles.error}>{t(state.fieldErrors.websiteUrl)}</small>
          ) : null}
        </label>
        <label className={styles.field}>
          <span>{t("WhatsApp phone")}</span>
          <input
            name="whatsappPhone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            placeholder="+972501234567"
            value={contact.whatsappPhone}
            onChange={(event) => updateContact("whatsappPhone", event.target.value)}
            disabled={!editable}
            aria-invalid={Boolean(state.fieldErrors?.whatsappPhone)}
          />
          {state.fieldErrors?.whatsappPhone ? (
            <small className={styles.error}>{t(state.fieldErrors.whatsappPhone)}</small>
          ) : null}
        </label>
        <label className={`${styles.field} ${styles.wide}`}>
          <span>{t("Map link")}</span>
          <input
            name="mapUrl"
            type="url"
            dir="ltr"
            inputMode="url"
            placeholder="https://maps.google.com/…"
            value={contact.mapUrl}
            onChange={(event) => updateContact("mapUrl", event.target.value)}
            disabled={!editable}
            aria-invalid={Boolean(state.fieldErrors?.mapUrl)}
          />
          {state.fieldErrors?.mapUrl ? (
            <small className={styles.error}>{t(state.fieldErrors.mapUrl)}</small>
          ) : null}
        </label>
      </div>

      <fieldset className={styles.hoursFieldset}>
        <legend>{t("Regular opening hours")}</legend>
        <p className={styles.hint}>
          {t(
            "Hours use {timezone}. A closing time after midnight may be earlier than its opening time.",
            { timezone },
          )}
        </p>
        {Array.from({ length: 7 }, (_, index) => index + 1).map((weekday) => {
          const dayName = formatRestaurantWeekday(weekday, locale);
          const dayIntervals = intervals
            .map((interval, intervalIndex) => ({ interval, intervalIndex }))
            .filter(({ interval }) => interval.weekday === weekday);
          return (
            <div className={styles.hoursDay} key={weekday}>
              <div className={styles.hoursDayHeading}>
                <strong>{dayName}</strong>
                <button
                  className={styles.compactButton}
                  type="button"
                  disabled={!editable || dayIntervals.length >= 8}
                  onClick={() =>
                    setIntervals((current) => [
                      ...current,
                      { closesAt: "17:00", opensAt: "09:00", weekday },
                    ])
                  }
                >
                  {t(dayIntervals.length === 0 ? "Add hours" : "Add another interval")}
                </button>
              </div>
              {dayIntervals.length === 0 ? (
                <span className={styles.closedDay}>{t("Closed")}</span>
              ) : (
                <div className={styles.hoursIntervals}>
                  {dayIntervals.map(({ interval, intervalIndex }) => (
                    <div className={styles.hoursInterval} key={`${weekday}-${intervalIndex}`}>
                      <label>
                        <span>{t("Opens")}</span>
                        <input
                          type="time"
                          value={interval.opensAt}
                          disabled={!editable}
                          aria-label={t("Opening time for {day}", { day: dayName })}
                          onChange={(event) =>
                            updateInterval(intervalIndex, "opensAt", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span>{t("Closes")}</span>
                        <input
                          type="time"
                          value={interval.closesAt}
                          disabled={!editable}
                          aria-label={t("Closing time for {day}", { day: dayName })}
                          onChange={(event) =>
                            updateInterval(intervalIndex, "closesAt", event.target.value)
                          }
                        />
                      </label>
                      <button
                        className={styles.removeInterval}
                        type="button"
                        disabled={!editable}
                        aria-label={t("Remove opening interval for {day}", { day: dayName })}
                        onClick={() =>
                          setIntervals((current) =>
                            current.filter((_, candidateIndex) => candidateIndex !== intervalIndex),
                          )
                        }
                      >
                        <CancelIcon size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {state.fieldErrors?.openingHours ? (
          <small className={styles.error}>{t(state.fieldErrors.openingHours)}</small>
        ) : null}
      </fieldset>

      {editable ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving hours & contact…") : t("Save hours & contact")}
          </button>
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {pending ? t("Saving public details for {location}.", { location: locationName }) : ""}
      </span>
    </form>
  );
}
