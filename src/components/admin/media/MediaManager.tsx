import Image from "next/image";

import { removeProjectMedia } from "@/app/actions/admin-media";
import type { AdminProjectMedia } from "@/db/queries/admin-projects";
import { mediaUrl } from "@/lib/media/url";
import { MEDIA_ROLE_LABELS, type MediaRole } from "@/lib/projects/media";

import { DeleteDisclosure } from "../workspace/DeleteDisclosure";
import { MediaDetailsForm } from "./MediaDetailsForm";
import { MediaUploadForm } from "./MediaUploadForm";
import styles from "./Media.module.css";

/**
 * The project's case-study images: upload, then edit alt text, role and order,
 * or remove. The hero leads the public case study and is the /work card image;
 * gallery images follow it on the case study in order.
 */
export function MediaManager({ projectId, media }: { projectId: string; media: AdminProjectMedia[] }) {
  const hasHero = media.some((item) => item.role === "hero");

  return (
    <section className={styles.manager} aria-labelledby="media-title">
      <h2 id="media-title" className={styles.heading}>
        Images
      </h2>
      <p className={styles.intro}>
        The hero leads the case study and is the image on the work page. Gallery images follow it, lowest order
        first.
      </p>

      {media.length > 0 ? (
        <ul className={styles.list}>
          {media.map((item) => {
            const src = mediaUrl(item.storageKey);
            const role = item.role in MEDIA_ROLE_LABELS ? MEDIA_ROLE_LABELS[item.role as MediaRole] : item.role;
            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.preview}>
                  {src ? (
                    <Image src={src} alt="" fill sizes="10rem" className={styles.previewImage} />
                  ) : (
                    <span className={styles.missing}>No preview</span>
                  )}
                  <span className={styles.roleTag} data-role={item.role}>
                    {role}
                  </span>
                </div>
                <div className={styles.itemBody}>
                  <MediaDetailsForm
                    projectId={projectId}
                    mediaId={item.id}
                    alt={item.alt ?? ""}
                    role={item.role === "hero" ? "hero" : "gallery"}
                    displayOrder={item.displayOrder}
                  />
                  <DeleteDisclosure
                    action={removeProjectMedia}
                    fields={{ projectId, mediaId: item.id }}
                    summary="Remove image"
                    body="The image comes off the site and its file is deleted."
                    confirm="Remove image"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>No images yet. Without a hero, the case study and its card show text only.</p>
      )}

      <div className={styles.addPanel}>
        <h3 className={styles.addTitle}>Add an image</h3>
        <MediaUploadForm projectId={projectId} hasHero={hasHero} />
      </div>
    </section>
  );
}
