import { ChevronDownIcon } from "lucide-react";

import { MediaImage } from "~/components/media-image";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { VideoPlayer } from "~/components/video-player";
import { formatNumberFa } from "~/lib/digits";
import type { Evaluation } from "~/orpc/evaluation/contract";

/*===== Evaluation Media =====*/
/**
 * The photos and videos sent with a request, behind a disclosure so a long history stays short. Open for the request
 * still waiting for an answer, which is what the owner came to check; closed for finished ones.
 */
export function EvaluationMedia({ evaluation }: { evaluation: Evaluation }) {
  const count = evaluation.photos.length + evaluation.videos.length;
  if (count === 0) return null;

  return (
    <Collapsible defaultOpen={evaluation.status === "requested"} className="border-t border-border pt-3">
      <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 rounded-lg py-1.5 text-start text-sm font-bold outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50">
        عکس و فیلم‌های فرستاده‌شده ({formatNumberFa(count)})
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground group-aria-expanded/trigger:rotate-180 motion-safe:transition-transform"
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col gap-3 pt-3">
          {/*------ Photos ------*/}
          {evaluation.photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {evaluation.photos.map((photo, index) => (
                <li key={photo.id}>
                  <MediaImage
                    media={photo}
                    variant="thumb"
                    alt={`عکس ${formatNumberFa(index + 1)} از ${formatNumberFa(evaluation.photos.length)} برای ارزیابی ${evaluation.dog.name}`}
                    className="aspect-4/3 w-full rounded-2xl border border-border"
                  />
                </li>
              ))}
            </ul>
          )}

          {/*------ Videos ------*/}
          {evaluation.videos.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {evaluation.videos.map((video) => (
                <li key={video.id}>
                  <VideoPlayer video={video} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
