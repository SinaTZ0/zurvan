import { XIcon } from "lucide-react";
import { useState } from "react";

import { MediaImage } from "~/components/media-image";
import { Button } from "~/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";

/*===== Photo Gallery =====*/
/**
 * The owner's photos as a grid of thumbnails; each opens the full-size picture in a lightbox, so the Admin can look at
 * the dog's coat, ears and stance while on the phone. One picture at a time is enough: no arrows.
 */
export function PhotoGallery({ photos, dogName }: { photos: AdminEvaluation["photos"]; dogName: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const opened = openIndex === null ? null : (photos[openIndex] ?? null);

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`باز کردن عکس ${formatNumberFa(index + 1)} از ${formatNumberFa(photos.length)}`}
              className="block w-full overflow-hidden rounded-xl ring-1 ring-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <MediaImage media={photo} variant="thumb" alt="" className="aspect-4/3 w-full" />
            </button>
          </li>
        ))}
      </ul>

      {/*===== Lightbox =====*/}
      <Dialog open={opened !== null} onOpenChange={(next) => !next && setOpenIndex(null)}>
        <DialogContent showCloseButton={false} className="gap-0 p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">
            عکس {formatNumberFa((openIndex ?? 0) + 1)} از {formatNumberFa(photos.length)} · {dogName}
          </DialogTitle>
          <DialogDescription className="sr-only">عکسی که صاحب سگ فرستاده است.</DialogDescription>
          {opened && (
            <MediaImage
              media={opened}
              variant="full"
              alt={`عکس ${dogName}`}
              className="max-h-[80dvh] w-full rounded-lg object-contain"
            />
          )}
          <DialogClose
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="بستن"
                className="absolute end-3 top-3 border-border bg-background/80"
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
