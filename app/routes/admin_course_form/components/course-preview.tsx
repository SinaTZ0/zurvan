import { useId } from "react";

import { CourseCard } from "~/components/course-card";
import type { Course } from "~/orpc/course/contract";

/*===== Course Preview =====*/
/**
 * «کارتش در فهرست»: the real `CourseCard` the catalogue renders, fed what is typed, so what he sees is what customers
 * will see by construction. It is inert: the card's link leads to a page that may not exist yet, and nothing here
 * writes.
 */
export function CoursePreview({ course }: { course: Course }) {
  const headingId = useId();

  return (
    <aside aria-labelledby={headingId} className="min-w-0">
      <h2 id={headingId} className="mb-3 font-sans text-lg font-extrabold">
        کارتش در فهرست
      </h2>
      <div inert>
        <CourseCard course={course} showPrerequisites />
      </div>
    </aside>
  );
}
