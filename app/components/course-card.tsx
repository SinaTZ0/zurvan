import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { describePrerequisites, describeSessions, formatTomanShort } from "~/lib/course-format";
import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";

/*===== Branches =====*/
// The working and sport courses are not one course but several branches (the guard dog, the bodyguard, the tracker...;
// BH, IGP 1, IGP 2, IGP 3, FH, WUSV), and the owner wants them visible before opening the page (2026-10-19). Their
// course rows keep the branch names in `commands`, which the card otherwise never shows, so for these families the
// card prints them as small chips. Other courses' `commands` are the lines of what a dog learns: not for the card.
const BRANCH_FAMILIES = new Set<CourseFamily>(["working", "sport"]);

/*===== Course Card =====*/
/**
 * The photo, the title, one line about it, and its length and price beside the way in. On phones the card turns into
 * a compact row (a square photo at the start, no summary), so a page of six stays a short scroll.
 *
 * `showPrerequisites` adds the "بعد از" line that says which course must be passed first. The catalogue turns it on;
 * the home grid leaves it off so its cards stay as they are.
 */
export function CourseCard({ course, showPrerequisites = false }: { course: Course; showPrerequisites?: boolean }) {
  const prerequisites = showPrerequisites ? describePrerequisites(course) : null;

  return (
    <article className="group/card grid h-full grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-3xl border border-border bg-card shadow-sm sm:flex sm:flex-col">
      {/* A wide, short photo: on the catalogue the card sits beside a drawn scene, so the photo is a glimpse of the
          real thing and the title and price keep most of the card. */}
      <div className="overflow-hidden sm:aspect-[16/9]">
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
        {prerequisites && (
          <p className="mt-1.5 text-xs text-muted-foreground">{m.shared_course_card_after({ courses: prerequisites })}</p>
        )}
        {BRANCH_FAMILIES.has(course.family) && course.commands.length > 0 && (
          <ul aria-label={m.shared_course_card_branches()} className="mt-2 flex flex-wrap gap-1.5">
            {course.commands.map((branch) => (
              <li key={branch} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {/* Names such as «IGP 1» are Latin: isolate them so the digit stays on the right side of the letters. */}
                <bdi>{branch}</bdi>
              </li>
            ))}
          </ul>
        )}

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
            to="/courses/$slug"
            params={{ slug: course.slug }}
            aria-label={m.shared_course_card_view_label({ title: course.title })}
            className={cn(buttonVariants({ size: "sm" }), "group/link max-sm:size-10 max-sm:px-0")}
          >
            <span className="max-sm:hidden">{m.shared_course_card_view()}</span>
            <ChevronLeftIcon
              aria-hidden
              data-icon="inline-end"
              className="transition-transform motion-safe:group-hover/link:-translate-x-0.5 ltr:-scale-x-100 ltr:motion-safe:group-hover/link:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
