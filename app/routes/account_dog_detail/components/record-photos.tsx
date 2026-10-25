import { MediaImage } from "~/components/media-image";
import { formatNumber } from "~/lib/locale-format";
import type { Dog } from "~/orpc/dog/contract";
import type { Media } from "~/orpc/media/contract";
import { m } from "~/paraglide/messages";

/*===== Record Photos =====*/
/**
 * The photos the owner kept in the dog's file (F2): the vaccination card, the vet's papers and the tattoo, each a small
 * gallery under its own heading. A thumbnail opens the full image in a new tab, where a page of paper can be zoomed
 * and read. A gallery with no photos is left out, and a dog with none shows nothing at all.
 */
export function RecordPhotos({ dog }: { dog: Dog }) {
  const galleries = [
    { title: m.account_dog_detail_records_vaccination(), photos: dog.vaccinationPhotos },
    { title: m.account_dog_detail_records_medical(), photos: dog.medicalPhotos },
    { title: m.account_dog_detail_records_tattoo(), photos: dog.tattooPhoto ? [dog.tattooPhoto] : [] },
  ].filter((gallery) => gallery.photos.length > 0);
  if (galleries.length === 0) return null;

  return (
    <div className="flex flex-col divide-y divide-dashed divide-foreground/15 border-t border-foreground/15">
      {galleries.map((gallery) => (
        <Gallery key={gallery.title} dogName={dog.name} title={gallery.title} photos={gallery.photos} />
      ))}
    </div>
  );
}

/*===== Gallery =====*/
function Gallery({ dogName, title, photos }: { dogName: string; title: string; photos: readonly Media[] }) {
  return (
    <section className="flex flex-col gap-2.5 py-3">
      <h3 className="text-sm font-normal text-muted-foreground">{title}</h3>
      <ul className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            {/* The full size is a plain link: it opens in the browser's own viewer, which zooms and saves. */}
            <a
              href={photo.urls.full}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <MediaImage
                media={photo}
                variant="thumb"
                alt={m.account_dog_detail_records_photo_alt({
                  title,
                  dogName,
                  index: formatNumber(index + 1),
                  total: formatNumber(photos.length),
                })}
                className="aspect-4/3 w-full transition duration-300 ease-out group-hover:scale-105 group-hover:brightness-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
