import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { Assessment } from "~/orpc/assessment/contract";

/*===== Assessment Dog =====*/
/** The dog's photo, or its small engraved tag when it has none, at the size a ledger row and a slip share. */
export function AssessmentDogMark({ dog }: { dog: Assessment["dog"] }) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center">
      {dog.photo ? (
        <MediaImage media={dog.photo} variant="thumb" alt="" className="size-12 rounded-xl" />
      ) : (
        <DogTag name={dog.name} size="sm" className="scale-75" />
      )}
    </div>
  );
}
