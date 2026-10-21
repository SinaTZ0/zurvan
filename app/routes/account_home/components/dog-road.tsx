import { cn } from "cn";
import { CheckIcon, LockIcon, XIcon } from "lucide-react";

import { MascotCut } from "~/components/mascot-cut";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Dog } from "~/orpc/dog/contract";
import type { Enrollment } from "~/orpc/enrollment/contract";
import type { RoadMark, RoadStop, RoadTone } from "~/routes/account_home/road";

/*===== Constants =====*/
/** Passed courses shown as chips; the rest collapse into «+n». Dog Detail lists them all. */
const MAX_PASSED_CHIPS = 3;

// The walked part of the road is gold, the part ahead faint ink. The pattern's stroke colour is fixed where the pattern
// is defined (a pattern doesn't take `currentColor` from the shape that uses it), so each colour has its own pattern,
// and each pattern an upright copy for the phone's vertical road. The fill is a CSS property, so it can switch at `lg`.
const SEGMENT_FILL = {
  walked: "[fill:url(#ah-trail-gold-down)] lg:[fill:url(#ah-trail-gold)] opacity-75",
  ahead: "[fill:url(#ah-trail-ink-down)] lg:[fill:url(#ah-trail-ink)] opacity-45",
} as const;

/*===== Dog Road =====*/
/**
 * A dog's road: four stops on a dashed chalk line, each a disc and a label with one short fact under it, ending at the
 * gold flag. Phones run it down the start side (as Course Detail's lane); from `lg` it runs across the panel in reading
 * direction, the flag planted at its far end.
 *
 * Every stop is the same shape in both directions: the segment that leaves a stop is drawn inside that stop's item,
 * from its disc's centre to the next disc's centre (the items touch, so that is the item's full width or height plus
 * the row gap), and the last one runs on to the flag's pole. The walked segments are gold.
 *
 * `changed` is true once the dog's state changed while the page was open (a withdrawn request): the stops that look
 * different are keyed by their look, so they remount and rise in (`answer-in`) instead of snapping.
 */
