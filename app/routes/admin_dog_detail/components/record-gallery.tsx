import { XIcon } from "lucide-react";
import { useState } from "react";

import { MediaImage } from "~/components/media-image";
import { Button } from "~/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { formatNumberFa } from "~/lib/digits";
import type { Media } from "~/orpc/media/contract";

/*===== Record Gallery =====*/
/**
 * Photos from the dog's file (its vaccination card, the vet's papers, its tattoo) as small prints in a row; each opens
 * full size in a lightbox, where a paper stays readable. View only: the photos are the owner's uploads, so the Admin
 * has nothing to add or remove here. `what` names the photos for screen readers («کارت واکسن»).
 *
 * Same idea as the Evaluations page's gallery, copied because a slice never imports another one.
 */
export function RecordGallery({ photos, what, dogName }: { photos: Media[]; what: string; dogName: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const opened = openIndex === null ? null : (photos[openIndex] ?? null);
  const position = (index: number) => `${formatNumberFa(index + 1)} از ${formatNumberFa(photos.length)}`;

  return (
    <>
      <ul className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`باز کردن ${what}، عکس ${position(index)}`}
              className="group block min-h-10 w-full overflow-hidden rounded-xl bg-card ring-1 ring-foreground/20 transition-shadow outline-none hover:ring-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <MediaImage
                media={photo}
                variant="thumb"
                alt=""
                className="aspect-4/3 w-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </button>
          </li>
        ))}
      </ul>

      {/*===== Lightbox =====*/}
      <Dialog open={opened !== null} onOpenChange={(next) => !next && setOpenIndex(null)}>
        <DialogContent showCloseButton={false} className="gap-0 rounded-3xl paper-grain p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">
            {what}، عکس {position(openIndex ?? 0)}، {dogName}
          </DialogTitle>
          <DialogDescription className="sr-only">عکسی که صاحب سگ فرستاده.</DialogDescription>
          {opened && (
            <MediaImage
              media={opened}
              variant="full"
              alt={`${what} ${dogName}`}
              className="max-h-[80dvh] w-full rounded-2xl object-contain"
            />
          )}
          <DialogClose
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="بستن"
                className="absolute end-4 top-4 border-foreground/20 bg-background/80"
              />
            }
          >
            <XIcon aria-hidden />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
