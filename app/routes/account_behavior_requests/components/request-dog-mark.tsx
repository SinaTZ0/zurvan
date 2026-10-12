import { DogTag } from "~/components/dog-tag";
import { MediaImage } from "~/components/media-image";
import type { CustomerBehaviorRequest } from "~/orpc/behavior-request/contract";

/*===== Request Dog Mark =====*/
/** The dog's photo, or its small engraved tag when it has none, at the size a card and a ledger row share. */
export function RequestDogMark({ dog }: { dog: CustomerBehaviorRequest["dog"] }) {
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
