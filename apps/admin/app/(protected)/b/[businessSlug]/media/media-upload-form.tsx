"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { ImageUploadIcon } from "@darb/icons";

import { completeMediaUploadAction, registerMediaUploadAction } from "../../../../actions/media";
import { validateMediaCandidate } from "../../../../../lib/media-validation";
import { createBrowserSupabaseClient } from "../../../../../lib/supabase/browser";

interface MediaUploadFormProps {
  businessId: string;
  businessSlug: string;
}

export function MediaUploadForm({ businessId, businessSlug }: MediaUploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = formData.get("mediaFile");
    const altText = formData.get("altText");

    if (!(value instanceof File)) {
      setError("Choose an image or video to upload.");
      return;
    }

    const validated = validateMediaCandidate({
      byteSize: value.size,
      filename: value.name,
      mimeType: value.type,
    });

    if (!validated.success) {
      setError(validated.message);
      return;
    }

    setPending(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const dimensions = validated.data.kind === "image" ? await readImageDimensions(value) : null;
      const reservation = await registerMediaUploadAction(businessId, {
        altText: typeof altText === "string" ? altText : "",
        byteSize: value.size,
        filename: value.name,
        height: dimensions?.height ?? null,
        mimeType: value.type,
        width: dimensions?.width ?? null,
      });

      if (
        reservation.status !== "success" ||
        !reservation.assetId ||
        !reservation.storageBucket ||
        !reservation.storagePath ||
        !reservation.mimeType
      ) {
        setError(
          reservation.fieldErrors?.file ??
            reservation.fieldErrors?.altText ??
            reservation.message ??
            "The upload could not be prepared.",
        );
        return;
      }

      const storage = createBrowserSupabaseClient();
      const { error: uploadError } = await storage.storage
        .from(reservation.storageBucket)
        .upload(reservation.storagePath, value, {
          cacheControl: "31536000",
          contentType: reservation.mimeType,
          upsert: false,
        });

      if (uploadError) {
        setError(
          "The file could not be uploaded. The incomplete reservation can be archived safely.",
        );
        return;
      }

      const completion = await completeMediaUploadAction(
        businessId,
        businessSlug,
        reservation.assetId,
      );

      if (completion.status !== "success") {
        setError(completion.message ?? "The stored file could not be verified.");
        return;
      }

      formRef.current?.reset();
      setMessage(completion.message);
      router.refresh();
    } catch {
      setError("The upload did not complete. Check the file and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="media-upload-panel" aria-labelledby="media-upload-heading">
      <div className="media-upload-panel__intro">
        <span>
          <ImageUploadIcon size={24} />
        </span>
        <div>
          <h2 id="media-upload-heading">Add a shared asset</h2>
          <p>Images up to 10 MB · MP4 or WebM video up to 100 MB</p>
        </div>
      </div>

      <form ref={formRef} className="media-upload-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="media-file">Image or video</label>
          <input
            id="media-file"
            className="file-input"
            name="mediaFile"
            type="file"
            accept="image/avif,image/jpeg,image/png,image/webp,video/mp4,video/webm"
            required
            disabled={pending}
          />
          <p className="field-hint">The file goes directly to Supabase Storage under tenant RLS.</p>
        </div>
        <div className="field-group">
          <label htmlFor="media-alt-text">Alternative text</label>
          <textarea
            id="media-alt-text"
            name="altText"
            maxLength={500}
            rows={2}
            disabled={pending}
            placeholder="Describe the meaningful visual content"
          />
        </div>
        <button
          type="submit"
          className="primary-button media-upload-form__submit"
          disabled={pending}
        >
          {pending ? "Uploading securely…" : "Upload media"}
        </button>
      </form>

      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="success-alert" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}

async function readImageDimensions(file: File): Promise<{ height: number; width: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { height: bitmap.height, width: bitmap.width };
    bitmap.close();
    return dimensions;
  } catch {
    return null;
  }
}
