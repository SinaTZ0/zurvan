import { cn } from "cn";

import { Link } from "~/components/link";
import { describeAge, describeSessions } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { Course } from "~/orpc/course/contract";
import type { CourseLane, LaneCourse } from "~/routes/course_detail/lane";

/*===== Lane Rail =====*/
/**
 * «بعدش چی؟»: the courses taken one after another with this one, as a flat vertical rail with this course lit gold and
 * the others linking to their own pages, then short notes for only what applies (the course before, the age window,
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
      <h2 id="lane-title" className="font-display text-h2 font-bold text-balance">
        بعدش چی؟
      </h2>
      {hasRail && (
        <p className="mt-3 text-pretty text-muted-foreground">دوره‌هام پشت سر هم باز می‌شن؛ هر کدوم بعد از قبلی.</p>
      )}

      {/*------ Rail ------*/}
      {hasRail && (
        <ol className="ms-1.5 mt-6 border-s border-primary/40">
          {lane.courses.map((entry) => (
            <RailStop key={entry.slug} entry={entry} isCurrent={entry.slug === course.slug} />
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

/*===== Rail Stop =====*/
/** One course on the rail. This course is lit gold; the others are links with their age and sessions underneath. */
function RailStop({ entry, isCurrent }: { entry: LaneCourse; isCurrent: boolean }) {
  const facts = `${describeAge(entry)}، ${describeSessions(entry)}`;

  return (
    <li className="relative py-3 ps-6">
      <span
        aria-hidden
        className={cn(
          "absolute -start-[5.5px] top-[1.45rem] size-2.5 rounded-full",
          isCurrent ? "bg-primary ring-4 ring-primary/20" : "border border-primary/60 bg-background",
        )}
      />
      {isCurrent ? (
        <p aria-current="page">
          <span className="font-extrabold text-primary">{entry.title}</span>
          <span className="ms-2 rounded-full border border-primary/40 px-2 py-0.5 text-xs font-bold text-primary">
            همین دوره
          </span>
          <span className="block text-sm text-muted-foreground">{facts}</span>
        </p>
      ) : (
        <Link to={`/courses/${entry.slug}`} className="group block rounded-sm">
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
