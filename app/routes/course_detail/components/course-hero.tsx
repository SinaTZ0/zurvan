import { cn } from "cn";
import { CakeIcon, ChevronLeftIcon, ClockIcon, KeyRoundIcon, MapPinIcon, type LucideIcon } from "lucide-react";

import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { describeAge, describePlace, describePrerequisites, describeSessions } from "~/lib/course-format";
import { courseScene } from "~/lib/course-scenes";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Course } from "~/orpc/course/contract";
import { COLUMN } from "~/routes/course_detail/column";

/*===== Course Hero =====*/
/**
 * The first screen, on the page's paper: the words on the start side with no box, the buy card (`children`, with the
 * course's dog standing on it) on the end side. The card is the only raised object here; the facts are a quiet strip.
 * It holds the title, the facts, the price, the dog list and the button without scrolling on a laptop.
 *
 * The hero is a night street: the whole of it ends on a strip of path, which the card stands on, and on a laptop the
 * room under the facts (the card is the taller column) is the place the course happens, under a chalk night sky, from
 * the same scenery as the course's family stage in the catalogue.
 *
 * Phones are designed apart: the cover photo comes first and melts into the paper, then the title, the facts as a 2x2
 * grid, and the card below them. On desktop that same photo is the top of the card instead (see `BuyCard`), so each
 * layout shows exactly one copy.
 */
export function CourseHero({ course, children }: { course: Course; children: React.ReactNode }) {
  return (
    <section aria-labelledby="course-title" className="relative isolate overflow-hidden">
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
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-background to-transparent" />
      </div>

      <div
        className={cn(
          COLUMN,
          "relative z-10 grid gap-y-6 pb-8 max-lg:-mt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12 lg:pt-3 lg:pb-0 xl:gap-x-20",
        )}
      >
        {/*===== Words =====*/}
        <div className="relative lg:flex lg:flex-col lg:pt-4">
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
          <h1 id="course-title" className={cn(DISPLAY_HEADING, "mt-5 text-h1 text-balance")}>
            {course.title}
          </h1>
          <p className="mt-2 text-lg font-bold text-muted-foreground">
            <bdi>{course.latinName}</bdi>
          </p>
          <p className="mt-4 max-w-xl text-lead text-pretty text-foreground/85">{course.summary}</p>

          {/*------ Trainer ------*/}
          {/* The site sells a named person, so he sits before the facts. The kind of class is not promised here: it is
              arranged with him (help page, «کلاس‌ها چه جوری برگزار می‌شن؟»). */}
          <p className="mt-6 flex items-center gap-3">
            <img
              src={HEAD_TRAINER.photos.avatar.src}
              alt=""
              width={HEAD_TRAINER.photos.avatar.width}
              height={HEAD_TRAINER.photos.avatar.height}
              className="size-12 shrink-0 rounded-full object-cover ring-1 ring-foreground/25"
            />
            <span className="flex flex-col leading-snug">
              <span className="font-bold">با {HEAD_TRAINER.name}</span>
              <span className="text-sm text-muted-foreground">نوع کلاس و زمان جلسه‌ها را با هم هماهنگ می‌کنید.</span>
            </span>
          </p>

          {/*------ Facts ------*/}
          <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card">
            {/* Hairlines are each cell's top and start borders, pulled out of the clip by -1px: they stay right whatever
                the number of cells (the wide cell takes a row of its own). */}
            <dl className="-ms-px -mt-px grid grid-cols-2 lg:grid-cols-4">
              <Facts course={course} />
            </dl>
          </div>

          {/*------ The Place ------*/}
          <PlaceScene course={course} />
        </div>

        {/*===== Buy Card =====*/}
        {children}
      </div>

      {/*===== Ground =====*/}
      {/* Under the grid, which overlaps it a little, so the card and the scenery stand in the path rather than on a
          line. Its ends fade, so it doesn't stop hard at the screen's edges. */}
      <GroundStrip className="-mt-4 h-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] md:h-12" />
    </section>
  );
}

/*===== Place Scene =====*/
/**
 * Laptops only: the course's place (`~/lib/course-scenes`) standing on the hero's path, with the night sky above it.
 * It takes whatever height the card leaves under the facts (a visitor's card leaves little, a customer's list of dogs
 * much more), at least enough for the tallest building; the pieces keep a fixed box, so a taller room only adds sky. Decoration: the facts already say where the training happens.
 */
function PlaceScene({ course }: { course: Course }) {
  return (
    <div aria-hidden className="relative hidden min-h-36 flex-1 lg:block">
      <NightSky className="inset-x-[8%] top-4 bottom-32" />
      {/* A pool of lamplight where the scene stands. */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(ellipse_50%_70%_at_50%_100%,rgb(255_194_26/0.07),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 mx-auto h-36 max-w-[21rem]">
        {courseScene(course.family).map((piece, index) => (
          <MascotCut
            key={index}
            name={piece.name}
            className={cn("absolute bottom-0 translate-y-[6%] scenery-dim", piece.className)}
          />
        ))}
      </div>
    </div>
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
        <FactTile icon={KeyRoundIcon} label="پیش‌نیاز" wide={course.minAgeMonths === null}>
          {prerequisites ?? "ندارد"}
        </FactTile>
      )}
    </>
  );
}

/** A gold line icon beside a label and its value, as one `<dt>`/`<dd>` pair in the strip. */
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
    <div className={cn("flex flex-col gap-2 border-s border-t border-border p-4", wide && "col-span-full")}>
      <Icon aria-hidden strokeWidth={1.7} className="size-5 text-primary" />
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-bold text-pretty">{children}</dd>
        {note && <p className="mt-1 text-xs text-pretty text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
