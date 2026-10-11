import { Link } from "~/components/link";
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
            is for any age, so they sit off the ruler. */}
        <ul className="mt-10 grid gap-gutter md:grid-cols-3">
          {ADVANCED_TRACKS.map((track) => (
            <li key={track.slug} className="flex flex-col gap-3 rounded-3xl border bg-card p-6">
              <h3 className="text-h4">
                <Link to={`/courses/${track.slug}`} className="hover:text-primary">
                  {track.title}
                </Link>
              </h3>
              <ul className="flex flex-wrap gap-2">
                {track.branches.map((branch) => (
                  <li key={branch} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    <bdi>{branch}</bdi>
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-sm text-pretty text-muted-foreground">
                شرایط و برنامه‌ی هر گرایش بعد از ارزیابی سگت مشخص می‌شود.
              </p>
            </li>
          ))}
          <li className="flex flex-col gap-3 rounded-3xl border border-saffron/40 bg-card p-6">
            <h3 className="text-h4">
              <Link to="/behavior-modification" className="hover:text-primary">
                اصلاح رفتار
              </Link>
            </h3>
            <p className="text-sm text-pretty">
              برای هر سن و هر نژاد: پرخاشگری، اضطراب جدایی، گاز گرفتن، خطای دستشویی و مشکل‌های دیگر.
            </p>
            <p className="mt-auto text-sm text-pretty text-muted-foreground">
              مشکل را توضیح بده و ویدیویی از رفتار سگت بفرست تا پیش از اولین جلسه بررسی شود.
            </p>
          </li>
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
