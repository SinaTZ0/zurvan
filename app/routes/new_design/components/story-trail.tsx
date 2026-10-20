import { ClipboardList, LockOpen, PawPrint, Phone } from "lucide-react";

import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { Bubble, Cut, HEADING, Ticks } from "~/routes/new_design/components/story-parts";
import { STEPS } from "~/routes/new_design/content";

/*===== Chalk Defs =====*/
// The steps drawn as a chalk trail on one board, in the same chalk as the running lane's ground under it.
// Stacked, the trail is a tiled pattern (in px, so it never stretches) laid in one straight segment per gap between
// markers. The pattern and the roughening filter are defined once here; the svg holding them is sized to nothing but
// not `display: none`, which would stop Chrome painting them. A pattern's strokes take `currentColor` from where the
// pattern is defined, not where it's used, so the trail is the ink colour the section inherits, faded by opacity.
const STEP_ICONS = [ClipboardList, Phone, LockOpen, PawPrint] as const;

function ChalkDefs() {
  return (
    <svg aria-hidden className="absolute size-0">
      <defs>
        <filter id="st-trail-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.5} />
        </filter>
        {/* A dashed, slightly wavering line along y = 8; the upright copy turns it a quarter, onto x = 8. */}
        <pattern id="st-trail" width="64" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </pattern>
        <pattern id="st-trail-down" href="#st-trail" patternTransform="rotate(90) translate(0 -16)" />
      </defs>
    </svg>
  );
}

/*===== Trail Segment =====*/
/** The straight chalk line from one marker down to the next, when the steps stack. Positioned by the caller. */
function TrailSegment({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className}>
      <rect width="100%" height="100%" fill="url(#st-trail-down)" filter="url(#st-trail-chalk)" />
    </svg>
  );
}

/*===== Winding Trail =====*/
// Wide, the stops zig-zag (2 and 4 sit 3.5rem lower) and one path winds through their centres, with a loop before
// the last stop, up in the board's top padding clear of the titles: the dog got distracted. The viewBox is 1000
// wide, stretched to the row (880-1072px from lg up, so barely distorted), and 120 tall at 1:1. The centres sit at
// x 890/630/370/110 at every width within a few units, because the gaps are fixed and the columns share the rest.
// Its ends are under the markers, which paint over it.
const WINDING_PATH =
  "M890 32C800 30 740 90 630 88S470 30 370 32C320 33 280 20 250 20A18 18 0 0 1 250 -16A18 18 0 0 1 250 20C215 20 170 88 110 88";

function WindingTrail() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 120"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 hidden h-[7.5rem] w-full overflow-visible text-(--st-ink) opacity-55 lg:block"
    >
      <path
        d={WINDING_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeDasharray="20 11"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#st-trail-chalk)"
      />
    </svg>
  );
}

/*===== Sketched Edge =====*/
/**
 * The board's edge drawn twice in chalk, the second pass a little off and broken, the way a chalk outline goes over
 * itself. It traces the board's own rounded box, so the dog's paws still land on it.
 */
function SketchedEdge() {
  const box = { width: "calc(100% - 2px)", height: "calc(100% - 2px)" };
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-(--st-line)">
      <g fill="none" stroke="currentColor" strokeLinecap="round" filter="url(#st-trail-chalk)">
        <rect x="1" y="1" rx="32" style={box} strokeWidth={2.2} opacity={0.75} />
        <rect x="3" y="-1" rx="34" style={box} strokeWidth={1.2} strokeDasharray="140 18 60 26 220 14" opacity={0.35} />
      </g>
    </svg>
  );
}

/*===== Marker =====*/
/**
 * A step's stop on the trail: a hand-drawn ring (its end overlaps its start, as a chalk circle does) on the board's
 * colour, which hides the trail passing under it, with the step's icon in gold and its number on the ring.
 */
function Marker({ index }: { index: number }) {
  const Icon = STEP_ICONS[index];
  return (
    <div className="st-lift-pic relative grid size-16 shrink-0 place-items-center rounded-full bg-(--st-paper-2)">
      <svg aria-hidden viewBox="0 0 64 64" fill="none" className="absolute inset-0 text-(--st-ink)/70">
        <path
          d="M33 4C49 4 60 16 60 32S48 60 32 60 4 47 4 32 16 4 29 5.5"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          filter="url(#st-trail-chalk)"
        />
      </svg>
      <Icon aria-hidden className="size-7 text-(--st-sage-deep)" strokeWidth={1.6} />
      <span className="absolute -start-1.5 -top-1.5 grid size-7 place-items-center rounded-full border border-(--st-line)/40 bg-(--st-paper) text-xs font-bold text-(--st-ink)">
        {formatNumberFa(index + 1)}
      </span>
    </div>
  );
}

