import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { describeSessions, formatTomanShort } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";

/*===== Families =====*/
// The filter tabs, in the order a dog meets them. Behavior modification is dropped (app-spec), so it never gets a tab
// and its course is left out of the grid.
const FAMILY_TABS: { family: CourseFamily; label: string }[] = [
  { family: "basics", label: "پایه" },
  { family: "six-month", label: "شش‌ماهه‌ها" },
  { family: "obedience", label: "فرمان‌پذیری" },
  { family: "companion", label: "سگ همدم" },
  { family: "working", label: "سگ‌های کار" },
  { family: "sport", label: "ورزشی" },
];

const SHOWN_FAMILIES = new Set(FAMILY_TABS.map((tab) => tab.family));

/** Three columns by two rows on desktop. Tablets show the same six in two columns, phones as six compact rows. */
const PAGE_SIZE = 6;

/*===== Course Grid =====*/
/**
 * The catalogue as photo cards, filterable by family, six to a page with page buttons under the grid, so eleven
 * courses don't push the rest of the page a long scroll away.
 */
export function CourseGrid({
  courses,
  family,
  onFamilyChange,
}: {
  courses: Course[];
  /** The filter is owned by the page: the needs section above can set it before scrolling here. */
  family: CourseFamily | "all";
  onFamilyChange: (family: CourseFamily | "all") => void;
}) {
  // The page belongs to one filter: when the family changes, from here or from above, paging starts over at the first.
  const [paging, setPaging] = useState({ family, page: 0 });
  const page = paging.family === family ? paging.page : 0;
  const setPage = (next: number) => setPaging({ family, page: next });
  const gridRef = useRef<HTMLUListElement>(null);

  const listed = courses.filter((course) => SHOWN_FAMILIES.has(course.family));
  const shown = family === "all" ? listed : listed.filter((course) => course.family === family);
  // Only families that have a course get a tab, so a tab never filters down to nothing.
  const tabs = FAMILY_TABS.filter((tab) => listed.some((course) => course.family === tab.family));

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const onPage = shown.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /*------ Paging ------*/
  /** Shows a page. The buttons are under the grid, so if its top has scrolled out of view, the new page is brought up. */
  const goTo = (next: number) => {
    setPage(next);
    const grid = gridRef.current;
    if (grid && grid.getBoundingClientRect().top < 0) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      grid.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <section id="courses" aria-labelledby="courses-title" className="site-container scroll-mt-24 pt-section-lg">
      {/*------ Heading ------*/}
      <h2 id="courses-title" className="font-display text-h1 font-black text-balance">
        چی می‌تونم یاد بگیرم؟
      </h2>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        هر دوره بعد از دوره‌ی قبلش باز می‌شه. نمی‌دونی از کدوم شروع کنیم؟ توی ارزیابی رایگان با هم انتخابش می‌کنیم.
      </p>

      {/*------ Filter ------*/}
      <fieldset className="mt-8 flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto pb-1">
        <legend className="sr-only">نوع دوره</legend>
        {[{ family: "all" as const, label: "همه" }, ...tabs].map((tab) => (
          <button
            key={tab.family}
            type="button"
            aria-pressed={family === tab.family}
            onClick={() => onFamilyChange(tab.family)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-5 text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              family === tab.family
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </fieldset>

      {/*------ Cards ------*/}
      <ul ref={gridRef} className="mt-6 grid scroll-mt-28 gap-3 sm:grid-cols-2 sm:gap-gutter lg:grid-cols-3">
        {onPage.map((course) => (
          <li key={course.slug}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>

      {/*------ Pagination ------*/}
      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onPick={goTo} />}
    </section>
  );
}

/*===== Pagination =====*/
/**
 * Page numbers between a back and a forward arrow, centred under the grid. In RTL the pages run right to left, so
 * "next" points left. A hidden live line reads out the page that came up.
 */
function Pagination({ page, pageCount, onPick }: { page: number; pageCount: number; onPick: (page: number) => void }) {
  const arrow = cn(buttonVariants({ variant: "outline", size: "icon" }));

  return (
    <nav aria-label="صفحه‌های دوره‌ها" className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="صفحه‌ی قبل"
        disabled={page === 0}
        onClick={() => onPick(page - 1)}
        className={arrow}
      >
        <ChevronRightIcon aria-hidden />
      </button>

      <ol className="flex items-center gap-2">
        {Array.from({ length: pageCount }, (_, index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`صفحه‌ی ${formatNumberFa(index + 1)}`}
              aria-current={index === page ? "page" : undefined}
              onClick={() => onPick(index)}
              className={cn(
                "grid size-11 place-items-center rounded-full border text-sm font-extrabold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                index === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {formatNumberFa(index + 1)}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        aria-label="صفحه‌ی بعد"
        disabled={page === pageCount - 1}
        onClick={() => onPick(page + 1)}
        className={arrow}
      >
        <ChevronLeftIcon aria-hidden />
      </button>

      <p aria-live="polite" className="sr-only">
        صفحه‌ی {formatNumberFa(page + 1)} از {formatNumberFa(pageCount)}
      </p>
    </nav>
  );
}

/*===== Course Card =====*/
/**
 * The photo, the title, one line about it, and its length and price beside the way in. On phones the card turns into
 * a compact row (a square photo at the start, no summary), so a page of six stays a short scroll.
 */
function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group/card grid h-full grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-3xl border border-border bg-card shadow-sm sm:flex sm:flex-col">
      <div className="overflow-hidden sm:aspect-[3/2]">
        <img
          src={course.cover.src}
          alt={course.cover.alt}
          width={course.cover.width}
          height={course.cover.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-700 motion-safe:group-hover/card:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-extrabold sm:text-lg">{course.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-pretty text-muted-foreground max-sm:hidden">{course.summary}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3 sm:pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {describeSessions(course)}
            {course.price !== null && (
              <>
                <br />
                <span className="text-sm font-extrabold text-foreground">{formatTomanShort(course.price)}</span>
              </>
            )}
          </p>
          {/* The whole card isn't a link: the price and summary stay selectable, and there's one clear target. On
              phones the button is only the arrow, to fit the row. */}
          <Link
            to={`/courses/${course.slug}`}
            aria-label={`مشاهده‌ی دوره‌ی ${course.title}`}
            className={cn(buttonVariants({ size: "sm" }), "group/link max-sm:size-10 max-sm:px-0")}
          >
            <span className="max-sm:hidden">مشاهده دوره</span>
            <ChevronLeftIcon
              aria-hidden
              data-icon="inline-end"
              className="transition-transform motion-safe:group-hover/link:-translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
