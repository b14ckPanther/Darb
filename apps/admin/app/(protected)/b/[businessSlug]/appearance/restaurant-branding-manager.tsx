"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { CheckmarkCircleIcon, ImageIcon, VideoIcon } from "@darb/icons";
import type { RestaurantBrandingRole } from "@darb/restaurant";

import { ConfirmationDialog } from "../../../../_components/confirmation-dialog";
import { setBusinessBrandingMediaAction } from "../../../../actions/appearance";
import type {
  BrandingMediaOption,
  RestaurantBrandingAssignments,
} from "../../../../../lib/branding-media";
import { initialFormState, type FormState } from "../../../../../lib/forms";
import styles from "./appearance.module.css";

interface RestaurantBrandingManagerProps {
  assignments: RestaurantBrandingAssignments;
  businessId: string;
  editable: boolean;
  heroOptions: BrandingMediaOption[];
  logoOptions: BrandingMediaOption[];
}

const roleCopy = {
  logo: {
    description: "A transparent or simply framed image works best across the public header.",
    fallback: "The Restaurant icon and business name remain the safe fallback.",
    title: "Restaurant logo",
  },
  hero: {
    description: "Choose an image or short video that represents the public Restaurant experience.",
    fallback: "Published menu photography or the template motif remains the safe fallback.",
    title: "Hero media",
  },
} as const;

export function RestaurantBrandingManager({
  assignments,
  businessId,
  editable,
  heroOptions,
  logoOptions,
}: RestaurantBrandingManagerProps) {
  return (
    <section className={styles.brandingManager} aria-labelledby="restaurant-branding-heading">
      <header className={styles.brandingHeader}>
        <div>
          <p className="eyebrow">Restaurant identity</p>
          <h2 id="restaurant-branding-heading">Brand media</h2>
          <p>
            Assign approved Media Library assets to stable Restaurant roles. Removing an assignment
            restores the template fallback without deleting the asset.
          </p>
        </div>
        <span className={styles.contextKey} dir="ltr">
          restaurant
        </span>
      </header>
      <div className={styles.brandingGrid}>
        <BrandingRoleCard
          businessId={businessId}
          currentId={assignments.logo}
          editable={editable}
          options={logoOptions}
          role="logo"
        />
        <BrandingRoleCard
          businessId={businessId}
          currentId={assignments.hero}
          editable={editable}
          options={heroOptions}
          role="hero"
        />
      </div>
    </section>
  );
}

