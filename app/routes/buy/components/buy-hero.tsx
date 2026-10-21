import { cn } from "cn";
import { ShoppingBagIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { Dog } from "~/orpc/dog/contract";
import { DogPicker } from "~/routes/buy/components/dog-picker";
import { COLUMN, STRIP_FADE } from "~/routes/buy/plate";

/*===== Buy Hero =====*/
/**
 * The top of «خرید دوره»: the center's stall. At the start, the words (a chip, the h1 that names the picked dog, one
 * line) and the customer's dogs lined up as prints (`DogPicker`); at the end, the dimmed market stall with the
 * price-tag dog standing in front of its counter, a bush either side, warm light under the awning and his bubble.
 * The whole hero stands on a path (a full-width ground strip under it, faded at both ends); on phones the stall is a
 * band on top with its own short path, then the words and the prints.
 *
 * The h1 and the stall dog's bubble are keyed by what they say, so picking a dog re-pops the bubble and lifts the new
 * h1 in (`changed`); on load the dog rises out of the path and his bubble pops at 0.4s (page-motion.tsx).
 */
export function BuyHero({
  dogs,
  pickedId,
  dogName,
  pickBubble,
  changed,
}: {
  dogs: readonly Dog[];
  /** The dog being shown or opened (the pending navigation's, so the print answers at once). */
  pickedId: string | null;
  /** The loaded picked dog's name, or null before a pick. */
  dogName: string | null;
  pickBubble: { dogId: string; line: string; changed: boolean } | null;
  /** A dog was picked since the page opened. */
  changed: boolean;
}) {
  const title = dogName ? (
    <>
      دوره‌ها برای <bdi className="text-primary">{dogName}</bdi>
    </>
  ) : (
    "برای کدوم سگ؟"
  );
  const stallLine =
    dogs.length === 0
      ? "اول رفیقتو بیار!"
      : dogName
        ? `${dogName}؟ بریم ببینیم چی بهش می‌خوره!`
        : "برای کی دوره می‌خوای؟";

  return (
    <section aria-labelledby="buy-title" className="relative pt-4 lg:pt-section-sm">
      <div className={cn(COLUMN, "relative z-10 grid gap-y-4 lg:grid-cols-12 lg:gap-x-12")}>
        {/*===== Words and the Line-up =====*/}
        <div
          className={cn(
            "order-2 min-w-0 pb-6 lg:order-1 lg:col-span-7 lg:flex lg:flex-col lg:pb-10",
            // Without dogs there is no line-up to stand on the path: the words sit in the middle of the stage.
            dogs.length === 0 ? "lg:justify-center" : "lg:justify-end",
          )}
        >
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
            <ShoppingBagIcon aria-hidden strokeWidth={2} className="size-4" />
            خرید دوره
          </p>
          <h1
            key={dogName ?? "none"}
            id="buy-title"
            className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance", changed && "answer-in")}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-lg text-lead text-pretty text-muted-foreground">
            برای هر دوره همین‌جا می‌بینی الان می‌تونه برداره یا اول چی لازمه.
          </p>

          {dogs.length > 0 && <DogPicker dogs={dogs} pickedId={pickedId} bubble={pickBubble} />}
        </div>

        {/*===== The Stall =====*/}
        <StallStage line={stallLine} changed={changed} short={dogs.length === 0} />
      </div>

      {/*------ The Path ------*/}
      {/* The stage's pieces stand in it (the grid is above it, z-10); on phones it closes the hero under the prints. */}
      <GroundStrip className={cn("-mt-6 h-8 lg:-mt-7 lg:h-10", STRIP_FADE)} />
    </section>
  );
}

/*===== Stall Stage =====*/
/**
 * The picture: a fixed box of pieces at the stage's bottom, so a taller words column only adds sky. Physical sides: the
 * pieces are tied to the pictures (the dog faces right, towards the words), and the bubble's tail (1.75rem in from its
 * right edge) is aimed at his head, 75% across him. `--dog-h` is his height, `--dog-l` how far he stands from the box's
 * left: the bubble's right edge is the box width minus his head's x minus 2.25rem.
 */
function StallStage({ line, changed, short }: { line: string; changed: boolean; short: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative order-1 h-[14rem] [--box:19rem] [--dog-h:8.5rem] [--dog-l:8.25rem] lg:order-2 lg:col-span-5 lg:h-auto lg:[--box:28rem] lg:[--dog-h:15.5rem] lg:[--dog-l:13.5rem]",
        // Without dogs the words are three lines: the stage keeps just the room the dog and his bubble need.
        short ? "lg:min-h-[21rem]" : "lg:min-h-[27rem]",
      )}
    >
      {/* Warm light under the awning, where he stands. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_45%_80%,rgb(255_194_26/0.08),transparent)]" />
      <NightSky className="inset-x-[6%] top-1 h-16 lg:top-2 lg:h-24" />

      {/*------ Phone Path ------*/}
      <GroundStrip className={cn("absolute inset-x-0 bottom-0 h-7 lg:hidden", STRIP_FADE)} />

      {/*------ Pieces ------*/}
      <div className="absolute inset-x-0 bottom-[0.9rem] mx-auto h-full w-(--box) lg:-bottom-1">
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute bottom-0 -left-[1.25rem] w-[3rem] translate-y-[6%] -scale-x-100 lg:-left-[2rem] lg:w-[4.25rem]"
        />
        <MascotCut name="stall" eager className="absolute bottom-0 left-0 w-[12rem] translate-y-[4%] lg:w-[22.5rem]" />
        <MascotCut
          name="plants"
          eager
          className="lively-sway absolute bottom-0 left-[14.25rem] w-[4rem] translate-y-[6%] lg:left-[23.75rem] lg:w-[6rem]"
        />

        {/*------ The Dog ------*/}
        {/* The rise is on the wrapper, the idle breath on the picture, so one doesn't cancel the other. */}
        <div className="by-rise absolute bottom-0 left-(--dog-l) h-(--dog-h) translate-y-[3%]">
          <div className="lively-pet h-full">
            <MascotCut name="price-tag" eager className="lively-breathe block h-full w-auto" />
          </div>
        </div>

        {/*------ Bubble ------*/}
        <div className="absolute right-[calc(var(--box)-var(--dog-l)-var(--dog-h)*280/371*0.75-2.25rem)] bottom-[calc(var(--dog-h)+0.4rem)] flex w-[15rem] justify-start lg:w-[17rem]">
          <ChalkBubble
            key={line}
            tail="right"
            className={cn("text-pretty [--pop-origin:calc(100%-1.75rem)_100%]", changed ? "answer-pop" : "by-pop")}
          >
            {line}
          </ChalkBubble>
        </div>
      </div>
    </div>
  );
}
