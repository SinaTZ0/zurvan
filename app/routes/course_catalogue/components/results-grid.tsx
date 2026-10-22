import { cn } from "cn";
import { useRef } from "react";

import { CourseCard } from "~/components/course-card";
import { Pagination } from "~/components/pagination";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";
import { FamilyGroupHeader } from "~/routes/course_catalogue/components/family-group-header";
import { groupByFamily, type FamilyGroup } from "~/routes/course_catalogue/family-groups";

/*===== Panel Shapes =====*/
// Each family is one bundle: a sunken panel holding its header and its cards, so the families read as units and no
// grid cell is left empty. Cards keep one width (19rem; 21rem alone, where the price needs the room) whatever the family's size,
// and the header, the dog's stage, takes what they leave:
// - one course: the stage beside the card from tablets up;
// - two or four: the stage beside a two-column block from laptops up, stacked above it before that;
// - three, or five and more: the header stays a row across the top and the cards go three across.
type PanelShape = { panel: string; cards: string; stageFrom: "sm" | "lg" | "none" };

function panelShape(count: number): PanelShape {
  if (count === 1) return { panel: "sm:grid sm:grid-cols-[minmax(0,1fr)_21rem]", cards: "", stageFrom: "sm" };
  if (count === 2 || count === 4) {
    return {
      panel: "lg:grid lg:grid-cols-[minmax(12rem,1fr)_auto]",
      cards: "sm:grid-cols-2 lg:grid-cols-[repeat(2,19rem)]",
      stageFrom: "lg",
    };
  }
  return { panel: "", cards: "sm:grid-cols-2 lg:grid-cols-3", stageFrom: "none" };
}

/*===== Rows =====*/
/**
 * Two one-course families in a row share a row on laptops, as two half-width panels, so neither stage is a wide empty
 * stretch. A one-course family with no neighbour to pair with keeps the whole row and gets a bigger dog instead.
 */
function toRows(groups: FamilyGroup[]): FamilyGroup[][] {
  const rows: FamilyGroup[][] = [];
  for (const group of groups) {
    const last = rows.at(-1);
    const pairs = last?.length === 1 && last[0]!.courses.length === 1 && group.courses.length === 1;
    if (pairs) last.push(group);
    else rows.push([group]);
  }
  return rows;
}

/*===== Results Grid =====*/
/**
 * One page of cards, grouped by family into panels (see "Panel Shapes"); compact card rows on phones. The page buttons
 * sit under the last panel when there is more than one page. `page` is 1-based, as in the URL; the shared pagination
 * counts from 0. With `arrive` the panels fade in one after another (the page gives the grid a new key per list).
 */
export function ResultsGrid({
  courses,
  page,
  pageCount,
  arrive,
  onPageChange,
}: {
  courses: Course[];
  page: number;
  pageCount: number;
  arrive: boolean;
  onPageChange: (page: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const groups = groupByFamily({ courses });

  /** The buttons sit under the groups, so if their top has scrolled out of view the new page is brought up to it. */
  const pick = (index: number) => {
    onPageChange(index + 1);
    const list = listRef.current;
    if (list && list.getBoundingClientRect().top < 0) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      list.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <div ref={listRef} className="scroll-mt-28">
      <h2 className="sr-only">{m.course_catalogue_results_list()}</h2>

      {/*------ Groups ------*/}
      <div className="space-y-5 md:space-y-6">
        {toRows(groups).map((row, index) => (
          <div
            key={row[0]!.family}
            // A short stagger, capped so a long list doesn't keep the last panel waiting.
            style={arrive ? ({ "--answer-delay": `${Math.min(index, 4) * 60}ms` } as React.CSSProperties) : undefined}
            className={cn(
              arrive && "answer-in",
              row.length === 2 && "space-y-5 md:space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0",
            )}
          >
            {row.map((group) => (
              <FamilyPanel key={group.family} group={group} bigDog={row.length === 1} />
            ))}
          </div>
        ))}
      </div>

      {pageCount > 1 && <Pagination page={page - 1} pageCount={pageCount} onPick={pick} className="mt-10" />}
    </div>
  );
}

/*===== Family Panel =====*/
/** One family's bundle: its header and its cards on one sunken panel, with the paper's grain on it. */
function FamilyPanel({ group, bigDog }: { group: FamilyGroup; bigDog: boolean }) {
  const headingId = `family-${group.family}`;
  const shape = panelShape(group.courses.length);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("overflow-hidden rounded-[2rem] border border-border bg-sunken paper-grain", shape.panel)}
    >
      <FamilyGroupHeader
        group={group}
        headingId={headingId}
        stageFrom={shape.stageFrom}
        // A lone one-course family has a wide stage to fill, and a four-course family a tall one.
        bigDog={(bigDog && group.courses.length === 1) || group.courses.length === 4}
      />
      <ul className={cn("grid content-start gap-3 p-3 sm:gap-4 sm:p-4 lg:p-5", shape.cards)}>
        {group.courses.map((course) => (
          <li key={course.slug}>
            <CourseCard course={course} showPrerequisites />
          </li>
        ))}
      </ul>
    </section>
  );
}
