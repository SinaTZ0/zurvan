import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import type { MascotCutName } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumber } from "~/lib/locale-format";
import { TRAIL_FILL } from "~/routes/assessment/components/chalk-defs";
import { EdgeDog } from "~/routes/assessment/components/edge-dog";

/*===== Plate =====*/
/** A grained plate on the paper, a step down from it, as every Batch 5 form section. */
export const PLATE =
  "rounded-4xl border border-border/60 bg-sunken paper-grain shadow-[0_24px_48px_-28px_rgb(0_0_0/0.9)]";

/*===== Form Plate =====*/
/**
 * One numbered part of the request: a grained plate with a gold numbered disc on its top start corner, its heading and
 * one plain line saying what the part is for, then its fields in one column.
 *
 * The discs are joined by a dashed chalk line down the start side: each plate but the last draws the segment from its
 * disc's centre to the next disc's (its own height plus the gap, `--plate-gap`, set by the list). The plates paint over
 * it, so it shows only between them. It turns gold once the part above it is done.
 *
 * Phones only: a plate can have the center's dog on its top edge at the end side, with a dimmed piece of scenery behind
 * him (the sticky guide isn't on screen there). He speaks (`speech`, keyed, so it pops) while the person is in his
 * plate; otherwise he stays quiet. `onEnter` tells the form that focus came into the plate.
 */
export function FormPlate({
  number,
  titleId,
  title,
  description,
  done,
  last = false,
  dog,
  speech,
  onEnter,
  children,
}: {
  number: number;
  titleId: string;
  title: React.ReactNode;
  description: React.ReactNode;
  /** The part is filled in: the line to the next disc turns gold. */
  done: boolean;
  last?: boolean;
  dog?: { name: MascotCutName; width: string; scenery: { name: MascotCutName; width: string } };
  /** The dog's line while he speaks; null while he is quiet. */
  speech?: string | null;
  onEnter: () => void;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={titleId} className="relative">
      {/*------ Line to the Next Disc ------*/}
      {/* Both stacked, the gold one fading in over the ink, so the change is a cross-fade, not a snap. An svg keeps its
          own 150px height whatever its insets, so the height is set. */}
      {!last &&
        ([false, true] as const).map((gold) => (
          <svg
            key={String(gold)}
            aria-hidden
            className={cn(
              "absolute start-[calc(2.5rem-8px)] top-0 h-[calc(100%+var(--plate-gap))] w-4 motion-safe:transition-opacity motion-safe:duration-500",
              gold ? TRAIL_FILL.walkedDown : TRAIL_FILL.aheadDown,
              gold && !done && "opacity-0",
            )}
          >
            <rect width="100%" height="100%" filter="url(#as-chalk)" />
          </svg>
        ))}

      {/*------ The Dog on the Edge (phones) ------*/}
      {dog && (
        <div aria-hidden className="pointer-events-none absolute end-[4.25rem] bottom-[calc(100%-3px)] ltr:end-auto ltr:left-[4.25rem] z-10 lg:hidden">
          <EdgeDog name={dog.name} scenery={dog.scenery} className={dog.width}>
            {speech && (
              // Physical: to his right, beside his head, the tail aimed down at it. In English the dog stands at the physical
              // left, as in Persian, so the bubble has room (the plate's number disc is at the start side there).
              <ChalkBubble
                key={speech}
                tail="left"
                className="answer-pop absolute bottom-[58%] left-[88%] w-max max-w-[min(13rem,calc(100vw-12rem))] text-pretty [--pop-origin:1.75rem_100%]"
              >
                {speech}
              </ChalkBubble>
            )}
          </EdgeDog>
        </div>
      )}

      {/*------ Plate ------*/}
      {/* Focus moving in makes this plate's dog speak; the listener is on an inner div, not the section (a11y lint). */}
      <div onFocus={onEnter} className={cn(PLATE, "relative p-5 pt-9 sm:p-8 sm:pt-10")}>
        <span
          aria-hidden
          className="absolute start-5 -top-5 grid size-10 place-items-center rounded-full bg-primary font-display text-lg font-black text-primary-foreground shadow-[0_0_0_6px_var(--background)]"
        >
          {formatNumber(number)}
        </span>

        <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-h3 text-balance")}>
          {title}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-pretty text-muted-foreground">{description}</p>

        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
