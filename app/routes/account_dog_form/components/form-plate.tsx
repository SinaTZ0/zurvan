import { cn } from "cn";
import { useId, useState } from "react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut, type MascotCutName } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { DogFormSection } from "~/routes/account_dog_form/sections";

/*===== Guide =====*/
/** The center's dog who looks after a plate, and the dimmed piece of scenery that means something beside him. */
export type PlateGuide = {
  dog: MascotCutName;
  /** His width per breakpoint (keep it under about 1.3x the cut-out's natural width). */
  dogClassName: string;
  /** His idle loop (`lively-*`). */
  idle: string;
  scenery: MascotCutName;
  /** The scenery's width per breakpoint; it tucks under the dog's back by its negative start margin. */
  sceneryClassName: string;
};

/*===== Form Plate =====*/
/**
 * One part of the dog form: a head row (the heading and the one-line reason at the start, the plate's dog standing on
 * its top edge at the end corner with his scenery behind him), then the grained plate with the fields in one column.
 *
 * The heading never runs under the dog: he sits in the row's flow, so the words only get the room he leaves. His bubble
 * has its own slot above the heading, beside his head, so it never covers a word or a field; it overflows upwards into
 * the gap above the plate when its line runs to two or three lines.
 *
 * **Only the plate the person is in speaks.** `speaking` turns the bubble on: it pops from its tail each time this
 * plate starts speaking (`speakerKey` changes), and fades out, still saying its last line, when another plate takes
 * over. The bubble is `aria-hidden`: the description under the heading says the same thing in plain words.
 *
 * Focus anywhere inside the plate reports the section (React's `onFocus` bubbles), so the form can hand it the word.
 */
export function FormPlate({
  id,
  title,
  description,
  guide,
  line,
  speaking,
  speakerKey,
  firstLoad,
  onFocusSection,
  children,
}: {
  id: DogFormSection;
  title: string;
  description: string;
  guide: PlateGuide;
  /** What the dog says while the plate speaks (his plate's line, or the error line after a failed submit). */
  line: string;
  speaking: boolean;
  /** Changes every time a plate starts speaking; this plate re-pops only on the ones it speaks. */
  speakerKey: number;
  /** The page's load moment: the first bubble pops a beat after the print has dropped. */
  firstLoad: boolean;
  onFocusSection: (id: DogFormSection) => void;
  children: React.ReactNode;
}) {
  const headingId = useId();

  /*------ What the Bubble Shows ------*/
  // Adjusted during render (not in an effect), so the pop and the words arrive in the same frame. While the plate is
  // quiet both stay as they were, so the fading bubble keeps its last words instead of flicking to new ones.
  const [shown, setShown] = useState({ line, key: speakerKey });
  if (speaking && (shown.line !== line || shown.key !== speakerKey)) setShown({ line, key: speakerKey });

  return (
    <section aria-labelledby={headingId} className="min-w-0 scroll-mt-28">
      {/*===== Head =====*/}
      <div className="flex items-end gap-2 sm:gap-5">
        <div className="min-w-0 flex-1 pb-4">
          {/*------ Bubble Slot ------*/}
          {/* At the row's end, by the dog's head; the tail is physical (bottom left), aimed down at him. */}
          <div aria-hidden className="relative h-12 sm:h-14">
            <div
              className={cn(
                "df-fade pointer-events-none absolute end-0 bottom-2 max-w-full",
                speaking ? "opacity-100" : "opacity-0",
              )}
            >
              <ChalkBubble
                key={shown.key}
                tail="left"
                className={cn(
                  "answer-pop max-w-full text-pretty [--pop-origin:1.75rem_100%] sm:max-w-[22rem]",
                  firstLoad && "[--answer-delay:0.4s]",
                )}
              >
                {shown.line}
              </ChalkBubble>
            </div>
          </div>

          <h2 id={headingId} className={cn(DISPLAY_HEADING, "text-2xl text-balance sm:text-3xl")}>
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-pretty text-muted-foreground sm:text-base">{description}</p>
        </div>

        <GuideFigure guide={guide} />
      </div>

      {/*===== Plate =====*/}
      {/* The listener sits on the fields' plate, not the `section`: that is where focus can land, and a landmark-like
          element with a handler trips the a11y lint. Focus events bubble up to it from every field. */}
      <div
        className="flex flex-col gap-7 rounded-4xl border border-border/60 bg-sunken paper-grain p-5 shadow-[0_24px_48px_-28px_rgb(0_0_0/0.9)] sm:p-8"
        onFocus={() => onFocusSection(id)}
      >
        {children}
      </div>
    </section>
  );
}

/*===== Guide Figure =====*/
/**
 * The dog on the plate's top edge and his scenery tucked behind his back (towards the plate's end corner), a pool of
 * warm light, a bush in front of his paws and a small one behind the scenery. Sunk a few pixels so the cut-outs' soft
 * feet disappear into the edge; the dog rises from behind it as the plate scrolls in (`df-rise`). Physical sides for
 * the bushes: every dog faces right, the start side in RTL.
 */
function GuideFigure({ guide }: { guide: PlateGuide }) {
  return (
    <div aria-hidden className="pointer-events-none relative z-10 me-1 flex shrink-0 items-end sm:me-5">
      {/* A pool of warm light where he stands. */}
      <div className="absolute -inset-x-1/3 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_55%_at_55%_70%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ The Dog ------*/}
      <div className={cn("relative z-10 translate-y-[3%]", guide.dogClassName)}>
        <div className="df-rise relative">
          <MascotCut name={guide.dog} className={cn(guide.idle, "block w-full")} />
        </div>
        <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[80%] w-[30%]" />
      </div>

      {/*------ Scenery ------*/}
      <div className={cn("relative translate-y-[4%]", guide.sceneryClassName)}>
        <MascotCut name={guide.scenery} className="block w-full" />
        <MascotCut name="plants" className="lively-sway-2 absolute right-[78%] bottom-0 w-[34%] -scale-x-100" />
      </div>
    </div>
  );
}
