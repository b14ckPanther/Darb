"use client";

import { useEffect } from "react";

import {
  trackRestaurantAnalytics,
  type RestaurantAnalyticsContext,
  type RestaurantAnalyticsEvent,
  type RestaurantAnalyticsEventInput,
} from "@darb/restaurant";

import { getRestaurantAnalyticsAdapter } from "../lib/analytics";

export function ItemDialogController({
  context,
  hasLocation,
}: {
  context: RestaurantAnalyticsContext;
  hasLocation: boolean;
}) {
  useEffect(() => {
    let returnFocus: HTMLElement | null = null;
    const analytics = getRestaurantAnalyticsAdapter();
    const track = (event: RestaurantAnalyticsEventInput) => {
      trackRestaurantAnalytics(analytics, { ...event, context } as RestaurantAnalyticsEvent);
    };
    track({ name: "restaurant.page_viewed", payload: { hasLocation } });

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const opener = target.closest<HTMLElement>("[data-item-dialog-open]");
      if (opener) {
        const dialogId = opener.dataset.itemDialogOpen;
        const dialog = dialogId ? document.getElementById(dialogId) : null;
        if (dialog instanceof HTMLDialogElement) {
          returnFocus = opener;
          dialog.showModal();
          const itemId = opener.dataset.analyticsItemId;
          if (itemId) {
            track({ name: "restaurant.menu_item_opened", payload: { itemId } });
          }
        }
        return;
      }

      const analyticsTarget = target.closest<HTMLElement>("[data-analytics-event]");
      if (analyticsTarget) trackInteraction(analyticsTarget, track);

      const closer = target.closest<HTMLElement>("[data-item-dialog-close]");
      if (closer) closer.closest("dialog")?.close();
      if (target instanceof HTMLDialogElement) {
        const bounds = target.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          target.close();
        }
      }
    };
    const onClose = () => {
      returnFocus?.focus();
      returnFocus = null;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const details = document.querySelector<HTMLDetailsElement>("details[open]");
      if (!details) return;
      details.open = false;
      details.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("close", onClose, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("close", onClose, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [context, hasLocation]);

  return null;
}

function trackInteraction(
  target: HTMLElement,
  track: (event: RestaurantAnalyticsEventInput) => void,
) {
  switch (target.dataset.analyticsEvent) {
    case "category-selected": {
      const categoryId = target.dataset.analyticsCategoryId;
      if (categoryId) track({ name: "restaurant.category_selected", payload: { categoryId } });
      return;
    }
    case "locale-changed": {
      const toLocale = target.dataset.analyticsLocale;
      if (toLocale === "ar" || toLocale === "he" || toLocale === "en") {
        track({ name: "restaurant.locale_changed", payload: { toLocale } });
      }
      return;
    }
    case "location-changed":
      track({
        name: "restaurant.location_changed",
        payload: { hasLocation: target.dataset.analyticsHasLocation === "true" },
      });
      return;
    case "outbound-darb":
      track({ name: "restaurant.outbound_link_clicked", payload: { destination: "darb" } });
      return;
  }
}
