import { cn } from "cn";

import { Link } from "~/components/link";
import { SectionHeading } from "~/components/section-heading";
import { describeAge, describePlace, formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { CourseDetail } from "~/orpc/course/contract";
import type { CourseLane, LaneCourse } from "~/routes/course_detail/lane";

/*===== Ruler =====*/
// The home page's course map ruler, cut down to this course's lane: one column per month, the last one standing for
// "8 months and older".
const MONTHS = [2, 3, 4, 5, 6, 7, 8];

/** The grid column (1-based) a month falls in. */
function monthColumn(months: number) {
  return Math.min(months, MONTHS.at(-1)!) - MONTHS[0]! + 1;
}

/*===== Course Path =====*/
/**
 * Where the course sits: the age it can start from, the courses before and after it in its lane, the test that can
 * replace it and the equal path that ends in the same place. The ruler is the home page's own device, so a visitor who
 * came from the course map sees the same picture with this course lit. Below `xl` the columns are too narrow for
 * course names, so the lane becomes a short vertical list with the age written on each course, as on the home page.
 */
export function CoursePath({ course, lane }: { course: CourseDetail; lane: CourseLane }) {
  const isLane = lane.courses.length > 1;

  return (
    <section aria-labelledby="path-title" className="site-container pt-section-md">
      <SectionHeading
        id="path-title"
        title={isLane ? "این دوره کجای مسیر است؟" : "از چه سنی؟"}
        description={
          course.maxAgeMonths !== null
            ? "این دوره برای همین بازه‌ی سنی ساخته شده است."
            : "هر دوره از ماهی که روی خط است شروع می‌شود، و بعد از آن هم دیر نیست."
        }
      />

      {/*------ Ruler (xl) ------*/}
      <div className="mt-10 hidden xl:block">
        <ol aria-hidden className="grid grid-cols-7 gap-x-3">
          {MONTHS.map((month, index) => (
            <li key={month} className="border-s border-primary/40 ps-2 text-xs font-bold text-muted-foreground">
              {formatNumberFa(month)} ماهگی{index === MONTHS.length - 1 && " به بعد"}
            </li>
          ))}
        </ol>
        <RulerLane lane={lane} current={course.slug} />
      </div>

      {/*------ List (below xl) ------*/}
      {/* A lone course already says its age in the hero's facts, so phones only get the list for a real lane. */}
      {(isLane || course.maxAgeMonths !== null) && (
        <ol className="ms-1.5 mt-8 border-s border-primary/40 xl:hidden">
          {lane.courses.map((entry) => (
            <ListStop key={entry.slug} course={entry} isCurrent={entry.slug === course.slug} />
          ))}
        </ol>
      )}

      {/*------ Notes ------*/}
      <PathNotes course={course} lane={lane} />
    </section>
  );
}

/*===== Ruler Lane =====*/
/** The lane's line starts at its first course and runs to the end (or to an upper age bound); courses sit on it. */
function RulerLane({ lane, current }: { lane: CourseLane; current: string }) {
  const first = lane.courses[0]!;
  const lineStart = monthColumn(first.minAgeMonths!);
  // Grid lines are numbered one past the column, so the last column ends at line 8.
  const lineEnd = first.maxAgeMonths !== null ? monthColumn(first.maxAgeMonths) + 1 : MONTHS.length + 1;

  return (
    <ol className="mt-4 grid grid-cols-7 gap-x-3">
      <li
        aria-hidden
        style={{ gridColumnStart: lineStart, gridColumnEnd: lineEnd }}
        className="row-start-1 h-0.5 self-center rounded-full bg-primary/45"
      />
      {lane.courses.map((entry) => {
        const start = monthColumn(entry.minAgeMonths!);
        const end = entry.maxAgeMonths !== null ? monthColumn(entry.maxAgeMonths) + 1 : start + 1;
        const isCurrent = entry.slug === current;
        const body = (
          <>
            <span className="text-sm leading-snug font-extrabold">{entry.title}</span>
            <span className={cn("text-xs", isCurrent ? "text-primary-foreground/75" : "text-muted-foreground")}>
              {formatNumberFa(entry.sessionCount!)} جلسه، {describePlace(entry)}
            </span>
          </>
        );
        return (
          <li key={entry.slug} style={{ gridColumnStart: start, gridColumnEnd: end }} className="row-start-1 min-w-0">
            {/* Flat gold marks the selected state; the other courses are links like the home page's chips. */}
            {isCurrent ? (
              <span
                aria-current="page"
                className="flex flex-col rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-sm"
              >
                {body}
              </span>
            ) : (
              <Link
                to={`/courses/${entry.slug}`}
                className="flex flex-col rounded-xl border bg-card px-3 py-2 transition-colors hover:border-primary/60 hover:bg-accent"
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/*===== List Stop =====*/
function ListStop({ course, isCurrent }: { course: LaneCourse; isCurrent: boolean }) {
  const facts = `${describeAge(course)}، ${formatNumberFa(course.sessionCount!)} جلسه، ${describePlace(course)}`;

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
          <span className="font-extrabold text-primary">{course.title}</span>
          <span className="ms-2 rounded-full border border-primary/40 px-2 py-0.5 text-xs font-bold text-primary">
            همین دوره
          </span>
          <span className="block text-sm text-muted-foreground">{facts}</span>
        </p>
      ) : (
        <Link to={`/courses/${course.slug}`} className="group block rounded-sm">
          <span className="font-bold transition-colors group-hover:text-primary">{course.title}</span>
          <span className="block text-sm text-muted-foreground">{facts}</span>
        </Link>
      )}
    </li>
  );
}

/*===== Path Notes =====*/
/** Short ruled notes under the ruler: only the ones that apply to this course. */
function PathNotes({ course, lane }: { course: CourseDetail; lane: CourseLane }) {
  const notes: { term: string; body: React.ReactNode }[] = [];

  /*------ Before ------*/
  for (const required of course.prerequisites) {
    notes.push({
      term: "پیش از این دوره",
      body: (
        <>
          سگت باید <CourseLink slug={required.slug}>{required.title}</CourseLink> را گذرانده باشد
          {required.hasTest ? "، یا در تست آن قبول شده باشد." : "."}
        </>
      ),
    });
  }

  /*------ Age Window ------*/
  if (course.maxAgeMonths !== null) {
    notes.push({
      term: "سن",
      body: `فقط ${describeAge(course)}. برای سگ بزرگ‌تر، در ارزیابی رایگان دوره‌ی مناسبش را پیدا می‌کنیم.`,
    });
  }

  /*------ Test ------*/
  if (course.testPrice !== null) {
    notes.push({
      term: "تست این دوره",
      body: (
        <>
          سگت این‌ها را جای دیگری یاد گرفته؟ به‌جای دوره، تستش را بده؛ قبولی در تست همان اعتبار دوره را دارد. هزینه‌ی
          تست <span className="font-bold text-foreground">{formatToman(course.testPrice)}</span> است.{" "}
          <Link to="/account/dogs" className="font-bold text-primary underline-offset-4 hover:underline">
            رزرو تست
          </Link>
        </>
      ),
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
          از <CourseLink slug={lane.equalPath.first.slug}>{lane.equalPath.first.title}</CourseLink> هم می‌شود رفت؛ در{" "}
          {formatNumberFa(lane.equalPath.count)} دوره به همین نتیجه می‌رسد. یکی را انتخاب کن، یا در ارزیابی رایگان با هم
          انتخابش می‌کنیم.
        </>
      ),
    });
  }

  if (notes.length === 0) return null;

  return (
    <dl className="mt-10 grid gap-x-12 md:grid-cols-2">
      {/* A course can require more than one course, so the term alone isn't a unique key. */}
      {notes.map(({ term, body }, index) => (
        <div key={`${term}-${index}`} className="border-t py-5">
          <dt className="text-sm font-bold text-saffron-text">{term}</dt>
          <dd className="mt-1 text-pretty text-muted-foreground">{body}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A course name inside a sentence, linked. Underlined on hover rather than with a chevron, which would break the line. */
function CourseLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <Link to={`/courses/${slug}`} className="font-bold text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
