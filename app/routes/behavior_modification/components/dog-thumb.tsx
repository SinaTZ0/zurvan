import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Thumb =====*/
/** A dog's mark in a 56 px box: its photo, or its engraved tag when it has none. */
export function DogThumb({ dog }: { dog: Pick<Dog, "name" | "photo"> }) {
  return (
    <span className="flex size-14 shrink-0 items-center justify-center">
      {dog.photo ? (
        <MediaImage media={dog.photo} variant="thumb" alt="" className="size-14 rounded-2xl" />
      ) : (
        <DogTag name={dog.name} size="sm" />
      )}
    </span>
  );
}
