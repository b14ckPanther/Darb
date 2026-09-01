"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { ArchiveIcon, ImageIcon, VideoIcon } from "@darb/icons";

import { archiveMediaAssetAction, updateMediaAltTextAction } from "../../../../actions/media";
import type { AccessibleMediaAsset } from "../../../../../lib/media";
import { initialFormState } from "../../../../../lib/forms";

interface MediaAssetCardProps {
  asset: AccessibleMediaAsset;
  businessId: string;
  businessSlug: string;
  editable: boolean;
  publicUrl: string;
}

export function MediaAssetCard({
  asset,
  businessId,
  businessSlug,
  editable,
  publicUrl,
}: MediaAssetCardProps) {
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const updateAction = updateMediaAltTextAction.bind(null, businessId, businessSlug, asset.id);
  const archiveAction = archiveMediaAssetAction.bind(null, businessId, businessSlug, asset.id);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialFormState,
  );
  const [archiveState, archiveFormAction, archivePending] = useActionState(
    archiveAction,
    initialFormState,
  );
  const active = asset.status === "active";

  return (
    <article
      className={`media-card media-card--${asset.status}`}
      aria-label={asset.original_filename}
    >
      <div className="media-card__preview">
        {active && asset.media_kind === "image" ? (
          <Image
            src={publicUrl}
            alt={asset.alt_text ?? ""}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={isLocalStorageUrl(publicUrl)}
          />
        ) : active && asset.media_kind === "video" ? (
          <video
            src={publicUrl}
            controls
            preload="metadata"
            aria-label={asset.alt_text ?? asset.original_filename}
          />
        ) : (
          <span className="media-card__placeholder">
            {asset.media_kind === "image" ? <ImageIcon size={28} /> : <VideoIcon size={28} />}
          </span>
        )}
        <span className={`media-status media-status--${asset.status}`}>{asset.status}</span>
      </div>

      <div className="media-card__body">
        <div className="media-card__identity">
          <p dir="auto">{asset.original_filename}</p>
          <span>
            {formatBytes(asset.byte_size)} · {asset.mime_type}
          </span>
        </div>

        {active && editable ? (
          <form action={updateFormAction} className="media-alt-form">
            <label htmlFor={`alt-${asset.id}`}>Alternative text</label>
            <textarea
              id={`alt-${asset.id}`}
              name="altText"
              defaultValue={asset.alt_text ?? ""}
              maxLength={500}
              rows={2}
              aria-describedby={`alt-feedback-${asset.id}`}
              disabled={updatePending}
            />
            <button type="submit" className="secondary-button" disabled={updatePending}>
              {updatePending ? "Saving…" : "Save description"}
            </button>
          </form>
        ) : asset.alt_text ? (
          <p className="media-card__alt">{asset.alt_text}</p>
        ) : null}

        {updateState.message ? (
          <p
            id={`alt-feedback-${asset.id}`}
            className={updateState.status === "success" ? "inline-success" : "inline-error"}
            role={updateState.status === "success" ? "status" : "alert"}
          >
            {updateState.message}
          </p>
        ) : null}

        {editable && asset.status !== "archived" ? (
          confirmingArchive ? (
            <div className="inline-confirmation" role="group" aria-label="Archive media">
              <p>Archive this asset without deleting its stored object?</p>
              <div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmingArchive(false)}
                  disabled={archivePending}
                >
                  Keep asset
                </button>
                <form action={archiveFormAction}>
                  <button type="submit" className="danger-button" disabled={archivePending}>
                    {archivePending ? "Archiving…" : "Confirm archive"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-danger-button"
              onClick={() => setConfirmingArchive(true)}
            >
              <ArchiveIcon size={17} />
              Archive asset
            </button>
          )
        ) : null}

        {archiveState.message ? (
          <p
            className={archiveState.status === "success" ? "inline-success" : "inline-error"}
            role="status"
          >
            {archiveState.message}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function isLocalStorageUrl(value: string): boolean {
  const hostname = new URL(value).hostname;
  return hostname === "127.0.0.1" || hostname === "localhost";
}
