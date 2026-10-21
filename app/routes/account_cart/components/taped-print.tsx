import { cn } from "cn";

import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Tape =====*/
// A strip of translucent tape with torn ends across the print's top (Dog Detail's taped print).
const TAPE =
  "absolute -top-2.5 left-1/2 h-4 w-14 -translate-x-1/2 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] lg:w-16";

/*===== Taped Print =====*/
/**
 * A customer's dog as a print taped to its bag a little crooked: its photo on an ivory mount, or, without one, its
 * engraved tag on the dark ground. 6rem wide on phones, 10rem from `lg`. It drops in and settles (`ct-drop`) as its bag
 * arrives. The customer's own dog, so no drawn dog ever stands on it.
 *
 * The print repeats the name written beside it, so it is hidden from assistive tech.
 */
export function TapedPrint({
  name,
  photo,
  tilt = "-rotate-2",
  delay = "0.05s",
  className,
}: {
  name: string;
  photo: Media | null;
  /** A rotate class; neighbouring bags alternate. */
  tilt?: string;
  /** When the drop starts: after its bag has risen in. */
  delay?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("ct-drop relative block w-24 shrink-0 lg:w-40", className)}
      style={{ "--ct-delay": delay } as React.CSSProperties}
    >
      <span
        className={cn(
          "block rounded-[3px] bg-foreground p-1.5 shadow-[0_14px_28px_-12px_rgb(0_0_0/0.95)] lg:p-2",
          tilt,
        )}
      >
        <span className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[2px] bg-sunken">
          {photo ? (
            <MediaImage media={photo} variant="card" alt="" className="size-full object-cover" />
          ) : (
            <DogTag name={name} size="portrait" className="text-[11px] lg:text-[18px]" />
          )}
        </span>
      </span>
      <span className={cn(TAPE, tilt)} />
    </span>
  );
}