/*===== Story Trail =====*/
/**
 * «از کجا شروع کنیم؟»: the four steps as stops on one chalk trail, on a single board instead of four
 * boxes. The dog peeks over the board's top edge above step 3, where the courses unlock (the open lock and his
 * bubble say the same thing). Stacked, the trail runs down the start side and he peeks in at the far corner.
 *
 * Wide geometry: the board's padding is 2.5rem and the columns' gap 2.5rem, so step 3's centre (third from the
 * right) sits 2.1875rem + 37.5% of the content width from the board's left edge; the dog is centred there.
 */
export function StoryTrail() {
  return (
    <section aria-labelledby="st-path-title" className="mx-auto max-w-6xl px-4 pt-14 pb-10 md:px-8 md:pb-16 lg:pt-20">
      <ChalkDefs />
      <h2 id="st-path-title" className={`${HEADING} st-reveal text-center text-3xl md:text-5xl`}>
        از کجا شروع کنیم؟
      </h2>

      <div className="st-reveal relative mx-auto mt-40 max-w-xl rounded-[2rem] bg-(--st-paper-2) px-6 pt-12 pb-10 sm:px-8 lg:mt-36 lg:max-w-none lg:px-10 lg:pt-14 lg:pb-10">
        <SketchedEdge />

        {/*------ Props on the edges: the signpost where the trail starts, a dropped bone on the bottom ------*/}
        {/* Their straw tufts and the bone overlap the edge, so they sit on it rather than float near it. */}
        <Cut name="signpost" className="absolute right-5 bottom-[calc(100%-0.9rem)] w-24 lg:right-[5%] lg:w-32" />
        <Cut name="bone" className="absolute -bottom-4 left-6 w-24 -rotate-6 lg:left-[5%] lg:w-28" />

        {/*------ The dog over the top edge; his cut sits 1.4rem inside, under the paws ------*/}
        <div className="st-tilt st-pet absolute bottom-[calc(100%-1.4rem)] left-24 z-10 w-32 -translate-x-1/2 sm:w-36 lg:left-[calc(2.1875rem+(100%-5rem)*0.375)]">
          <Cut name="peek" className="w-full" />
          <Ticks className="st-ticks absolute top-[12%] -right-7 w-6" />
          <Ticks className="st-ticks absolute top-[12%] -left-7 w-6 -scale-x-100 [animation-delay:-.7s]" />
        </div>
        <Bubble
          tail="left"
          className="st-float absolute bottom-[calc(100%+5rem)] left-[11.5rem] z-10 w-28 text-sm sm:left-[calc(6rem+6.75rem)] sm:w-32 lg:left-[calc(2.1875rem+(100%-5rem)*0.375+6.75rem)]"
        >
          قفل‌ها دارن باز می‌شن!
        </Bubble>

        {/*------ The stops ------*/}
        <ol className="relative grid gap-y-8 lg:grid-cols-4 lg:gap-x-10">
          <WindingTrail />
          {STEPS.map((step, index) => {
            const last = index === STEPS.length - 1;
            return (
              <li
                key={step.title}
                className={cn(
                  "relative grid grid-cols-[4rem_1fr] items-start gap-x-5 lg:flex lg:flex-col lg:items-center lg:text-center",
                  index % 2 === 1 && "lg:mt-14",
                )}
              >
                {/* Stacked: down from this marker's centre, across the 2rem gap, to the next one's centre. */}
                {!last && (
                  <TrailSegment className="absolute start-[calc(2rem-8px)] top-8 -bottom-16 w-4 opacity-55 lg:hidden" />
                )}

                <div className="relative z-[1]">
                  {/* Wide only: stacked, the text column is right beside the marker and they'd cover it. */}
                  {index === 2 && (
                    <Cut name="key" className="absolute top-[45%] -left-12 z-[2] hidden w-16 -rotate-12 lg:block" />
                  )}
                  {last && (
                    <Cut
                      name="flag"
                      className="st-sway-2 absolute bottom-5 -left-[4.5rem] -z-[1] hidden w-24 lg:block"
                    />
                  )}
                  <div className="st-lift">
                    <Marker index={index} />
                  </div>
                </div>
                <div className="lg:mt-5">
                  <h3 className="font-display text-lg leading-snug font-bold text-(--st-ink) md:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-64 text-[15px] leading-7 text-(--st-ink)/75">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