function BrandingRoleCard({
  businessId,
  currentId,
  editable,
  options,
  role,
}: {
  businessId: string;
  currentId: string | null;
  editable: boolean;
  options: BrandingMediaOption[];
  role: RestaurantBrandingRole;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [assignedId, setAssignedId] = useState(currentId);
  const [selectedId, setSelectedId] = useState(currentId ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<FormState>(initialFormState);
  const action = useMemo(() => setBusinessBrandingMediaAction.bind(null, businessId), [businessId]);
  const assigned = options.find((option) => option.id === assignedId) ?? null;
  const copy = roleCopy[role];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pickerOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!pickerOpen && dialog.open) {
      dialog.close();
    }
  }, [pickerOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const close = () => {
      setPickerOpen(false);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
    const cancel = (event: Event) => {
      if (pending) event.preventDefault();
    };
    dialog.addEventListener("close", close);
    dialog.addEventListener("cancel", cancel);
    return () => {
      dialog.removeEventListener("close", close);
      dialog.removeEventListener("cancel", cancel);
    };
  }, [pending]);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pending) return;
      const formData = new FormData(event.currentTarget);
      const nextId = String(formData.get("mediaAssetId") ?? "");
      setPending(true);
      setState(initialFormState);
      try {
        const result = await action(formData);
        setState(result);
        if (result.status === "success") {
          setAssignedId(nextId || null);
          setSelectedId(nextId);
          setPickerOpen(false);
          setConfirmRemove(false);
          router.refresh();
        }
      } catch {
        setState({
          message: "The branding request did not complete. Check your connection and try again.",
          status: "error",
        });
      } finally {
        setPending(false);
      }
    },
    [action, pending, router],
  );

  return (
    <article className={styles.brandingCard} aria-labelledby={`${role}-branding-title`}>
      <div className={styles.brandingPreview}>
        {assigned ? (
          <MediaPreview asset={assigned} priority={role === "logo"} />
        ) : (
          <ImageIcon size={30} />
        )}
      </div>
      <div className={styles.brandingCopy}>
        <span>{assigned ? `${assigned.kind} assigned` : "Template fallback"}</span>
        <h3 id={`${role}-branding-title`}>{copy.title}</h3>
        <p>{copy.description}</p>
        {!assigned ? (
          <small>{copy.fallback}</small>
        ) : (
          <small title={assigned.label}>{assigned.label}</small>
        )}
      </div>
      {editable ? (
        <div className={styles.brandingActions}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSelectedId(assignedId ?? "");
              setPickerOpen(true);
            }}
          >
            {assigned ? "Replace" : "Choose media"}
          </button>
          {assigned ? (
            <button type="button" className="text-button" onClick={() => setConfirmRemove(true)}>
              Remove assignment
            </button>
          ) : null}
        </div>
      ) : (
        <p className={styles.brandingReadOnly}>Read-only</p>
      )}

      {state.message ? (
        <p
          className={state.status === "error" ? styles.error : styles.success}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" ? <CheckmarkCircleIcon size={17} /> : null}
          {state.message}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        className={styles.mediaDialog}
        aria-labelledby={`${role}-picker-title`}
      >
        <form onSubmit={submit}>
          <input type="hidden" name="role" value={role} />
          <header>
            <div>
              <p className="eyebrow">Media Library</p>
              <h2 id={`${role}-picker-title`}>Choose {copy.title.toLowerCase()}</h2>
            </div>
            <button
              type="button"
              className="text-button"
              disabled={pending}
              onClick={() => setPickerOpen(false)}
            >
              Close
            </button>
          </header>
          {options.length > 0 ? (
            <fieldset className={styles.brandingMediaGrid}>
              <legend>Compatible active media</legend>
              {options.map((asset) => (
                <label key={asset.id} className={styles.brandingMediaChoice}>
                  <input
                    type="radio"
                    name="mediaAssetId"
                    value={asset.id}
                    checked={selectedId === asset.id}
                    onChange={() => setSelectedId(asset.id)}
                  />
                  <MediaPreview asset={asset} />
                  <span>
                    {asset.kind === "video" ? <VideoIcon size={15} /> : <ImageIcon size={15} />}{" "}
                    {asset.label}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className={styles.brandingEmpty}>
              <ImageIcon size={28} />
              <h3>No compatible active media</h3>
              <p>
                Add an approved {role === "logo" ? "image" : "image or video"} in Media Library
                first.
              </p>
            </div>
          )}
          <footer>
            <button
              type="button"
              className="secondary-button"
              disabled={pending}
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={pending || !selectedId}>
              {pending ? "Assigning…" : "Assign media"}
            </button>
          </footer>
        </form>
      </dialog>

      <ConfirmationDialog
        description={`This removes the ${copy.title.toLowerCase()} assignment and restores the safe template fallback. The Media Library asset is retained.`}
        onClose={() => setConfirmRemove(false)}
        open={confirmRemove}
        pending={pending}
        title={`Remove ${copy.title.toLowerCase()}?`}
      >
        <button
          type="button"
          className="secondary-button"
          disabled={pending}
          onClick={() => setConfirmRemove(false)}
        >
          Cancel
        </button>
        <form onSubmit={submit}>
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="mediaAssetId" value="" />
          <button type="submit" className="danger-button" disabled={pending}>
            {pending ? "Removing…" : "Remove assignment"}
          </button>
        </form>
      </ConfirmationDialog>
    </article>
  );
}

function MediaPreview({
  asset,
  priority = false,
}: {
  asset: BrandingMediaOption;
  priority?: boolean;
}) {
  return asset.kind === "image" ? (
    <Image
      src={asset.url}
      alt={asset.alt}
      width={asset.width ?? 640}
      height={asset.height ?? 480}
      priority={priority}
      unoptimized={isLocalStorageUrl(asset.url)}
    />
  ) : (
    <video src={asset.url} aria-label={asset.alt} muted playsInline preload="metadata" />
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
