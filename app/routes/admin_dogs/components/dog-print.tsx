import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Dog Print =====*/
/**
 * The face at the start of a register row: the owner's photo as a small print (`rounded-xl` with an ink ring), so he
 * runs down the edge reading faces. A dog without a photo keeps the same square, drawn as a dashed ink frame with the
 * name's first letter: the place where a print will go, the same dashed line the empty Admin lists use. The same shape
 * either way, so the edge stays straight.
 */
export function DogPrint({ name, photo }: { name: string; photo: Media | null }) {
  if (photo) {
    return (
      <span className="block size-12 shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/15">
        <MediaImage media={photo} variant="thumb" alt={`عکس ${name}`} className="size-full object-cover" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-12 shrink-0 place-items-center rounded-xl border border-dashed border-foreground/25 font-display text-lg font-extrabold text-muted-foreground"
    >
      {[...name][0]}
    </span>
  );
}
