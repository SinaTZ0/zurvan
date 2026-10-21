import { cn } from "cn";
import { ChevronLeftIcon } from "lucide-react";

import { CustomerContact } from "~/components/customer-contact";
import { DogEvaluationStamp, type DogEvaluationState } from "~/components/dog-evaluation-stamp";
import { Link } from "~/components/link";
import { describeDog } from "~/lib/dog-format";
import type { AdminDog } from "~/orpc/dog/contract";
import { DogPrint } from "~/routes/admin_dogs/components/dog-print";
import { PassedCourseChips } from "~/routes/admin_dogs/components/passed-course-chips";
import { REGISTER_COLUMNS, REGISTER_PADDING } from "~/routes/admin_dogs/components/register-columns";

/*===== Dog Row =====*/
/**
 * One line of the register, inside the plate. The dog's name carries a stretched link to Dog Detail, so the whole row
 * is one target; the owner's number sits above that link (`relative z-10`) so it stays a call.
 *
 * - **Below `xl`:** the print at the start (over two lines); the name with the stamp at the end, the facts under it at
 *   full width; then, lined up with the name, the owner (name and a 40px number link) and the chips on one line that
 *   wraps.
 * - **From `xl`:** one line in the register's fixed tracks (`REGISTER_COLUMNS`): dog, owner, courses, stamp, chevron.
 *
 * The two layouts share one tree: the wrappers that group things for one layout are `display: contents` in the other,
 * so their children drop straight into that layout's grid areas.
 *
 * `rise` is the row's delay when the list just changed under a filter, a search or a page (`null` otherwise, and on
 * load): it rises in with the shared `answer-in`.
 */
export function DogRow({ dog, state, rise }: { dog: AdminDog; state: DogEvaluationState; rise: number | null }) {
  return (
    <li
      className={cn(
        "group relative grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 py-3.5 transition-colors",
        "[grid-template-areas:'print_name_stamp'_'print_facts_facts'_'._more_more'] xl:py-3 xl:[grid-template-areas:'dog_who_chips_stamp_chev']",
        REGISTER_COLUMNS,
        REGISTER_PADDING,
        // The row lights the same way for the mouse and for the keyboard on its link.
        "hover:bg-foreground/[0.035] has-[[data-row-link]:focus-visible]:bg-foreground/[0.05] has-[[data-row-link]:focus-visible]:ring-2 has-[[data-row-link]:focus-visible]:ring-ring/60 has-[[data-row-link]:focus-visible]:ring-inset",
        rise !== null && "answer-in",
      )}
      style={rise !== null ? ({ "--answer-delay": `${rise}s` } as React.CSSProperties) : undefined}
    >
      {/*===== Face and Name =====*/}
      <div className="contents xl:flex xl:min-w-0 xl:items-center xl:gap-3 xl:[grid-area:dog]">
        <span className="self-start [grid-area:print] xl:self-auto">
          <DogPrint name={dog.name} photo={dog.photo} />
        </span>
        <div className="contents xl:block xl:min-w-0">
          <Link
            to={`/admin/dogs/${encodeURIComponent(dog.id)}`}
            data-row-link
            className="block min-w-0 self-center text-base leading-6 font-bold break-words outline-none [grid-area:name] after:absolute after:inset-0"
          >
            <bdi>{dog.name}</bdi>
          </Link>
          <p className="mt-0.5 min-w-0 self-start text-xs leading-5 text-pretty text-muted-foreground [grid-area:facts]">
            {dog.breed ? <bdi>{dog.breed}</bdi> : "نژاد ثبت نشده"}
            {"، "}
            {describeDog(dog)}
          </p>
        </div>
      </div>

      {/*===== Stamp and Chevron =====*/}
      <div className="flex items-center gap-2 self-center [grid-area:stamp] xl:contents">
        {/* One width for every stamp, so they read as a column down the register's edge. */}
        <DogEvaluationStamp state={state} className="min-w-[6.75rem] justify-center xl:[grid-area:stamp]" />
        <ChevronLeftIcon
          aria-hidden
          strokeWidth={1.7}
          className="hidden size-5 text-muted-foreground transition-[translate,color] duration-200 group-hover:-translate-x-0.5 group-hover:text-foreground group-has-[[data-row-link]:focus-visible]:-translate-x-0.5 group-has-[[data-row-link]:focus-visible]:text-foreground motion-reduce:transition-none md:block xl:[grid-area:chev]"
        />
      </div>

      {/*===== Owner and Courses =====*/}
      {/* Under the name on phones; two tracks of their own from `xl`. */}
      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 [grid-area:more] xl:contents">
        <div className="relative z-10 min-w-0 xl:[grid-area:who]">
          <CustomerContact
            name={dog.owner.name}
            phoneNumber={dog.owner.phoneNumber}
            className={cn(
              "flex-row items-center gap-2.5 xl:flex-col xl:items-start xl:gap-0.5",
              // Phones: the name is a quiet label before the number, and the number is a 40px target.
              "[&>span:first-child]:text-xs [&>span:first-child]:font-normal [&>span:first-child]:text-foreground/80 xl:[&>span:first-child]:text-sm xl:[&>span:first-child]:font-bold xl:[&>span:first-child]:text-foreground",
              "[&_a]:min-h-10 xl:[&_a]:min-h-6",
            )}
          />
        </div>
        <div className="min-w-0 xl:[grid-area:chips]">
          <PassedCourseChips courses={dog.passedCourses} />
        </div>
      </div>
    </li>
  );
}
