import { cn } from "cn";
import { VideoIcon } from "lucide-react";

import { MediaImage } from "~/components/media-image";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";

/*===== Constants =====*/
/** Prints a row carries; the rest are counted in a «+N» disc. */
const MAX_PRINTS = 3;

/**
 * Each print sits a little off square, like prints laid on a desk, and the earlier one lies on top of the next. The
 * tilts are fixed per place (not random), so the strip looks the same on every render and on the server.
 */
const PRINT_PLACES = ["z-30 -rotate-2", "z-20 rotate-2", "z-10 -rotate-1"] as const;

/*===== Print Strip =====*/
/**
 * The contact sheet part of a row: up to three of the customer's photos as small prints, overlapping, each with an ink
 * ring and a hair of the plate's paper round it (so the overlap reads as one print on another), a «+N» disc for the
 * rest and a video chip. The Admin skims the queue by faces before opening one.
 *
 * The prints are decoration (the row's link names the dog): what the strip holds is said once in hidden text, and the
 * strip is never a link of its own.
 */
export function PrintStrip({
  photos,
  videos,
  className,
}: {
  photos: AdminEvaluation["photos"];
  videos: AdminEvaluation["videos"];
  className?: string;
}) {
  if (photos.length === 0 && videos.length === 0) {
    return <p className={cn("text-xs text-muted-foreground", className)}>عکسی نفرستاده</p>;
  }

  const shown = photos.slice(0, MAX_PRINTS);
  const extra = photos.length - shown.length;
  const said = [
    photos.length > 0 && `${formatNumberFa(photos.length)} عکس`,
    videos.length > 0 && `${formatNumberFa(videos.length)} ویدیو`,
  ]
    .filter(Boolean)
    .join(" و ");

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="sr-only">{said}</span>

      {/*------ Prints ------*/}
      {shown.length > 0 && (
        <span aria-hidden className="flex items-center">
          {shown.map((photo, index) => (
            <MediaImage
              key={photo.id}
              media={photo}
              variant="thumb"
              alt=""
              className={cn(
                "relative size-11 shrink-0 rounded-xl bg-card object-cover shadow-[0_0_0_3px_var(--color-sunken)] ring-1 ring-foreground/20",
                index > 0 && "-ms-3",
                PRINT_PLACES[index],
              )}
            />
          ))}
          {extra > 0 && (
            <span className="relative ms-1.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground/80 tabular-nums shadow-[0_0_0_3px_var(--color-sunken)]">
              <span dir="ltr">+{formatNumberFa(extra)}</span>
            </span>
          )}
        </span>
      )}

      {/*------ Videos ------*/}
      {videos.length > 0 && (
        <span
          aria-hidden
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 text-xs font-bold whitespace-nowrap text-muted-foreground"
        >
          <VideoIcon strokeWidth={1.7} className="size-3.5" />
          {/* Beside prints only the number fits the row's track; alone, the chip says what it counts. */}
          {formatNumberFa(videos.length)}
          {shown.length === 0 && " ویدیو"}
        </span>
      )}
    </div>
  );
}
