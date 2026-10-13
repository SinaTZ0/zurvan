import { CircleCheckIcon } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Dog } from "~/orpc/dog/contract";

/*===== Medals Rail =====*/
/**
 * The courses the dog has passed (F2), as small pills with a gold check. A course the Admin marked by hand (the dog was
 * trained before the site existed) says so, since the customer never saw it being bought. No medals, no rail.
 */
export function MedalsRail({ courses }: { courses: Dog["passedCourses"] }) {
  if (courses.length === 0) return null;

  return (
    <ul aria-label="دوره‌هایی که گذرانده" className="flex flex-wrap gap-2 border-t border-border pt-5">
      {courses.map((course) => (
        <li
          key={course.slug}
          className="inline-flex min-h-9 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 text-sm"
        >
          <CircleCheckIcon aria-hidden strokeWidth={1.75} className="size-4.5 shrink-0 text-primary" />
          <span className="font-bold">{course.title}</span>
          {course.source === "admin" && (
            <span className="text-xs text-muted-foreground">{HEAD_TRAINER.firstName} ثبت کرده</span>
          )}
        </li>
      ))}
    </ul>
  );
}
