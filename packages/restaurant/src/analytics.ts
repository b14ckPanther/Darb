import type { SupportedLocale } from "@darb/i18n";

export interface RestaurantAnalyticsContext {
  businessSlug: string;
  locale: SupportedLocale;
  routeKind: "custom" | "platform";
}

export type RestaurantAnalyticsEvent =
  | {
      context: RestaurantAnalyticsContext;
      name: "restaurant.page_viewed";
      payload: { hasLocation: boolean };
    }
  | {
      context: RestaurantAnalyticsContext;
      name: "restaurant.category_selected";
      payload: { categoryId: string };
    }
  | {
      context: RestaurantAnalyticsContext;
      name: "restaurant.menu_item_opened";
      payload: { itemId: string };
    }
  | {
      context: RestaurantAnalyticsContext;
      name: "restaurant.locale_changed";
      payload: { toLocale: SupportedLocale };
    }
  | {
      context: RestaurantAnalyticsContext;
      name: "restaurant.location_changed";
      payload: { hasLocation: boolean };
    }
  | {
      context: RestaurantAnalyticsContext;
      name: "restaurant.outbound_link_clicked";
      payload: { destination: "darb" };
    };

export type RestaurantAnalyticsEventInput = RestaurantAnalyticsEvent extends infer Event
  ? Event extends { context: RestaurantAnalyticsContext }
    ? Omit<Event, "context">
    : never
  : never;

export interface RestaurantAnalyticsAdapter {
  track(event: RestaurantAnalyticsEvent): Promise<void> | void;
}

export const noOpRestaurantAnalyticsAdapter: RestaurantAnalyticsAdapter = {
  track() {},
};

export function trackRestaurantAnalytics(
  adapter: RestaurantAnalyticsAdapter,
  event: RestaurantAnalyticsEvent,
): void {
  try {
    void Promise.resolve(adapter.track(event)).catch(() => undefined);
  } catch {
    // Analytics is intentionally best-effort and cannot affect the customer experience.
  }
}
