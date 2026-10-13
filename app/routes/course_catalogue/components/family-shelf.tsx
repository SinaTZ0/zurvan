import { CourseFamilyFilter } from "~/components/course-family-filter";
import type { CourseFamily } from "~/orpc/course/constants";

/*===== Family Shelf =====*/
/**
 * The band the dog stands behind: the family pills between two hairlines on the sunken surface. On phones the pills
 * scroll sideways inside it.
 */
export function FamilyShelf({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { family: CourseFamily; label: string }[];
  value: CourseFamily | "all";
  onChange: (family: CourseFamily | "all") => void;
}) {
  return (
    <div className="border-y border-border bg-sunken">
      <div className="site-container py-4 sm:py-5">
        {/* A little padding all round so the pills' focus rings aren't cut by the scroller's edges. */}
        <CourseFamilyFilter tabs={tabs} value={value} onChange={onChange} className="-mx-1 p-1" />
      </div>
    </div>
  );
}
