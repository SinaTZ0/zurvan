import { cn } from "cn";

import { formatFileSize } from "~/lib/file-format";
import type { BehaviorVideo } from "~/orpc/behavior-request/contract";

/*===== Video Player =====*/
/**
 * One behavior video in a `sunken` frame with its name and size under it. The bytes come from the app's own private
 * route (`video.url`), which checks the viewer. `preload="metadata"` fetches only the first frame, so a list of three
 * 100 MB clips costs almost nothing until someone presses play.
 *
 * A download link sits under the player because browsers can't play every phone format (an iPhone's HEVC clip in
 * Chrome shows a black frame); the trainer can still open it elsewhere.
 */
export function VideoPlayer({ video, className }: { video: BehaviorVideo; className?: string }) {
  return (
    <figure
      className={cn("overflow-hidden rounded-2xl bg-sunken shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)]", className)}
    >
      {/* The player is LTR: its controls and timeline don't mirror, whatever the page direction. */}
      <video
        controls
        preload="metadata"
        playsInline
        src={video.url}
        dir="ltr"
        className="aspect-video w-full bg-black object-contain"
      >
        <track kind="captions" />
      </video>
      <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="min-w-0 truncate font-medium" dir="auto" title={video.fileName}>
          {video.fileName}
        </span>
        <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
          <span>{formatFileSize(video.sizeBytes)}</span>
          <a href={video.url} download={video.fileName} className="font-medium text-primary hover:underline">
            دانلود
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
