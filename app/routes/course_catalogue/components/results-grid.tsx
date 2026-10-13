import { useRef } from "react";

import { CourseCard } from "~/components/course-card";
import { Pagination } from "~/components/pagination";
import type { Course } from "~/orpc/course/contract";

/*===== Results Grid =====*/
/**
 * One page of cards (three columns on desktop, two on tablets, compact rows on phones) with the page buttons under it
 * when there is more than one page. `page` is 1-based, as in the URL; the shared pagination counts from 0.
 */
export function ResultsGrid({
  courses,
  page,
  pageCount,
  onPageChange,
}: {
  courses: Course[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const gridRef = useRef<HTMLUListElement>(null);

  /** The buttons sit under the grid, so if its top has scrolled out of view the new page is brought up to it. */
  const pick = (index: number) => {
    onPageChange(index + 1);
    const grid = gridRef.current;
    if (grid && grid.getBoundingClientRect().top < 0) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      grid.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <section aria-labelledby="results-title">
      <h2 id="results-title" className="sr-only">
        فهرست دوره‌ها
      </h2>
      <ul ref={gridRef} className="grid scroll-mt-28 gap-3 sm:grid-cols-2 sm:gap-gutter lg:grid-cols-3">
        {courses.map((course) => (
          <li key={course.slug}>
            <CourseCard course={course} showPrerequisites />
          </li>
        ))}
      </ul>

      {pageCount > 1 && <Pagination page={page - 1} pageCount={pageCount} onPick={pick} className="mt-10" />}
    </section>
  );
}
