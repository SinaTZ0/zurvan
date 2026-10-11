import { cn } from "cn";

import { DogTag, type DogTagFinish } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Dog Portrait =====*/
/**
 * The dog as its own page shows it: the photo with the dog's tag hanging from its bottom-start corner, tilted like a
 * real tag on a ring. Without a photo, the tag stands alone, larger. Used by Dog Detail and the form's live preview,
 * so the form shows exactly what the dog's page will look like.
 */
export function DogPortrait({
  name,
  microchipNumber,
  photo,
  finish = "engraved",
  stampKey,
  priority = false,
  className,
}: {
  name: string;
  microchipNumber: string | null;
  photo: Media | null;
  finish?: DogTagFinish;
  stampKey?: string;
  /** The photo is the first thing on screen (Dog Detail). */
  priority?: boolean;
  className?: string;
}) {
  if (!photo) {
    return (
      <div className={cn("flex justify-center", className)}>
        <DogTag name={name} microchipNumber={microchipNumber} size="lg" finish={finish} stampKey={stampKey} />
      </div>
    );
  }

  return (
    // The tag hangs below the photo, so the bottom padding keeps it inside the portrait's own box.
    <div className={cn("relative pb-24 lg:pb-28", className)}>
      <div className="relative overflow-hidden rounded-3xl shadow-sm">
        <MediaImage
          media={photo}
          variant="card"
          alt={`عکس ${name}`}
          priority={priority}
          className="aspect-4/3 w-full"
        />
      </div>
      <DogTag
        name={name}
        microchipNumber={microchipNumber}
        finish={finish}
        stampKey={stampKey}
        hanging
        size="portrait"
        className="absolute start-6 top-[calc(100%-8.5rem)] origin-top rotate-6 shadow-lg lg:start-8 lg:top-[calc(100%-10rem)] lg:text-[20px]"
      />
    </div>
  );
}
