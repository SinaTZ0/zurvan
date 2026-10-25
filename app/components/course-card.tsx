import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { describePrerequisites, describeSessions, formatTomanShort } from "~/lib/course-format";
import { formatNumber } from "~/lib/locale-format";
import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";

/*===== Branches =====*/
// The working and sport courses are not one course but several branches (the guard dog, the bodyguard, the tracker...;
// BH, IGP 1, IGP 2, IGP 3, FH, WUSV), and the owner wants them visible before opening the page (2026-10-19). Their
// course rows keep the branch names in `commands`, which the card otherwise never shows, so for these families the
// card prints them as small chips. Other courses' `commands` are the lines of what a dog learns: not for the card.
const BRANCH_FAMILIES = new Set<CourseFamily>(["working", "sport"]);

/** On phones the card is half the screen wide: three chips and a «+N» keep it from growing taller than its row. */
const PHONE_BRANCHES = 3;

/*===== Course Card =====*/
/**
 * A course as a shop's product card: the cover on top with a round gold arrow on its corner, the title, its length,
 * and the price in gold. The whole card is the link to the course's page (the title's link is stretched over it), so a tap anywhere on
 * it opens the course; the arrow only shows that it does. Phones lay two of these side by side, so the summary waits
 * for wider cards (`md`).
 *
 * `showPrerequisites` adds the «بعد از» line under the title, saying which course must be passed first.
 */
export function CourseCard({ course, showPrerequisites = false }: { course: Course; showPrerequisites?: boolean }) {
  const prerequisites = showPrerequisites ? describePrerequisites(course) : null;
  const branches = BRANCH_FAMILIES.has(course.family) ? course.commands : [];

  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/15 bg-card shadow-sm transition-transform duration-150 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 motion-safe:active:scale-[0.98]">
      {/*===== Cover =====*/}
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        <img
          src={course.cover.src}
          alt={course.cover.alt}
          width={course.cover.width}
          height={course.cover.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-700 motion-safe:group-hover/card:scale-[1.04]"
        />
        {/* The arrow sits on the photo's corner, as a shop card's button does, so the price below keeps the card's
            whole width. */}
        <span
          aria-hidden
          className="absolute end-2 bottom-2 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform motion-safe:group-hover/card:-translate-x-0.5 sm:size-9 ltr:motion-safe:group-hover/card:translate-x-0.5"
        >
          <ChevronLeftIcon className="size-4 ltr:-scale-x-100" strokeWidth={2.6} />
        </span>
      </div>

      {/*===== Words =====*/}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-sm leading-6 font-extrabold text-pretty sm:text-base">
          {/* Stretched over the card: one target, one name for it (the title). */}
          <Link
            to="/courses/$slug"
            params={{ slug: course.slug }}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {course.title}
          </Link>
        </h3>
        {prerequisites && (
          <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground sm:text-xs">
            {m.shared_course_card_after({ courses: prerequisites })}
          </p>
        )}
        <p className="mt-1 line-clamp-2 text-sm text-pretty text-muted-foreground max-md:hidden">{course.summary}</p>

        {branches.length > 0 && (
          <ul aria-label={m.shared_course_card_branches()} className="mt-2 flex flex-wrap gap-1">
            {branches.map((branch, index) => (
              <li
                key={branch}
                className={`rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-muted-foreground sm:text-xs ${index >= PHONE_BRANCHES ? "max-sm:sr-only" : ""}`}
              >
                {/* Names such as «IGP 1» are Latin: isolate them so the digit stays on the right side of the letters. */}
                <bdi>{branch}</bdi>
              </li>
            ))}
            {branches.length > PHONE_BRANCHES && (
              <li aria-hidden dir="ltr" className="px-1 py-0.5 text-[11px] font-bold text-muted-foreground sm:hidden">
                {m.shared_course_card_more_branches({ count: formatNumber(branches.length - PHONE_BRANCHES) })}
              </li>
            )}
          </ul>
        )}

        {/*------ Length and Price ------*/}
        <div className="mt-auto pt-3">
          <p className="leading-tight">
            <span className="block text-[11px] text-muted-foreground sm:text-xs">{describeSessions(course)}</span>
            {course.price !== null && (
              <span className="mt-1 block text-sm font-black whitespace-nowrap text-primary tabular-nums sm:text-base">
                {formatTomanShort(course.price)}
              </span>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