export function DogRoad({
  dogName,
  stops,
  current,
  activeEnrollments,
  passedCourses,
  changed,
}: {
  dogName: string;
  stops: readonly RoadStop[];
  current: number;
  activeEnrollments: readonly Enrollment[];
  passedCourses: Dog["passedCourses"];
  changed: boolean;
}) {
  return (
    <ol
      aria-label={`مسیر ${dogName}`}
      className="grid gap-y-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.45fr)] lg:gap-y-0 lg:pt-14"
    >
      {stops.map((stop, index) => {
        const last = index === stops.length - 1;
        // A segment is walked when the stop it leads to is already reached.
        const walked = !last && index + 1 <= current;
        const look = `${stop.tone}-${stop.mark}-${stop.fact ?? ""}`;

        return (
          <li
            key={stop.id}
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 lg:flex lg:flex-col lg:gap-y-3 lg:pe-5",
              last && "pb-16 lg:pb-0",
            )}
          >
            {/*------ Segment ------*/}
            {/* An svg keeps its own 150px height whatever its insets, so both sizes are set. Down: from this disc's
                centre (`top-5`) to the next one's, across the 1.25rem gap; the last one to the flag's foot. Across: from
                this disc's centre (1.25rem in from the start) the item's width to the next one's; the last one to the
                flag's pole, which stands 18px in from the picture's right edge at `w-16`. */}
            <svg
              aria-hidden
              className={cn(
                `ah-seg ah-seg-${index} absolute start-[calc(1.25rem-8px)] top-5 w-4`,
                "lg:start-5 lg:top-[calc(1.25rem-8px)] lg:h-4",
                last ? "h-[calc(100%-1.25rem)] lg:w-[calc(100%-5.25rem+18px)]" : "h-[calc(100%+1.25rem)] lg:w-full",
                walked ? SEGMENT_FILL.walked : SEGMENT_FILL.ahead,
              )}
            >
              <rect width="100%" height="100%" filter="url(#ah-trail-chalk)" />
            </svg>

            {/*------ Finish Flag ------*/}
            {/* The road's end, as on Course Detail's lane: the line runs on past the last stop to a flag planted in it.
                Down: at the item's foot, the pole on the line. Across: at the item's far end, standing on the line. */}
            {last && (
              <MascotCut
                name="flag"
                className="lively-sway-2 absolute start-[calc(1.25rem-18px)] bottom-0 w-16 lg:start-auto lg:end-0 lg:top-[calc(1.25rem+6px)] lg:bottom-auto lg:-translate-y-full"
              />
            )}

            {/*------ Disc ------*/}
            <div key={look} className={cn("relative z-10", changed && "answer-in")}>
              <Marker tone={stop.tone} mark={stop.mark} />
            </div>

            {/*------ Words ------*/}
            <div key={`${look}-words`} className={cn("min-w-0 pt-1.5 lg:pt-0", changed && "answer-in")}>
              <p className={cn("font-extrabold", LABEL_TONE[stop.tone])}>{stop.label}</p>
              {stop.fact && <p className="mt-0.5 text-sm text-pretty text-muted-foreground">{stop.fact}</p>}

              {stop.id === "courses" && stop.fact === null && <ActiveList enrollments={activeEnrollments} />}
              {stop.id === "passed" && passedCourses.length > 0 && <PassedChips courses={passedCourses} />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/*===== Label Tone =====*/
// The lit stop is gold; a stop reached is ink; the ones ahead step back.
const LABEL_TONE: Record<RoadTone, string> = {
  done: "text-foreground",
  current: "text-primary",
  locked: "text-muted-foreground",
  ahead: "text-muted-foreground",
};

/*===== Marker =====*/
/**
 * A stop's disc. Reached: a filled gold disc with a check. Otherwise a hand-drawn chalk ring on the panel's colour (so
 * it hides the line passing under it): gold for the lit stop, with a halo that breathes slowly, muted for the stops
 * ahead. Inside: nothing, a gold dot (training), a small x (the request was answered with a no), a lock.
 */
function Marker({ tone, mark }: { tone: RoadTone; mark: RoadMark }) {
  if (tone === "done") {
    return (
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
        <CheckIcon strokeWidth={3} className="size-5" />
      </span>
    );
  }

  const lit = tone === "current" && mark !== "x";

  return (
    <span aria-hidden className="relative grid size-10 place-items-center rounded-full bg-sunken">
      {tone === "current" && <span className="ah-halo absolute inset-0 rounded-full border-2 border-primary/50" />}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={cn("absolute inset-0", lit ? "text-primary" : "text-foreground/40")}
      >
        <path
          d="M33 4C49 4 60 16 60 32S48 60 32 60 4 47 4 32 16 4 29 5.5"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          filter="url(#ah-trail-chalk)"
        />
      </svg>
      {mark === "dot" && <span className="relative size-3 rounded-full bg-primary" />}
      {mark === "x" && <XIcon strokeWidth={2.6} className="relative size-4 text-muted-foreground" />}
      {mark === "lock" && <LockIcon strokeWidth={2} className="relative size-4 text-muted-foreground" />}
    </span>
  );
}

/*===== Active List =====*/
/** The courses the dog is in now: the title, and since when under it in small type. */
function ActiveList({ enrollments }: { enrollments: readonly Enrollment[] }) {
  return (
    <ul className="mt-1 flex flex-col gap-1.5">
      {enrollments.map((enrollment) => (
        <li key={enrollment.id} className="flex flex-col text-sm leading-snug">
          <span className="font-bold text-foreground">{enrollment.course.title}</span>
          <span className="text-xs text-muted-foreground">از {formatJalaliTimestamp(enrollment.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

/*===== Passed Chips =====*/
function PassedChips({ courses }: { courses: Dog["passedCourses"] }) {
  const shown = courses.slice(0, MAX_PASSED_CHIPS);
  const hidden = courses.length - shown.length;
  const chip =
    "inline-flex min-h-7 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-bold";

  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {shown.map((course) => (
        <li key={course.slug} className={chip}>
          <CheckIcon aria-hidden strokeWidth={3} className="size-3.5 shrink-0 text-primary" />
          {course.title}
        </li>
      ))}
      {hidden > 0 && (
        <li className={cn(chip, "text-muted-foreground")}>
          <span aria-hidden>+{formatNumberFa(hidden)}</span>
          <span className="sr-only">و {formatNumberFa(hidden)} دوره‌ی دیگه</span>
        </li>
      )}
    </ul>
  );
}

/*===== Road Chalk =====*/
/**
 * Rendered once on the page, before the roads: Course Detail's chalk trail defined again under `ah-` ids (a filter that
 * roughens lines into chalk, a dashed wavering line as a tiled pattern in px so it never stretches, in gold and in ink,
 * each with an upright copy turned a quarter onto x = 8), and the roads' motion. The svg is sized to nothing but not
 * `display: none`, which would stop Chrome painting what uses it.
 *
 * Motion, off for reduced motion (which shows the finished road): each segment draws itself in reading direction as it
 * scrolls into view (down on phones, right to left across on a laptop, the four segments one after another), and the
 * lit stop's halo breathes.
 */
export function RoadChalk() {
  return (
    <>
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id="ah-trail-chalk" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
            <feDisplacementMap in="SourceGraphic" scale={2.5} />
          </filter>
          {(["gold", "ink"] as const).map((tone) => (
            <pattern key={tone} id={`ah-trail-${tone}`} width="64" height="16" patternUnits="userSpaceOnUse">
              <path
                d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
                fill="none"
                style={{ stroke: tone === "gold" ? "var(--primary)" : "var(--foreground)" }}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </pattern>
          ))}
          <pattern id="ah-trail-gold-down" href="#ah-trail-gold" patternTransform="rotate(90) translate(0 -16)" />
          <pattern id="ah-trail-ink-down" href="#ah-trail-ink" patternTransform="rotate(90) translate(0 -16)" />
        </defs>
      </svg>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ah-halo { animation: ah-halo 3.2s ease-out infinite; }
          @supports (animation-timeline: view()) {
            .ah-seg {
              animation: ah-draw-down linear both;
              animation-timeline: view();
              animation-range: entry 30% cover 55%;
            }
            @media (min-width: 64rem) {
              .ah-seg { animation-name: ah-draw-across; }
              .ah-seg-0 { animation-range: entry 60% cover 40%; }
              .ah-seg-1 { animation-range: cover 38% cover 45%; }
              .ah-seg-2 { animation-range: cover 43% cover 50%; }
              .ah-seg-3 { animation-range: cover 48% cover 55%; }
            }
          }
        }
        @keyframes ah-draw-down {
          from { clip-path: inset(0 0 100% 0); }
          to { clip-path: inset(0); }
        }
        @keyframes ah-draw-across {
          from { clip-path: inset(0 0 0 100%); }
          to { clip-path: inset(0); }
        }
        @keyframes ah-halo {
          0% { transform: scale(1); opacity: .8; }
          70%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}
