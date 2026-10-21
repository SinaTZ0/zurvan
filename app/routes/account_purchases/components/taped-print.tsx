import { cn } from "cn";

import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Tape =====*/
// A strip of translucent tape with torn ends across the print's top (the Evaluation Request's taped print).
const TAPE =
  "absolute -top-1.5 left-1/2 h-3 w-9 -translate-x-1/2 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)]";

/*===== Taped Print =====*/
/**
 * A customer's dog as a small print taped to the slip a little crooked: its photo, or, without one, its engraved tag
 * (the initial only, at this size) on the dark ground. The customer's own dog, so no drawn dog ever stands on it.
 *
 * The print repeats the dog's name, said beside it as a link, so it is hidden from assistive tech.
 */
export function TapedPrint({
  name,
  photo,
  tilt = "-rotate-3",
  className,
}: {
  name: string;
  photo: Media | null;
  /** A rotate class; neighbouring prints alternate. */
  tilt?: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("relative block w-14 shrink-0 sm:w-16", tilt, className)}>
      <span className="block rounded-[3px] bg-foreground p-1 shadow-[0_10px_22px_-10px_rgb(0_0_0/0.95)]">
        <span className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[2px] bg-sunken">
          {photo ? (
            <MediaImage media={photo} variant="thumb" alt="" className="size-full object-cover" />
          ) : (
            <DogTag name={name} size="sm" className="text-[7px]" />
          )}
        </span>
      </span>
      <span className={TAPE} />
    </span>
  );
}
