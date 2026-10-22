import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";

import { MediaImage } from "~/components/media-image";
import { VideoPlayer } from "~/components/video-player";
import { formatNumber } from "~/lib/locale-format";
import type { Evaluation } from "~/orpc/evaluation/contract";
import { m } from "~/paraglide/messages";

/*===== Evaluation Media =====*/
/**
 * The photos and videos sent with a request, behind a disclosure so a long history stays short. Open for the request
 * still waiting for an answer, which is what the owner came to check; closed for finished ones.
 *
 * Opening and closing are one motion: the panel stays mounted and its grid row grows from `0fr` to `1fr` while the
 * content lifts and fades in; closed, it is `inert`, so nothing inside can take focus. The chevron turns with it.
 */
export function EvaluationMedia({ evaluation }: { evaluation: Evaluation }) {
  const [open, setOpen] = useState(evaluation.status === "requested");
  const panelId = useId();
  const count = evaluation.photos.length + evaluation.videos.length;
  if (count === 0) return null;

  return (
    <div className="border-t border-dashed border-foreground/15 pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-lg py-1.5 text-start text-sm font-bold outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {m.account_dog_detail_media_toggle({ count: formatNumber(count) })}
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div inert={!open} className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "flex flex-col gap-3 pt-3 transition duration-300 ease-out motion-reduce:transition-none",
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
            )}
          >
            {/*------ Photos ------*/}
            {evaluation.photos.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {evaluation.photos.map((photo, index) => (
                  <li key={photo.id}>
                    <MediaImage
                      media={photo}
                      variant="thumb"
                      alt={m.account_dog_detail_media_photo_alt({
                        index: formatNumber(index + 1),
                        total: formatNumber(evaluation.photos.length),
                        dogName: evaluation.dog.name,
                      })}
                      className="aspect-4/3 w-full rounded-2xl border border-border"
                    />
                  </li>
                ))}
              </ul>
            )}

            {/*------ Videos ------*/}
            {evaluation.videos.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {evaluation.videos.map((video) => (
                  <li key={video.id}>
                    <VideoPlayer video={video} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
