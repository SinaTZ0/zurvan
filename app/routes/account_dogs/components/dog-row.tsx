import { CheckIcon, ChevronLeftIcon, CircleDashedIcon } from "lucide-react";

import { DogTag } from "~/components/dog-tag";
import { Link } from "~/components/link";
import { MediaImage } from "~/components/media-image";
import { buttonVariants } from "~/components/ui/button";
import { describeDog } from "~/lib/dog-format";
import { formatSlotDay } from "~/lib/tehran-time";
import type { Assessment } from "~/orpc/assessment/contract";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Row =====*/
/**
 * One dog as a ledger row: its mark, its name and facts, whether it has a record, and its next step.
 *
 * The whole row opens the dog's page through a stretched link: the name's link covers the row with a pseudo-element,
 * and the next-step link sits above it, so there is no link inside a link and both are separate targets.
 *
 * Desktop lines the columns up across rows (identity, record mark, next step, chevron). On a phone the row stacks:
 * the identity on top, the record mark and the next step on one line beneath.
 */
export function DogRow({ dog, booked }: { dog: Dog; booked: Assessment | null }) {
  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-primary/5 md:min-h-22 md:grid-cols-[minmax(0,1fr)_8.5rem_11.5rem_1.25rem] md:gap-x-4 md:px-5 md:py-3 lg:grid-cols-[minmax(0,1fr)_9.5rem_13rem_1.25rem] lg:gap-x-6 lg:px-6">
      {/*------ Mark, Name and Facts ------*/}
      <div className="col-span-2 row-start-1 flex min-w-0 items-center gap-4 max-md:pe-8 md:col-span-1">
        <div className="flex size-16 shrink-0 items-center justify-center">
          {dog.photo ? (
            <MediaImage media={dog.photo} variant="thumb" alt="" className="size-16 rounded-2xl" />
          ) : (
            <DogTag name={dog.name} size="sm" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-pretty">
            <Link
              to={`/account/dogs/${dog.id}`}
              // The pseudo-element is what stretches the link over the row, so the focus ring goes on it too.
              className="font-bold outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
            >
              {dog.name}
            </Link>
          </p>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {[dog.breed, describeDog(dog)].filter(Boolean).join("، ")}
          </p>
        </div>
      </div>

      {/*------ Chevron ------*/}
      {/* Points the way a page opens in RTL (toward the start) and nudges there on hover. On a phone it is pinned to the
          first line's end, so the next step below can size itself freely. */}
      <ChevronLeftIcon
        aria-hidden
        className="absolute end-4 top-[2.375rem] size-5 text-muted-foreground transition-transform motion-safe:group-hover:-translate-x-1 md:static md:col-start-4"
      />

      {/*------ Record Mark ------*/}
      <p
        className={
          dog.hasRecord
            ? "row-start-2 flex items-center gap-1.5 text-sm font-bold text-primary md:col-start-2 md:row-start-1"
            : "row-start-2 flex items-center gap-1.5 text-sm text-muted-foreground md:col-start-2 md:row-start-1"
        }
      >
        {dog.hasRecord ? (
          <CheckIcon aria-hidden strokeWidth={2.4} className="size-4 shrink-0" />
        ) : (
          <CircleDashedIcon aria-hidden className="size-4 shrink-0" />
        )}
        {dog.hasRecord ? "پرونده دارد" : "هنوز ارزیابی نشده"}
      </p>

      {/*------ Next Step ------*/}
      {/* Later states (next session, a plan to pay) take over this slot. A booked assessment leaves nothing to do, so
          the slot shows when, and still leads to the page where it can be cancelled. */}
      {booked ? (
        <Link
          to="/account/assessments"
          className={buttonVariants({
            variant: "ghost",
            className: "relative z-10 col-start-2 row-start-2 justify-self-end md:col-start-3 md:row-start-1",
          })}
        >
          ارزیابی: {formatSlotDay(booked.startsAt)}
          <span className="sr-only"> برای {dog.name}</span>
        </Link>
      ) : (
        <Link
          to={dog.hasRecord ? "/courses" : `/assessment?dog=${dog.id}`}
          className={buttonVariants({
            variant: "ghost",
            className:
              "relative z-10 col-start-2 row-start-2 justify-self-end text-primary hover:text-primary md:col-start-3 md:row-start-1",
          })}
        >
          {dog.hasRecord ? "رزرو دوره‌ی بعدی" : "ارزیابی رایگان رزرو کن"}
          <span className="sr-only"> برای {dog.name}</span>
        </Link>
      )}
    </li>
  );
}
