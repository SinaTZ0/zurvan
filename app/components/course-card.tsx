import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { describePrerequisites, describeSessions, formatTomanShort } from "~/lib/course-format";
import type { Course } from "~/orpc/course/contract";

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
        {prerequisites && <p className="mt-1.5 text-xs text-muted-foreground">بعد از: {prerequisites}</p>}

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
