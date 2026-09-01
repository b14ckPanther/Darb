import { ImageUploadIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { canManageMedia } from "../../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { listBusinessMediaAssets } from "../../../../../lib/media";
import { buildPublicMediaUrl } from "../../../../../lib/media-validation";
import { businessPath } from "../../../../../lib/navigation";
import { getSupabasePublicConfig } from "../../../../../lib/supabase/config";
import { createServerComponentSupabaseClient } from "../../../../../lib/supabase/server";
import { MediaAssetCard } from "./media-asset-card";
import { MediaUploadForm } from "./media-upload-form";

interface MediaPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function MediaPage({ params }: MediaPageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const supabase = await createServerComponentSupabaseClient();
  const assets = await listBusinessMediaAssets(supabase, context.business.id);
  const editable = canManageMedia(context.access, context.business.status);
  const { url: supabaseUrl } = getSupabasePublicConfig();

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: "Overview" },
          { label: "Media" },
        ]}
        eyebrow="Shared assets"
        title="Media"
        summary="Upload reusable images and videos once, then let future Darb experiences reference their stable asset IDs."
      />

      {!editable ? (
        <PermissionNotice title="Media is read-only.">
          {context.business.status !== "active"
            ? "Media cannot be changed while this business is suspended or archived."
            : "The media.manage permission is required to upload, describe, or archive assets."}
        </PermissionNotice>
      ) : (
        <MediaUploadForm businessId={context.business.id} businessSlug={context.business.slug} />
      )}

      {assets.length === 0 ? (
        <section className="empty-state media-empty-state">
          <span>
            <ImageUploadIcon size={22} />
          </span>
          <div>
            <h2>No media yet</h2>
            <p>Upload the first image or video when this business has a real shared asset.</p>
          </div>
        </section>
      ) : (
        <section className="media-library" aria-labelledby="media-library-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Asset library</p>
              <h2 id="media-library-heading">Stored media</h2>
            </div>
            <span className="count-badge" aria-label={`${assets.length} assets`}>
              {assets.length}
            </span>
          </div>
          <ul className="media-grid">
            {assets.map((asset) => (
              <li key={asset.id}>
                <MediaAssetCard
                  asset={asset}
                  businessId={context.business.id}
                  businessSlug={context.business.slug}
                  editable={editable}
                  publicUrl={buildPublicMediaUrl(
                    supabaseUrl,
                    asset.storage_bucket,
                    asset.storage_path,
                  )}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
