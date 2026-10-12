import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Request Mark =====*/
/** The dog's photo, or its small engraved tag when it has none, at the size a row shares. */
export function RequestMark({ name, photo }: { name: string; photo: Media | null }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center">
      {photo ? (
        <MediaImage media={photo} variant="thumb" alt="" className="size-12 rounded-xl" />
      ) : (
        <DogTag name={name} size="sm" className="scale-75" />
      )}
    </span>
  );
}
