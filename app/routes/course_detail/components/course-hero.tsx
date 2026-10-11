import { CakeIcon, ChevronLeftIcon, ClockIcon, KeyRoundIcon, MapPinIcon, PawPrintIcon } from "lucide-react";

import { Fact } from "~/components/fact";
import { Link } from "~/components/link";
import { Stars } from "~/components/stars";
import { buttonVariants } from "~/components/ui/button";
import { describeAge, describePlace, describePrerequisites, describeSessions, formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { CourseDetail } from "~/orpc/course/contract";
import { getCourseActions } from "~/routes/course_detail/actions";
import type { RatingSummary } from "~/routes/course_detail/discussion";

const ratingFormat = new Intl.NumberFormat("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/*===== Course Hero =====*/
/**
 * The first screen: plain slate and flat gold, like the home hero, so the gold leaf further down still means
 * something. The title and the facts a visitor checks first (sessions, age, place, what it needs before) sit beside
 * the photo, then who teaches it, the price, and the next step.
 *
 * Phones stack the head, the photo and the rest in that order; desktop puts the photo in its own column beside both.
 */
export function CourseHero({
  course,
  ratings,
  actionsRef,
}: {
  course: CourseDetail;
  ratings: RatingSummary | null;
  /** Watched by the phone action bar, which takes over once these buttons scroll away. */
  actionsRef: React.Ref<HTMLDivElement>;
}) {
  const actions = getCourseActions(course);

  return (
    <section
      aria-labelledby="course-title"
      className="site-container grid gap-x-16 gap-y-7 overflow-x-clip pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_1fr] lg:pt-14 xl:gap-x-24"
    >
      {/*------ Head ------*/}
      <div className="lg:col-start-1">
        <nav aria-label="مسیر صفحه">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link to="/courses" className="rounded-sm transition-colors hover:text-primary">
                دوره‌ها
              </Link>
            </li>
            <li aria-hidden>
              <ChevronLeftIcon strokeWidth={1.7} className="size-4 text-faint" />
            </li>
            <li aria-current="page" className="text-foreground">
              {course.title}
            </li>
          </ol>
        </nav>

        <h1 id="course-title" className="mt-6 font-display text-display leading-[1.45] font-bold text-balance">
          {course.title}
        </h1>
        {/* Amiri's descenders (the tail of «اصلاح») hang well below the line, so the Latin name keeps its distance. */}
        <p className="mt-4 text-lg font-bold text-muted-foreground">
          <bdi>{course.latinName}</bdi>
        </p>
      </div>

      {/*------ Photo ------*/}
      {/* The one image on the first screen, so it loads eagerly. A faint ivory light behind it rather than a gold
          one: the first screen stays plain. The section clips it sideways, or it would widen the page on phones. */}
      <div className="relative isolate lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
        <div aria-hidden className="absolute -inset-8 -z-10 rounded-full bg-foreground/6 blur-3xl" />
        <img
          src={course.cover.src}
          alt={course.cover.alt}
          width={course.cover.width}
          height={course.cover.height}
          fetchPriority="high"
          className="aspect-[16/10] w-full rounded-3xl object-cover shadow-md lg:aspect-[4/5]"
        />
      </div>

      {/*------ Body ------*/}
      <div className="flex flex-col lg:col-start-1 lg:row-start-2">
        <p className="max-w-[38rem] text-lead text-pretty text-foreground/85">{course.summary}</p>

        {/*------ Trainer and Rating ------*/}
        {/* Who teaches it comes before the facts: the site sells him, and "private" is the promise. */}
        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
          <p className="flex items-center gap-3">
            <img
              src={HEAD_TRAINER.photo.src}
              alt=""
              width={HEAD_TRAINER.photo.width}
              height={HEAD_TRAINER.photo.height}
              className="size-11 shrink-0 rounded-full object-cover object-[70%_50%] ring-1 ring-primary/40"
            />
            <span className="flex flex-col leading-snug">
              <span className="font-bold">با {HEAD_TRAINER.name}</span>
              <span className="text-sm text-muted-foreground">مربی دوره. جلسه‌ها خصوصی است، فقط با سگ تو.</span>
            </span>
          </p>
          {ratings && (
            <a
              href="#reviews"
              className="flex items-center gap-2 rounded-sm text-sm transition-colors hover:text-primary"
            >
              <Stars rating={Math.round(ratings.course)} />
              <span>
                <span className="font-bold">{ratingFormat.format(ratings.course)}</span>
                <span className="text-muted-foreground"> از {formatNumberFa(ratings.count)} نظر</span>
              </span>
            </a>
          )}
        </div>

        {/*------ Facts ------*/}
        <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5 border-y py-5">
          <CourseFacts course={course} />
        </dl>

        {/*------ Price and Next Step ------*/}
        <p className="mt-6 text-pretty">
          <PriceLine course={course} />
        </p>
        <div ref={actionsRef} className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to={actions.main.to} className={buttonVariants({ variant: "solid", size: "lg", className: "px-8" })}>
            {actions.main.label}
          </Link>
          {actions.alternative && (
            <Link
              to={actions.alternative.to}
              className={buttonVariants({ variant: "outline", size: "lg", className: "hover:text-primary" })}
            >
              {actions.alternative.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/*===== Facts =====*/
/** The course's facts, worded as on every storefront page. Courses without ages yet say so once, not four times. */
function CourseFacts({ course }: { course: CourseDetail }) {
  if (course.bookingKind === "behavior-request") {
    return (
      <>
        <Fact icon={PawPrintIcon} label="برای">
          هر سن و هر نژاد
        </Fact>
        <Fact icon={ClockIcon} label="تعداد جلسه‌ها">
          بعد از دیدن ویدیو
        </Fact>
      </>
    );
  }
  if (course.minAgeMonths === null) {
    return (
      <Fact icon={ClockIcon} label="سن، جلسه‌ها و محل تمرین">
        بعد از ارزیابی سگت
      </Fact>
    );
  }
  const prerequisites = describePrerequisites(course);
  return (
    <>
      <Fact icon={ClockIcon} label="تعداد جلسه‌ها">
        {describeSessions(course)}
      </Fact>
      <Fact icon={CakeIcon} label="سن سگ">
        {describeAge(course)}
      </Fact>
      <Fact icon={MapPinIcon} label="محل آموزش">
        {describePlace(course)}
      </Fact>
      {prerequisites && (
        <Fact icon={KeyRoundIcon} label="پیش‌نیاز">
          {prerequisites}
        </Fact>
      )}
    </>
  );
}

/*===== Price Line =====*/
/** The price in one sentence, with what happens before paying: the free assessment comes first. */
function PriceLine({ course }: { course: CourseDetail }) {
  if (course.bookingKind === "behavior-request") {
    return (
      <span className="text-muted-foreground">
        {HEAD_TRAINER.firstName} ویدیوی سگت را می‌بیند و بعد تعداد جلسه‌ها و هزینه را پیشنهاد می‌دهد.
      </span>
    );
  }
  if (course.price === null) {
    return <span className="text-muted-foreground">هزینه‌ی هر گرایش بعد از ارزیابی رایگان مشخص می‌شود.</span>;
  }
  return (
    <>
      <span className="text-muted-foreground">هزینه‌ی دوره </span>
      <span className="text-lg font-extrabold text-primary">{formatToman(course.price)}</span>
      <span className="text-muted-foreground">، بعد از ارزیابی رایگان.</span>
    </>
  );
}
