import { cn } from "cn";

import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { describeAge, describeSessions } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { Course } from "~/orpc/course/contract";
import type { CourseLane, LaneCourse } from "~/routes/course_detail/lane";

/*===== Lane Rail =====*/
/**
 * «بعدش چی؟»: the courses taken one after another with this one, as the home page's chalk trail running down: a dashed,
 * wavering chalk line with a stop per course, this course's stop gold and the others linking to their own pages, then short notes for only what applies (the course before, the age window,
 * the next course, the other path that ends in the same place). It replaces the home page's age ruler, which is too
 * wide for the narrow column this sits in.
 *
 * Returns just its own section, or `null` when a lone course has nothing to say beyond what the hero's facts already
 * do. The page owns the container, the 7/5 grid beside the learn section and the spacing.
 */
export function LaneRail({ course, lane }: { course: Course; lane: CourseLane }) {
  const notes = buildNotes({ course, lane });
  const hasRail = lane.courses.length > 1;

  if (!hasRail && notes.length === 0) return null;

  return (
    <section aria-labelledby="lane-title">
      <h2 id="lane-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
        بعدش چی؟
      </h2>
      {hasRail && (
        <p className="mt-3 text-pretty text-muted-foreground">دوره‌هام پشت سر هم باز می‌شن؛ هر کدوم بعد از قبلی.</p>
      )}

      {/*------ Rail ------*/}
      {hasRail && (
        <ol className="mt-7 flex flex-col gap-y-6">
          <ChalkDefs />
          {lane.courses.map((entry, index) => (
            <RailStop
              key={entry.slug}
              entry={entry}
              number={index + 1}
              isCurrent={entry.slug === course.slug}
              last={index === lane.courses.length - 1}
            />
          ))}
        </ol>
      )}

      {/*------ Notes ------*/}
      {notes.length > 0 && (
        <dl className={cn("border-b border-border", hasRail ? "mt-6" : "mt-5")}>
          {/* A course can require more than one course, so the term alone isn't a unique key. */}
          {notes.map(({ term, body }, index) => (
            <div key={`${term}-${index}`} className="border-t border-border py-4">
              <dt className="text-sm font-extrabold">{term}</dt>
              <dd className="mt-1 text-sm text-pretty text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/*===== Chalk Defs =====*/
// The home page's trail look, defined again under `cd-` ids (the home page's `st-` ones live in its own section, which
// isn't on this page): a displacement filter that roughens lines into chalk, and a dashed wavering line as a tiled
// pattern in px, so it never stretches. The upright copy turns the pattern a quarter, onto x = 8. The svg is sized to
// nothing but not `display: none`, which would stop Chrome painting what uses it. Pattern strokes take `currentColor`
// from where the pattern is defined, so the trail is the ink colour the section inherits, faded by opacity.
function ChalkDefs() {
  return (
    <>
      <TrailDraw />
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id="cd-trail-chalk" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
            <feDisplacementMap in="SourceGraphic" scale={2.5} />
          </filter>
          <pattern id="cd-trail" width="64" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </pattern>
          <pattern id="cd-trail-down" href="#cd-trail" patternTransform="rotate(90) translate(0 -16)" />
        </defs>
      </svg>
    </>
  );
}

/*===== Trail Draw =====*/
// The chalk line draws itself down from each stop to the next as it scrolls into view, so reading down the lane
// follows it being drawn. Driven by the scroll where the browser can (as the home page's reveals); elsewhere, and for
// reduced motion, it is simply there.
function TrailDraw() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        @supports (animation-timeline: view()) {
          .cd-draw {
            animation: cd-draw linear both;
            animation-timeline: view();
            animation-range: entry 30% cover 55%;
          }
        }
      }
      @keyframes cd-draw {
        from { clip-path: inset(0 0 100% 0); }
        to { clip-path: inset(0); }
      }
    `}</style>
  );
}

/*===== Marker =====*/
/**
 * A stop's ring, hand-drawn (its end overlaps its start, as a chalk circle does) on the paper's colour, which hides the
 * trail passing under it, with the stop's number. This course's stop is the one gold thing: a filled gold disc.
 */
function Marker({ number, isCurrent }: { number: number; isCurrent: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-12 shrink-0 place-items-center rounded-full font-extrabold",
        isCurrent ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={cn("absolute inset-0", isCurrent ? "text-primary" : "text-foreground/70")}
      >
        <path
          d="M33 4C49 4 60 16 60 32S48 60 32 60 4 47 4 32 16 4 29 5.5"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          filter="url(#cd-trail-chalk)"
        />
      </svg>
      <span className="relative">{formatNumberFa(number)}</span>
    </span>
  );
}

/*===== Rail Stop =====*/
/**
 * One course on the trail. The chalk line runs from this marker's centre down to the next one's, across the gap
 * (1.5rem) and half of each marker; the last one's runs down to the finish flag. This course is lit gold; the others are links with their
 * age and sessions underneath.
 */
function RailStop({
  entry,
  number,
  isCurrent,
  last,
}: {
  entry: LaneCourse;
  number: number;
  isCurrent: boolean;
  last: boolean;
}) {
  const facts = `${describeAge(entry)}، ${describeSessions(entry)}`;

  return (
    <li className={cn("relative grid grid-cols-[3rem_1fr] items-start gap-x-4", last && "pb-14")}>
      <svg
        aria-hidden
        className={cn(
          // An svg keeps its own 150px height whatever its insets, so the height is set: down to the next marker's
          // centre (this row, the 1.5rem gap and half the next marker, less the half of this one above `top-6`), or
          // for the last one down to the flag's foot.
          "cd-draw absolute start-[calc(1.5rem-8px)] top-6 w-4 text-foreground opacity-55",
          last ? "h-[calc(100%-2.25rem)]" : "h-[calc(100%+1.5rem)]",
        )}
      >
        <rect width="100%" height="100%" fill="url(#cd-trail-down)" filter="url(#cd-trail-chalk)" />
      </svg>
      {/* The lane's finish, as on the home page's trail: the line runs on past the last stop to a flag planted in it.
          The pole stands 18px in from the picture's right edge, so that is lined up with the line. */}
      {last && (
        <MascotCut
          name="flag"
          className="lively-sway-2 pointer-events-none absolute start-[calc(1.5rem-18px)] bottom-0 w-16"
        />
      )}
      <div className="relative">
        <Marker number={number} isCurrent={isCurrent} />
      </div>
      {isCurrent ? (
        <p aria-current="page" className="pt-1.5">
          <span className="font-extrabold text-primary">{entry.title}</span>
          <span className="ms-2 rounded-full border border-primary/40 px-2 py-0.5 text-xs font-bold text-primary">
            همین دوره
          </span>
          <span className="block text-sm text-muted-foreground">{facts}</span>
        </p>
      ) : (
        <Link
          to={`/courses/${entry.slug}`}
          className="group -m-1 block rounded-md p-1 pt-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="font-bold transition-colors group-hover:text-primary">{entry.title}</span>
          <span className="block text-sm text-muted-foreground">{facts}</span>
        </Link>
      )}
    </li>
  );
}

/*===== Notes =====*/
/** Only the notes that apply to this course. */
function buildNotes({ course, lane }: { course: Course; lane: CourseLane }): { term: string; body: React.ReactNode }[] {
  const notes: { term: string; body: React.ReactNode }[] = [];

  /*------ Before ------*/
  for (const required of course.prerequisites) {
    notes.push({
      term: "پیش از این دوره",
      body: (
        <>
          باید <CourseLink slug={required.slug}>{required.title}</CourseLink> را گذرانده باشم.
        </>
      ),
    });
  }

  /*------ Age Window ------*/
  if (course.maxAgeMonths !== null) {
    notes.push({
      term: "سن",
      body: `فقط ${describeAge(course)}. اگه بزرگ‌تر باشم، توی ارزیابی رایگان دوره‌ی مناسبم رو پیدا می‌کنیم.`,
    });
  }

  /*------ After ------*/
  if (lane.next) {
    notes.push({
      term: "بعد از این دوره",
      body: (
        <>
          <CourseLink slug={lane.next.slug}>{lane.next.title}</CourseLink>، {describeAge(lane.next)}.
        </>
      ),
    });
  }

  /*------ Equal Path ------*/
  if (lane.equalPath) {
    notes.push({
      term: "مسیر دیگر",
      body: (
        <>
          از <CourseLink slug={lane.equalPath.first.slug}>{lane.equalPath.first.title}</CourseLink> هم می‌شه رفت؛ در{" "}
          {formatNumberFa(lane.equalPath.count)} دوره به همین نتیجه می‌رسه. یکی رو انتخاب کن، یا توی ارزیابی رایگان با
          هم انتخابش می‌کنیم.
        </>
      ),
    });
  }

  return notes;
}

/** A course name inside a sentence, linked. Underlined on hover rather than with a chevron, which would break the line. */
function CourseLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <Link to={`/courses/${slug}`} className="font-bold text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
