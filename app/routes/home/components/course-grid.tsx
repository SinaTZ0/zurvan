import { useRef, useState } from "react";

import { CourseCard } from "~/components/course-card";
import { CourseFamilyFilter } from "~/components/course-family-filter";
import { Pagination } from "~/components/pagination";
import { familiesWithCourses, isShownFamily } from "~/lib/course-families";
import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";

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

  const listed = courses.filter((course) => isShownFamily(course.family));
  const shown = family === "all" ? listed : listed.filter((course) => course.family === family);
  const tabs = familiesWithCourses(courses);

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
      <CourseFamilyFilter tabs={tabs} value={family} onChange={onFamilyChange} className="mt-8" />

      {/*------ Cards ------*/}
      <ul ref={gridRef} className="mt-6 grid scroll-mt-28 gap-3 sm:grid-cols-2 sm:gap-gutter lg:grid-cols-3">
        {onPage.map((course) => (
          <li key={course.slug}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>

      {/*------ Pagination ------*/}
      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onPick={goTo} className="mt-10" />}
    </section>
  );
}
