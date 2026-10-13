import { cn } from "cn";

import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Dog Photo =====*/
/**
 * The dog's picture as one box: its photo filling the box, or, when it has none, the flat engraved tag centred on a
 * `sunken` surface. Used by Dog Detail, the Dashboard's dog cards and the form's live preview.
 *
 * The component fills whatever box `className` gives it (aspect ratio, width, radius); it only clips to it.
 */
export function DogPhoto({
  name,
  photo,
  microchipNumber,
  variant = "card",
  priority = false,
  className,
}: {
  name: string;
  photo: Media | null;
  /** Shown on the fallback tag only. */
  microchipNumber?: string | null;
  /** A `dog` media variant: `thumb`, `card` or `full`. */
  variant?: string;
  /** The photo is visible without scrolling (Dog Detail's header). */
  priority?: boolean;
  className?: string;
}) {
  if (photo) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <MediaImage
          media={photo}
          variant={variant}
          alt={`عکس ${name}`}
          priority={priority}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    // The tag is aria-hidden (it only repeats the name), so the wrapper says what the picture is.
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a real <img> can't hold the tag's markup.
      role="img"
      aria-label={`${name}، بدون عکس`}
      className={cn("flex items-center justify-center overflow-hidden bg-sunken", className)}
    >
      <DogTag name={name} microchipNumber={microchipNumber} size="lg" />
    </div>
  );
}
