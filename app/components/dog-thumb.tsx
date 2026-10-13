import { cn } from "cn";

import { MediaImage } from "~/components/media-image";
import type { Media } from "~/orpc/media/contract";

/*===== Dog Thumb =====*/
/**
 * A small round photo of the dog, or its first letter on a plain disc when the owner hasn't added one. 56px by default;
 * `className` can set another `size-*`. For lists of dogs (Course Detail's picker, the Cart, Purchases); the full
 * no-photo tag in `DogPhoto` is too tall for a row.
 */
export function DogThumb({ name, photo, className }: { name: string; photo: Media | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-card text-lg font-extrabold text-muted-foreground ring-1 ring-border",
        className,
      )}
    >
      {photo ? (
        <MediaImage media={photo} variant="thumb" alt={`عکس ${name}`} className="size-full" />
      ) : (
        <span aria-hidden>{[...name][0]}</span>
      )}
    </span>
  );
}
