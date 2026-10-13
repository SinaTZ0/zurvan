import { VideoIcon } from "lucide-react";

import { MediaImage } from "~/components/media-image";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";

/*===== Constants =====*/
/** Thumbnails a row carries; the rest are counted in a «+N» chip. */
const MAX_THUMBS = 3;

/*===== Evaluation Media Strip =====*/
/**
 * The contact sheet part of a row: up to three photo thumbnails, a «+N» chip for the rest and a video chip, so the
 * Admin can skim the queue by faces before opening one. The thumbnails are decoration (the row's link names the dog),
 * and the strip is never a link of its own.
 */
export function EvaluationMediaStrip({
  photos,
  videos,
}: {
  photos: AdminEvaluation["photos"];
  videos: AdminEvaluation["videos"];
}) {
  if (photos.length === 0 && videos.length === 0) {
    return <p className="text-xs text-muted-foreground">عکس یا ویدیویی نفرستاده</p>;
  }

  const shown = photos.slice(0, MAX_THUMBS);
  const extra = photos.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((photo) => (
        <MediaImage
          key={photo.id}
          media={photo}
          variant="thumb"
          alt=""
          className="size-12 shrink-0 rounded-xl ring-1 ring-border"
        />
      ))}

      {extra > 0 && (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-xs font-bold text-muted-foreground tabular-nums">
          <span dir="ltr">+{formatNumberFa(extra)}</span>
        </span>
      )}

      {videos.length > 0 && (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold text-muted-foreground">
          <VideoIcon aria-hidden strokeWidth={1.7} className="size-3.5" />
          {formatNumberFa(videos.length)} ویدیو
        </span>
      )}
    </div>
  );
}
