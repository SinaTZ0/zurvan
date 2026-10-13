import { formatNumberFa } from "~/lib/digits";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

/*===== Courses Table =====*/
/**
 * How each course is doing: bought, in training, finished. No links: Enrollments has no per-course filter yet and the
 * Courses page is out of scope. Medium screens up get a real table; phones get one small card per course with the three
 * figures as `label: number` pairs, because three numeric columns don't fit beside a Persian course title.
 */
export function CoursesTable({ courses }: { courses: DashboardOverview["courses"] }) {
  if (courses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        هنوز دوره‌ای نیست
      </p>
    );
  }

  return (
    <>
      {/*===== Table (md and up) =====*/}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">هر دوره چند بار خریداری شده و چند تای آن در حال آموزش یا تمام شده است</caption>
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-start font-normal">
                دوره
              </th>
              <th scope="col" className="px-4 py-3 text-end font-normal">
                خریداری‌شده
              </th>
              <th scope="col" className="px-4 py-3 text-end font-normal">
                در حال آموزش
              </th>
              <th scope="col" className="px-4 py-3 text-end font-normal">
                تمام‌شده
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.slug}>
                <th scope="row" className="px-4 py-3 text-start font-bold">
                  {course.title}
                </th>
                <td className="px-4 py-3 text-end tabular-nums">{formatNumberFa(course.bought)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{formatNumberFa(course.active)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{formatNumberFa(course.completed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*===== Cards (phones) =====*/}
      <ul className="flex flex-col gap-3 md:hidden">
        {courses.map((course) => (
          <li key={course.slug} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-sm font-bold text-pretty">{course.title}</p>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <dt>خریداری‌شده:</dt>
                <dd className="font-bold text-foreground tabular-nums">{formatNumberFa(course.bought)}</dd>
              </div>
              <div className="flex gap-1">
                <dt>در حال آموزش:</dt>
                <dd className="font-bold text-foreground tabular-nums">{formatNumberFa(course.active)}</dd>
              </div>
              <div className="flex gap-1">
                <dt>تمام‌شده:</dt>
                <dd className="font-bold text-foreground tabular-nums">{formatNumberFa(course.completed)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
