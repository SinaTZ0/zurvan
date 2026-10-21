import { cn } from "cn";

import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Tape =====*/
// A strip of translucent tape with torn ends, across the print's top (Dog Detail's taped print, smaller).
const TAPE =
  "absolute -top-2 left-1/2 h-3.5 w-10 -translate-x-1/2 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)]";

const SIZES = {
  /** The picker's cards, the nothing-to-ask row. */
  sm: { print: "w-16 p-1", tag: "text-[8px]" },
  /** The receipt. */
  md: { print: "w-24 p-1.5", tag: "text-[11px]" },
} as const;

/*===== Taped Print =====*/
/**
 * A customer's dog as a small print taped to the plate a little crooked: its photo, or, without one, its engraved tag
 * (the initial only, at this size) on the dark ground. The customer's own dog, so no drawn dog ever stands on it.
 *
 * The print repeats the name said beside it, so it is hidden from assistive tech unless `alt` is given.
 */
export function TapedPrint({
  name,
  photo,
  size = "sm",
  tilt = "-rotate-3",
  dimmed = false,
  className,
}: {
  name: string;
  photo: Media | null;
  size?: keyof typeof SIZES;
  /** A rotate class; neighbouring prints alternate. */
  tilt?: string;
  /** A dog that can't ask now: the print steps back. */
  dimmed?: boolean;
  className?: string;
}) {
  const { print, tag } = SIZES[size];

  return (
    <span aria-hidden className={cn("relative block shrink-0", tilt, className)}>
      <span
        className={cn(
          "block rounded-[3px] bg-foreground shadow-[0_10px_22px_-10px_rgb(0_0_0/0.95)]",
          print,
          dimmed && "opacity-55 grayscale-[60%]",
        )}
      >
        <span className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[2px] bg-sunken">
          {photo ? (
            <MediaImage media={photo} variant="thumb" alt="" className="size-full" />
          ) : (
            <DogTag name={name} size="sm" className={tag} />
          )}
        </span>
      </span>
      <span className={TAPE} />
    </span>
  );
}
