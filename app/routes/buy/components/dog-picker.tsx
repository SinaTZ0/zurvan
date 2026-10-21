import { cn } from "cn";
import { PlusIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { DogTag } from "~/components/dog-tag";
import { Link } from "~/components/link";
import { MediaImage } from "~/components/media-image";
import { describeDog } from "~/lib/dog-format";
import type { Dog } from "~/orpc/dog/contract";

/*===== Paths =====*/
/** The way to add a dog and come straight back here (`redirectTo`). */
export const NEW_DOG_PATH = `/account/dogs/new?redirectTo=${encodeURIComponent("/buy")}`;

/*===== Tape =====*/
// A strip of translucent tape with torn ends across the print's top (the Dashboard's print); gold on the picked one.
const TAPE =
  "absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 transition-colors duration-500 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] lg:w-14";

/** How a print moves between its three looks: a soft spring, so the picked one lands rather than snaps. */
const MOVE =
  "transition-[rotate,scale,translate,opacity] duration-500 ease-[cubic-bezier(.3,1.35,.5,1)] motion-reduce:transition-none";

/*===== Dog Picker =====*/
/**
 * «سگ‌های من»: the customer's dogs lined up as taped prints, each a link to `/buy?dog=<id>`, so the choice is in the
 * address (Back and a shared link both work) and the server fetches that dog's verdicts. The scroll stays where it is
 * (`preventScrollReset`). The last print is a dashed blank, «سگ دیگه», to add a dog and come back.
 *
 * Before a pick the prints hang a little crooked. Picked, one straightens, lifts and gets the gold tape and ring
 * (`aria-current`); the others step back and tilt away. `pickedId` is the dog being opened (the pending navigation's,
 * so the print answers the press at once), `bubble` the loaded dog's line, said from its print's corner.
 *
 * On phones the row scrolls sideways with snap points once it is wider than the screen. The bubble lives inside the
 * row (above it, in the scroller's top padding), placed from the row's start by the picked print's index, so it scrolls
 * with the prints and is never clipped by the scroller. It is decoration (`aria-hidden`): the plates below say the same
 * in plain words.
 */
export function DogPicker({
  dogs,
  pickedId,
  bubble,
}: {
  dogs: readonly Dog[];
  pickedId: string | null;
  bubble: { dogId: string; line: string; changed: boolean } | null;
}) {
  const bubbleIndex = bubble ? dogs.findIndex((dog) => dog.id === bubble.dogId) : -1;

  return (
    <nav aria-label="سگ‌های من" className="mt-6 lg:mt-8">
      <div className="-mx-4 snap-x snap-mandatory [scrollbar-width:thin] overflow-x-auto overscroll-x-contain px-5 pt-16 pb-3 lg:mx-0 lg:px-0">
        <ul className="relative flex w-max gap-4 [--step:7rem] lg:gap-6 lg:[--step:9.5rem]">
          {dogs.map((dog, index) => (
            <li key={dog.id} className="w-24 shrink-0 snap-start lg:w-32">
              <PrintLink dog={dog} index={index} pickedId={pickedId} />
            </li>
          ))}

          {/*------ Another Dog ------*/}
          <li className="w-24 shrink-0 snap-start lg:w-32">
            <Link
              to={NEW_DOG_PATH}
              className="group/add block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "grid aspect-[4/5] place-items-center rounded-[3px] border-2 border-dashed border-foreground/30 text-muted-foreground group-hover/add:border-primary/60 group-hover/add:text-primary motion-safe:transition-colors",
                  pickedId ? "rotate-[4deg] opacity-80" : "rotate-2",
                  MOVE,
                )}
              >
                <PlusIcon aria-hidden className="size-7" strokeWidth={1.8} />
              </span>
              <span className="mt-3 block text-sm font-bold text-muted-foreground group-hover/add:text-foreground">
                سگ دیگه
              </span>
            </Link>
          </li>

          {/*------ The Picked Dog Answers ------*/}
          {/* Physical: the row starts at the right in RTL, so print n starts n steps in from the right; the tail
              (1.75rem in from the bubble's right edge) lands over the print. It pops from the tail when a dog is
              picked, and after the hero's bubble on load. */}
          {bubble && bubbleIndex >= 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute right-[calc(var(--i)*var(--step))] bottom-full mb-3 flex w-[calc(100%-var(--i)*var(--step))] justify-start"
              // A custom property per index: the placement is one class for every print.
              style={{ "--i": bubbleIndex } as React.CSSProperties}
            >
              <ChalkBubble
                key={`${bubble.dogId}-${bubble.line}`}
                tail="right"
                className={cn(
                  "max-w-[min(16rem,100%)] text-pretty [--pop-origin:calc(100%-1.75rem)_100%]",
                  bubble.changed ? "answer-pop" : "by-print-pop",
                )}
              >
                {bubble.line}
              </ChalkBubble>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
}

/*===== Print Link =====*/
/** One dog: its print (photo or engraved tag), its name and its facts, as one link. */
function PrintLink({ dog, index, pickedId }: { dog: Dog; index: number; pickedId: string | null }) {
  const picked = dog.id === pickedId;
  const tilt = index % 2 ? "rotate-2" : "-rotate-2";
  const away = index % 2 ? "rotate-[5deg]" : "-rotate-[5deg]";

  return (
    <Link
      to={`/buy?dog=${encodeURIComponent(dog.id)}`}
      aria-current={picked ? "true" : undefined}
      preventScrollReset
      className="group/print block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/*------ Print ------*/}
      <span
        aria-hidden
        className={cn(
          "relative block",
          MOVE,
          !pickedId && `${tilt} group-hover/print:-translate-y-1`,
          picked && "-translate-y-1.5 scale-105 rotate-0",
          pickedId && !picked && `${away} scale-95 opacity-60 group-hover/print:opacity-90`,
        )}
      >
        <span
          className={cn(
            "block rounded-[3px] bg-foreground p-1.5 shadow-[0_14px_28px_-12px_rgb(0_0_0/0.95)] ring-offset-4 ring-offset-background transition-shadow duration-500 lg:p-2",
            picked && "ring-2 ring-primary",
          )}
        >
          <span className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[2px] bg-sunken">
            {dog.photo ? (
              <MediaImage media={dog.photo} variant="card" alt="" className="size-full object-cover" />
            ) : (
              <DogTag name={dog.name} size="sm" className="text-[11px] lg:text-[13px]" />
            )}
          </span>
        </span>
        <span className={cn(TAPE, picked ? "bg-primary/85" : "bg-foreground/25")} />
      </span>

      {/*------ Name and Facts ------*/}
      <span
        className={cn(
          "mt-3 block truncate font-display text-lg leading-tight font-extrabold motion-safe:transition-colors",
          picked ? "text-primary" : "text-foreground",
        )}
      >
        <bdi>{dog.name}</bdi>
      </span>
      <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted-foreground">{describeDog(dog)}</span>
    </Link>
  );
}
