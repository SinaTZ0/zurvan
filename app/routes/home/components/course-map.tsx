import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { SectionHeading } from "~/routes/home/components/section-heading";
import { ADVANCED_TRACKS, type Course, describeAge, describePlace, getCourse } from "~/routes/home/courses";

/*===== Map Layout =====*/
// The ruler's months, one grid column each. The last column stands for "8 months and older".
const MONTHS = [2, 3, 4, 5, 6, 7, 8];

/** Each row is a lane of courses taken one after another; a group's rows share its label. */
const GROUPS: { title: string; note: string; rows: Course[][] }[] = [
  // The owner wants every dog to get CGC and almost every dog BMC, but the site never says so: the trainer builds them
  // into each dog's recommendations after the assessment instead.
  {
    title: "پایه",
    note: "قواعد زندگی در خانه، و آرام ماندن کنار آدم‌ها، سگ‌های دیگر و صداها.",
    rows: [[getCourse("house-manner")], [getCourse("cgc")]],
  },
  {
    // The owner's rule: both lanes teach the same things and end in the same place, at different prices.
    title: "فرمان‌پذیری",
    note: "دو مسیر با یک نتیجه. یکی را انتخاب کن.",
    rows: [
      [getCourse("elementary"), getCourse("advanced")],
      [getCourse("companion-1"), getCourse("companion-2"), getCourse("companion-3"), getCourse("companion-4")],
    ],
  },
  {
    title: "شش‌ماهگی",
    note: "برای سنی که سگ مرزها را امتحان می‌کند، بیرون از خانه.",
    rows: [[getCourse("bmc")]],
  },
];

/** One line under each advanced track's title, saying who it is for. Keyed by the track's slug. */
const TRACK_LEADS: Record<(typeof ADVANCED_TRACKS)[number]["slug"], string> = {
  "working-dogs": "برای سگ‌هایی که کار واقعی می‌کنند: نگهبانی، حفاظت، خدمت و ردیابی.",
  sport: "برای سگ‌هایی که برای مسابقه و ورزش‌های سگی آماده می‌شوند.",
};

/** The grid column (1-based) a course's minimum age falls in. */
function monthColumn(months: number) {
  return Math.min(months, MONTHS.at(-1)!) - MONTHS[0]! + 1;
}

/*===== Course Map =====*/
/**
 * The whole catalog on one ruler of the dog's age, since age is the first thing that decides what a dog can take. Each
 * course sits at the month it can start from, and a lane's line runs on from its first course, because starting later
 * is fine too. BMC is the exception with an upper bound, so its course spans its six-to-seven-month window instead.
 * Below `xl` the columns get too narrow for the course names, so the lanes become plain lists with the age written on
 * each course.
 */
