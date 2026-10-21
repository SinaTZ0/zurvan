import { cn } from "cn";

import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

import { PopNumber } from "./pop-number";
import { ShareBar } from "./share-bar";

type Course = DashboardOverview["courses"][number];

/*===== Courses Plate =====*/
/**
 * «دوره‌ها»: how each course is doing, in catalogue order: bought, in training, finished, and a thin bar of bought split
 * into those shades (the cancelled rest faint). The bars share one scale, the busiest course, so the live courses read
 * at a glance; a course nobody has bought is dimmed. No links: Enrollments has no per-course filter.
 *
 * From `md` a real table; on phones one compact row per course, the title and the bar on one line and the three
 * numbers under them, because three numeric columns don't fit beside a Persian title.
 */
export function CoursesPlate({ courses }: { courses: DashboardOverview["courses"] }) {
  if (courses.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-foreground/20 paper-grain px-5 py-10 text-center text-sm text-muted-foreground">
        هنوز دوره‌ای نیست
      </p>
    );
  }

  const scale = Math.max(1, ...courses.map((course) => course.bought));

  return (
    <div className={cn(ADMIN_PLATE, "overflow-hidden")}>
      {/*===== Table (md and up) =====*/}
      <table className="hidden w-full table-fixed text-sm md:table">
        <caption className="sr-only">هر دوره چند بار خریده شده و چندتاش در حال آموزش یا تمام شده</caption>
        <colgroup>
          <col className="w-[15rem] lg:w-[17rem]" />
          <col />
          <col className="w-24" />
          <col className="w-28" />
          <col className="w-24" />
        </colgroup>
        <thead>
          <tr className={cn("border-b text-xs text-muted-foreground", ADMIN_HAIRLINE)}>
            <th scope="col" className="py-3 ps-6 pe-4 text-start font-normal">
              دوره
            </th>
            <td aria-hidden />
            <th scope="col" className="px-4 py-3 text-end font-normal">
              خرید
            </th>
            <th scope="col" className="px-4 py-3 text-end font-normal">
              در حال آموزش
            </th>
            <th scope="col" className="py-3 ps-4 pe-6 text-end font-normal">
              تمام‌شده
            </th>
          </tr>
        </thead>
        <tbody className={cn("divide-y", ADMIN_HAIRLINE)}>
          {courses.map((course) => {
            const idle = course.bought === 0;
            return (
              <tr key={course.slug} className={cn(idle && "text-muted-foreground")}>
                <th scope="row" className={cn("py-3 ps-6 pe-4 text-start", idle ? "font-normal" : "font-bold")}>
                  {course.title}
                </th>
                <td className="px-4 py-3">
                  <CourseBar course={course} scale={scale} />
                </td>
                <NumberCell value={course.bought} />
                <NumberCell value={course.active} />
                <NumberCell value={course.completed} last />
              </tr>
            );
          })}
        </tbody>
      </table>

      {/*===== Rows (phones) =====*/}
      <ul className={cn("divide-y md:hidden", ADMIN_HAIRLINE)}>
        {courses.map((course) => {
          const idle = course.bought === 0;
          return (
            <li key={course.slug} className={cn("px-5 py-3", idle && "text-muted-foreground")}>
              <div className="flex items-center gap-4">
                <p className={cn("min-w-0 flex-1 text-sm text-pretty", !idle && "font-bold")}>{course.title}</p>
                <div className="w-20 shrink-0">
                  <CourseBar course={course} scale={scale} />
                </div>
              </div>
              <dl className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                <PhoneFigure label="خرید" value={course.bought} idle={idle} />
                <PhoneFigure label="در حال آموزش" value={course.active} idle={idle} />
                <PhoneFigure label="تمام‌شده" value={course.completed} idle={idle} />
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/*===== Course Bar =====*/
function CourseBar({ course, scale }: { course: Course; scale: number }) {
  return (
    <ShareBar active={course.active} completed={course.completed} total={course.bought} scale={scale} variant="thin" />
  );
}

/*===== Number Cell =====*/
function NumberCell({ value, last = false }: { value: number; last?: boolean }) {
  return (
    <td className={cn("py-3 text-end tabular-nums", last ? "ps-4 pe-6" : "px-4")}>
      <PopNumber value={value} />
    </td>
  );
}

/*===== Phone Figure =====*/
function PhoneFigure({ label, value, idle }: { label: string; value: number; idle: boolean }) {
  return (
    <div className="flex gap-1">
      <dt>{label}</dt>
      <dd className={cn("tabular-nums", !idle && "font-bold text-foreground")}>
        <PopNumber value={value} />
      </dd>
    </div>
  );
}
