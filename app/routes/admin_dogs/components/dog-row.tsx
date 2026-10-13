import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";

import { CustomerContact } from "~/components/customer-contact";
import { DogEvaluationStamp, type DogEvaluationState } from "~/components/dog-evaluation-stamp";
import { DogThumb } from "~/components/dog-thumb";
import { Link } from "~/components/link";
import { describeDog } from "~/lib/dog-format";
import type { AdminDog } from "~/orpc/dog/contract";
import { PassedCourseChips } from "~/routes/admin_dogs/components/passed-course-chips";

/*===== Dog Row =====*/
/**
 * One dog in the register. The dog's name is a stretched link to Dog Detail, so the whole card is one target. The owner's
 * phone sits above that link (`relative z-10`) so it stays tappable.
 *
 * Phones get a stacked card: the face, the name and the stamp, then the owner (with a 40px phone target) and the
 * chips. From `lg` it is one line, in the grid's order: dog, owner, courses, stamp.
 */
export function DogRow({ dog, state }: { dog: AdminDog; state: DogEvaluationState }) {
  return (
    <li
      className={cn(
        "group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        "[grid-template-areas:'dog_stamp'_'who_who'_'chips_chips']",
        "lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,4fr)_auto] lg:items-center lg:[grid-template-areas:'dog_who_chips_stamp']",
      )}
    >
      {/*===== Face and Name =====*/}
      <div className="flex min-w-0 items-center gap-3 [grid-area:dog]">
        <DogThumb name={dog.name} photo={dog.photo} className="size-12" />
        <div className="min-w-0">
          <Link
            to={`/admin/dogs/${encodeURIComponent(dog.id)}`}
            className="rounded-sm font-bold break-words outline-none after:absolute after:inset-0 after:rounded-2xl"
          >
            <bdi>{dog.name}</bdi>
          </Link>
          <p className="text-sm text-muted-foreground">{dog.breed ? <bdi>{dog.breed}</bdi> : "نژاد ثبت نشده"}</p>
          <p className="text-xs text-muted-foreground">{describeDog(dog)}</p>
        </div>
      </div>

      {/*===== Stamp =====*/}
      <div className="flex items-center gap-3 [grid-area:stamp]">
        <DogEvaluationStamp state={state} />
        <ChevronLeftIcon
          aria-hidden
          strokeWidth={1.7}
          className="hidden size-5 text-muted-foreground transition-colors group-hover:text-foreground lg:block"
        />
      </div>

      {/*===== Owner =====*/}
      {/* The phone link is 40px tall on phones; the row's name link is the target everywhere else. */}
      <div className="relative z-10 border-t border-border pt-3 [grid-area:who] lg:border-0 lg:pt-0 [&_a]:min-h-10 lg:[&_a]:min-h-0">
        <CustomerContact name={dog.owner.name} phoneNumber={dog.owner.phoneNumber} />
      </div>

      {/*===== Passed Courses =====*/}
      <div className="min-w-0 [grid-area:chips]">
        <PassedCourseChips courses={dog.passedCourses} />
      </div>
    </li>
  );
}