export function CourseMap() {
  return (
    <section
      id="courses"
      aria-labelledby="courses-title"
      className="glow mt-section-md scroll-mt-8 bg-sunken py-section-md [--glow-alpha:0.13] [--glow-at:50%_0%] [--glow-h:70%] [--glow-w:55%]"
    >
      <div className="site-container">
        <SectionHeading
          id="courses-title"
          title="هر دوره از چه سنی؟"
          description="سن سگت را روی خط پیدا کن. هر دوره از همان ماه شروع می‌شود و بعد از آن هم دیر نیست. همه‌ی دوره‌ها خصوصی‌اند و اگر بخواهی، سگت در پانسیون آموزش می‌بیند."
          link={{ label: "همه‌ی دوره‌ها", to: "/courses" }}
        />

        <div className="mt-10 xl:grid xl:grid-cols-[11rem_minmax(0,1fr)] xl:gap-x-8">
          {/*------ Month Ruler ------*/}
          {/* Each tick starts at its column's start edge, where the courses of that month begin. */}
          <ol aria-hidden className="hidden xl:col-start-2 xl:grid xl:grid-cols-7 xl:gap-x-3">
            {MONTHS.map((month, index) => (
              <li key={month} className="border-s border-primary/40 ps-2 text-xs font-bold text-muted-foreground">
                {formatNumberFa(month)} ماهگی{index === MONTHS.length - 1 && " به بعد"}
              </li>
            ))}
          </ol>

          {/*------ Groups ------*/}
          {GROUPS.map((group) => (
            <div
              key={group.title}
              className="border-t py-6 first-of-type:border-t-0 xl:col-span-2 xl:grid xl:grid-cols-subgrid xl:border-t xl:py-5"
            >
              <div className="max-w-xs">
                <h3 className="text-h4">{group.title}</h3>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">{group.note}</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 xl:mt-0 xl:justify-center">
                {group.rows.map((row) => (
                  <Lane key={row[0]!.slug} courses={row} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/*------ Beyond the Ruler ------*/}
        {/* Working and sport dogs have no ages or session counts on the owner's cards yet, and behavior modification
            is for any age, so they sit off the ruler. One panel with hairline dividers, so the three read as a set of
            doors rather than three loose cards; each column pins its footnote to the bottom so they line up. */}
        <ul className="mt-10 grid overflow-hidden rounded-3xl border bg-card md:grid-cols-3">
          {ADVANCED_TRACKS.map((track) => (
            <TrackColumn
              key={track.slug}
              to={`/courses/${track.slug}`}
              title={track.title}
              lead={TRACK_LEADS[track.slug]}
              footnote="شرایط و برنامه‌ی هر گرایش بعد از ارزیابی سگت مشخص می‌شود."
            >
              <ul className="flex flex-wrap gap-2">
                {track.branches.map((branch) => (
                  <li
                    key={branch}
                    className="rounded-full border border-primary/35 px-3 py-1 text-sm font-bold text-primary"
                  >
                    <bdi>{branch}</bdi>
                  </li>
                ))}
              </ul>
            </TrackColumn>
          ))}

          {/*------ Behavior Modification ------*/}
          {/* Not a track: it starts from a request, so it is the one column with its own action. */}
          <TrackColumn
            to="/behavior-modification"
            title="اصلاح رفتار"
            lead="برای هر سن و هر نژاد: پرخاشگری، اضطراب جدایی، گاز گرفتن، خطای دستشویی و مشکل‌های دیگر."
            footnote="مشکل را توضیح بده و ویدیویی از رفتار سگت بفرست تا پیش از اولین جلسه بررسی شود."
          >
            <Link
              to="/behavior-modification"
              className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}
            >
              درخواست بررسی
            </Link>
          </TrackColumn>
        </ul>
      </div>
    </section>
  );
}

/*===== Lane =====*/
/**
 * One lane of courses in the order they're taken. On desktop it shares the ruler's seven columns: the line starts at
 * the first course and runs to the end (or to the upper age bound), and the courses sit on it at their months.
 */
function Lane({ courses }: { courses: Course[] }) {
  const first = courses[0]!;
  const lineStart = monthColumn(first.minAge!);
  // Grid lines are numbered one past the column, so the last column ends at line 8.
  const lineEnd = first.maxAge ? monthColumn(first.maxAge) + 1 : MONTHS.length + 1;

  return (
    <ol className="flex flex-wrap gap-2 xl:grid xl:grid-cols-7 xl:gap-x-3">
      <li
        aria-hidden
        style={{ gridColumnStart: lineStart, gridColumnEnd: lineEnd }}
        className="hidden h-0.5 self-center rounded-full bg-primary/45 xl:row-start-1 xl:block"
      />
      {courses.map((course) => {
        const start = monthColumn(course.minAge!);
        // A course with an upper bound covers its whole window, so its chip spans it.
        const end = course.maxAge ? monthColumn(course.maxAge) + 1 : start + 1;
        return (
          <li
            key={course.slug}
            style={{ "--start": start, "--end": end } as React.CSSProperties}
            className="min-w-0 xl:col-start-(--start) xl:col-end-(--end) xl:row-start-1"
          >
            <Link
              to={`/courses/${course.slug}`}
              className="flex flex-col rounded-xl border bg-card px-3 py-2 transition-colors hover:border-primary/60 hover:bg-accent"
            >
              <span className="text-sm leading-snug font-extrabold">{course.title}</span>
              <span className="text-xs text-muted-foreground">
                {/* The ruler already says the age on desktop; lists and screen readers still need it. */}
                <span className="xl:sr-only">{describeAge(course)}، </span>
                {formatNumberFa(course.sessions!)} جلسه، {describePlace(course)}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/*===== Track Column =====*/
/**
 * One column of the panel below the ruler: a linked title, a line on who it is for, the column's own content (branch
 * tags or an action), and a footnote pinned to the bottom so the three footnotes share a baseline.
 */
function TrackColumn({
  to,
  title,
  lead,
  footnote,
  children,
}: {
  to: string;
  title: string;
  lead?: string;
  footnote: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-4 border-t p-6 first:border-t-0 md:border-s md:border-t-0 md:first:border-s-0 lg:p-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-h4">
          <Link to={to} className="group inline-flex items-center gap-1 hover:text-primary">
            {title}
            <ChevronLeftIcon
              aria-hidden
              strokeWidth={2}
              className="size-5 text-primary transition-transform group-hover:-translate-x-1"
            />
          </Link>
        </h3>
        {lead && <p className="text-sm text-pretty">{lead}</p>}
      </div>
      {children}
      <p className="mt-auto border-t pt-4 text-sm text-pretty text-muted-foreground">{footnote}</p>
    </li>
  );
}
