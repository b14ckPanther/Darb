# Shared media

Status: shared image/video metadata, reproducible Storage buckets, secure upload coordination, and
the tenant admin surface are implemented. Engine references and media processing are deferred.

## Data and ownership

`core.media_assets` belongs directly to `core.businesses`. It stores the immutable Storage identity,
media kind, reviewed MIME type, byte size, optional image dimensions/video duration, alt text,
original filename, lifecycle, creator, and timestamps. Future engines should reference the asset
UUID instead of copying paths or creating engine-specific media tables.

Paths are database-derived as `<business-uuid>/<asset-uuid>/asset.<canonical-extension>`. Slugs and
original filenames never define object ownership. An asset moves from `pending` reservation to
`active`, then may be `archived`; normal tenant workflows do not hard-delete metadata or objects.

## Storage and delivery

Darb uses two shared, engine-neutral buckets:

| Bucket                | Allowed content       | Limit   |
| --------------------- | --------------------- | ------- |
| `tenant-media-images` | AVIF, JPEG, PNG, WebP | 10 MiB  |
| `tenant-media-videos` | MP4, WebM             | 100 MiB |

Both buckets are public-read so future QR-heavy storefronts can use cacheable asset URLs without
per-request signing. This intentionally means anyone who knows an object URL can read it; these
buckets must contain only public-delivery-safe business media. Metadata listing and every write
remain tenant-protected. Private documents or confidential media require a separate future storage
classification, not these buckets.

Two kind-specific buckets are used because Supabase Storage enforces MIME and maximum size reliably
at bucket preflight; object metadata is finalized later in the upload lifecycle. This preserves the
different image/video ceilings without per-business or per-engine buckets.

## Upload boundary

1. `core.register_media_asset` derives the caller with `auth.uid()`, requires business-wide
   `media.manage`, validates metadata, and reserves the immutable bucket/path.
2. The browser uploads directly with its normal authenticated session. Storage RLS accepts only the
   caller's exact pending reservation, matching bucket/path, and current permission. Overwrite,
   update, and delete policies are absent.
3. `core.complete_media_asset` rechecks owner, MIME, and byte size on the stored object before making
   the asset active and auditing `business.media_registered`.

No privileged client participates. An interrupted upload leaves a pending reservation that cannot
be used as active media and can be archived; automated stale-reservation cleanup is deferred.

Alt-text changes and archive are idempotent, active-business, permission-checked RPCs. They emit
`business.media_updated` and `business.media_archived` with narrow metadata. Archive deliberately
retains the object; controlled physical deletion and recovery policy need a later operational design.

## Performance readiness

Image dimensions are captured when the browser can decode them, enabling future aspect-ratio and
responsive-image decisions. Admin previews use responsive sizing and local development bypasses
server optimization only for loopback Storage URLs. CDN/image transformation, variants, cropping,
folders, deduplication, and engine-specific presentation are not implemented.
