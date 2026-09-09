"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowRightIcon, ImageIcon, SearchIcon } from "@darb/icons";
import { formatRestaurantMoney } from "@darb/restaurant";

import { saveRestaurantItemAction } from "../../../../actions/restaurant";
import { useAdminI18n } from "../../../../../lib/i18n-client";
import {
  filterRestaurantItems,
  type RestaurantItemFilterAvailability,
  type RestaurantItemFilterMedia,
} from "../../../../../lib/restaurant-operations";
import styles from "./restaurant.module.css";
import { useRestaurantActionState } from "./use-restaurant-action-state";

interface WorkspaceCategory {
  id: string;
  name: string;
}

interface WorkspaceItem {
  availabilityStatus: "available" | "sold_out";
  basePriceMinor: number;
  categoryId: string;
  categoryName: string;
  displayOrder: number;
  hasImage: boolean;
  id: string;
  imageAlt: string | null;
  imageId: string | null;
  imageUrl: string | null;
  internalName: string;
  isVisible: boolean;
  lifecycleStatus: "active" | "archived";
  localizedName: string;
  modifierGroupCount: number;
  variantCount: number;
}

export function MenuContentWorkspace({
  businessId,
  businessSlug,
  categories,
  currencyCode,
  editable,
  items,
  menuId,
}: {
  businessId: string;
  businessSlug: string;
  categories: WorkspaceCategory[];
  currencyCode: string;
  editable: boolean;
  items: WorkspaceItem[];
  menuId: string;
}) {
  const { locale, t } = useAdminI18n();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [availability, setAvailability] = useState<RestaurantItemFilterAvailability>("all");
  const [media, setMedia] = useState<RestaurantItemFilterMedia>("all");

  const filteredItems = useMemo(
    () => filterRestaurantItems(items, { availability, categoryId, media, query }),
    [availability, categoryId, items, media, query],
  );
  const filtering =
    query.length > 0 || categoryId !== "all" || availability !== "all" || media !== "all";

  return (
    <div className={styles.contentWorkspace}>
      <div className={styles.filterBar} role="search" aria-label={t("Filter menu items")}>
        <label className={styles.searchField}>
          <span className="visually-hidden">{t("Search items")}</span>
          <SearchIcon size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search by customer or internal name")}
          />
        </label>
        <label>
          <span className="visually-hidden">{t("Filter by category")}</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="all">{t("All categories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="visually-hidden">{t("Filter by availability")}</span>
          <select
            value={availability}
            onChange={(event) =>
              setAvailability(event.target.value as RestaurantItemFilterAvailability)
            }
          >
            <option value="all">{t("All availability")}</option>
            <option value="available">{t("Available")}</option>
            <option value="sold_out">{t("Sold out")}</option>
          </select>
        </label>
        <label>
          <span className="visually-hidden">{t("Filter by image")}</span>
          <select
            value={media}
            onChange={(event) => setMedia(event.target.value as RestaurantItemFilterMedia)}
          >
            <option value="all">{t("All images")}</option>
            <option value="with_image">{t("With image")}</option>
            <option value="without_image">{t("Missing image")}</option>
          </select>
        </label>
      </div>

      <div className={styles.resultSummary} aria-live="polite">
        <span>
          {t("Showing {visible} of {total} items", {
            total: items.length,
            visible: filteredItems.length,
          })}
        </span>
        {filtering ? (
          <button
            className={styles.clearFilters}
            type="button"
            onClick={() => {
              setQuery("");
              setCategoryId("all");
              setAvailability("all");
              setMedia("all");
            }}
          >
            {t("Clear filters")}
          </button>
        ) : null}
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.filteredEmpty}>
          <SearchIcon size={22} />
          <strong>{t("No items match these filters")}</strong>
          <p>{t("Clear one or more filters to see the rest of this menu.")}</p>
        </div>
      ) : (
        <ul className={styles.itemInventory}>
          {filteredItems.map((item) => (
            <li key={item.id} className={styles.itemInventoryCard}>
              <div className={styles.itemThumb}>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt ?? ""}
                    width={176}
                    height={132}
                    unoptimized={isLocalStorageUrl(item.imageUrl)}
                  />
                ) : (
                  <span aria-label={t("Missing image")}>
                    <ImageIcon size={22} />
                  </span>
                )}
              </div>
              <div className={styles.itemIdentity}>
                <div>
                  <strong dir="auto">{item.localizedName}</strong>
                  <span>{item.categoryName}</span>
                </div>
                <bdi className={styles.itemPrice}>
                  {formatRestaurantMoney(item.basePriceMinor, currencyCode, locale)}
                </bdi>
                <div className={styles.itemSignals}>
                  <span data-tone={item.isVisible ? "positive" : "quiet"}>
                    {item.isVisible ? t("Visible") : t("Hidden")}
                  </span>
                  <span>{t("{count} variants", { count: item.variantCount })}</span>
                  <span>{t("{count} modifier groups", { count: item.modifierGroupCount })}</span>
                </div>
              </div>
              <div className={styles.itemOperations}>
                <QuickAvailabilityForm
                  businessId={businessId}
                  businessSlug={businessSlug}
                  editable={editable && item.lifecycleStatus === "active"}
                  item={item}
                  menuId={menuId}
                />
                <Link
                  className={styles.openItemButton}
                  href={`/b/${businessSlug}/restaurant/items/${item.id}`}
                >
                  {t("Open item")}
                  <ArrowRightIcon size={15} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickAvailabilityForm({
  businessId,
  businessSlug,
  editable,
  item,
  menuId,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  item: WorkspaceItem;
  menuId: string;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantItemAction.bind(null, businessId, businessSlug, item.id);
  const [state, formAction, pending] = useRestaurantActionState(action);
  const nextStatus = item.availabilityStatus === "available" ? "sold_out" : "available";

  return (
    <form className={styles.quickAvailability} action={formAction} aria-busy={pending}>
      <input type="hidden" name="menuId" value={menuId} />
      <input type="hidden" name="categoryId" value={item.categoryId} />
      <input type="hidden" name="internalName" value={item.internalName} />
      <input type="hidden" name="price" value={(item.basePriceMinor / 100).toFixed(2)} />
      <input type="hidden" name="imageMediaAssetId" value={item.imageId ?? ""} />
      <input type="hidden" name="isVisible" value={String(item.isVisible)} />
      <input type="hidden" name="lifecycleStatus" value={item.lifecycleStatus} />
      <input type="hidden" name="displayOrder" value={item.displayOrder} />
      <button
        type="submit"
        name="availabilityStatus"
        value={nextStatus}
        disabled={!editable || pending}
        data-status={item.availabilityStatus}
      >
        {pending
          ? t("Updating…")
          : item.availabilityStatus === "available"
            ? t("Available")
            : t("Sold out")}
      </button>
      {state.message ? (
        <span
          className={state.status === "error" ? styles.inlineError : styles.inlineSuccess}
          role={state.status === "error" ? "alert" : "status"}
        >
          {t(state.message)}
        </span>
      ) : null}
    </form>
  );
}

function isLocalStorageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return false;
  }
}
