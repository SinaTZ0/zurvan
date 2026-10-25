import { CATALOGUE_COLUMN } from "~/routes/course_catalogue/layout";
import { CourseFamilyFilter } from "~/components/course-family-filter";
import { BRICK } from "~/lib/brick";
import type { CourseFamily } from "~/orpc/course/constants";

/*===== Family Shelf =====*/
/**
 * The wall the dog looks over: the family pills on a brick wall with the paper's grain, a light coping along its top
 * edge where his paws rest (as on the home hero's wall). On phones the pills scroll sideways inside it. Like a shop's
 * category bar, it sticks to the top of the screen while the courses scroll under it (the site header doesn't stick).
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
    <div
      style={{ backgroundImage: `var(--grain), ${BRICK}` }}
      className="sticky top-0 z-30 border-t-2 border-b border-t-foreground/60 border-b-border bg-inverse"
    >
      <div className={`${CATALOGUE_COLUMN} py-2.5 sm:py-4`}>
        {/* A little padding all round so the pills' focus rings aren't cut by the scroller's edges. */}
        <CourseFamilyFilter tabs={tabs} value={value} onChange={onChange} className="-mx-1 p-1" />
      </div>
    </div>
  );
}
