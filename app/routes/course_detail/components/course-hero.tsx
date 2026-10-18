import { cn } from "cn";
import { CakeIcon, ChevronLeftIcon, ClockIcon, KeyRoundIcon, MapPinIcon, type LucideIcon } from "lucide-react";

import { Link } from "~/components/link";
import { describeAge, describePlace, describePrerequisites, describeSessions } from "~/lib/course-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Course } from "~/orpc/course/contract";

/*===== Course Hero =====*/
/**
 * The first screen, on `bg-jet`: the words on the start side with no box, the buy card (`children`) on the end side.
 * It holds the title, the facts, the price, the dog list and the button without scrolling on a laptop.
 *
 * Phones are designed apart: the cover photo comes first and melts into the black, then the title, the facts as a 2x2
 * grid, and the card below them. On desktop that same photo is the top of the card instead (see `BuyCard`), so each
 * layout shows exactly one copy.
 */
export function CourseHero({ course, children }: { course: Course; children: React.ReactNode }) {
  return (
    <section aria-labelledby="course-title" className="relative isolate overflow-hidden bg-jet">
      {/*------ Phone Photo ------*/}
      <div className="relative lg:hidden">
        <img
          src={course.cover.src}
          alt={course.cover.alt}
          width={course.cover.width}
          height={course.cover.height}
          fetchPriority="high"
          className="aspect-16/10 w-full object-cover"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-jet to-transparent" />
      </div>

      <div className="site-container grid gap-y-8 pb-section-sm max-lg:-mt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-stretch lg:gap-x-16 lg:pt-12 lg:pb-section-sm xl:gap-x-24">
        {/*===== Words =====*/}
        <div className="relative lg:flex lg:flex-col lg:justify-center">
          <nav aria-label="مسیر صفحه">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/courses"
                  className="rounded-sm transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  دوره‌ها
                </Link>
              </li>
              <li aria-hidden>
                <ChevronLeftIcon strokeWidth={1.7} className="size-4" />
              </li>
              <li aria-current="page" className="text-foreground">
                {course.title}
              </li>
            </ol>
          </nav>

          {/*------ Title ------*/}
          <h1 id="course-title" className="mt-5 font-display text-h1 font-black text-balance">
            {course.title}
          </h1>
          <p className="mt-2 text-lg font-bold text-muted-foreground">
            <bdi>{course.latinName}</bdi>
          </p>
          <p className="mt-4 max-w-xl text-lead text-pretty text-foreground/85">{course.summary}</p>

          {/*------ Trainer ------*/}
          {/* The site sells him, and «private» is the promise: both sit before the facts. */}
          <p className="mt-6 flex items-center gap-3">
            <img
              src={HEAD_TRAINER.photo.src}
              alt=""
              width={HEAD_TRAINER.photo.width}
              height={HEAD_TRAINER.photo.height}
              className="size-12 shrink-0 rounded-full object-cover object-[70%_50%] ring-1 ring-primary/40"
            />
            <span className="flex flex-col leading-snug">
              <span className="font-bold">با {HEAD_TRAINER.name}</span>
              <span className="text-sm text-muted-foreground">جلسه‌ها خصوصی است، فقط با سگ تو.</span>
            </span>
          </p>

          {/*------ Facts ------*/}
          <dl className="mt-7 grid grid-cols-2 gap-3 lg:mt-9 lg:grid-cols-4">
            <Facts course={course} />
          </dl>
        </div>

        {/*===== Buy Card =====*/}
        {children}
      </div>
    </section>
  );
}

/*===== Facts =====*/
/**
 * The facts a visitor checks first. A course without ages yet (working, sport) says «بعد از ارزیابی سگت» once, in one
 * wide tile, instead of the same words four times.
 */
function Facts({ course }: { course: Course }) {
  const prerequisites = describePrerequisites(course);

  return (
    <>
      {course.minAgeMonths === null ? (
        <FactTile icon={ClockIcon} label="سن، جلسه‌ها و محل تمرین" wide>
          بعد از ارزیابی سگت
        </FactTile>
      ) : (
        <>
          <FactTile icon={ClockIcon} label="تعداد جلسه‌ها" note="به سگ و نوع دوره بستگی داره.">
            {describeSessions(course)}
          </FactTile>
          <FactTile icon={CakeIcon} label="سن سگ">
            {describeAge(course)}
          </FactTile>
          <FactTile icon={MapPinIcon} label="محل آموزش">
            {describePlace(course)}
          </FactTile>
        </>
      )}
      {(prerequisites || course.minAgeMonths !== null) && (
        <FactTile icon={KeyRoundIcon} label="پیش‌نیاز">
          {prerequisites ?? "ندارد"}
        </FactTile>
      )}
    </>
  );
}

/** A gold line icon over a label and its value, as one `<dt>`/`<dd>` pair. */
function FactTile({
  icon: Icon,
  label,
  wide = false,
  note,
  children,
}: {
  icon: LucideIcon;
  label: string;
  wide?: boolean;
  /** A short qualifier under the value, for a fact that is approximate. */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-4", wide && "col-span-full")}>
      <Icon aria-hidden strokeWidth={1.7} className="size-6 text-primary" />
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-bold text-pretty">{children}</dd>
        {note && <p className="mt-1 text-xs text-pretty text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
