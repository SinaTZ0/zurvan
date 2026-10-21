import { cn } from "cn";

import { CustomerContact } from "~/components/customer-contact";
import { DogEvaluationStamp, type DogEvaluationState } from "~/components/dog-evaluation-stamp";
import { DogPhoto } from "~/components/dog-photo";
import { ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminDog } from "~/orpc/dog/contract";
import { useHasChanged } from "~/routes/admin_dog_detail/hooks/use-has-changed";

/*===== Identity Panel =====*/
/**
 * Who the dog is, on one plate: its photo as a print (inset in the plate with an ink edge; the engraved tag when it has
 * none, which is 192px tall, so every box here keeps that height), the evaluation stamp and the day it was added, then
 * its owner one call away under the slip's tear. The Admin can't change the photo; it is the owner's upload.
 *
 * - Phones: stacked, the photo a 16:10 print, the call pill across the plate.
 * - `md` to `xl` (one column): the print at the start, a square, with the owner beside it.
 * - From `xl` (the start column): stacked again, the print 4:3.
 *
 * When the dog is evaluated on this page, the new stamp lands (`dd-stamp-late`, after the dialog fades).
 */
export function IdentityPanel({ dog, state }: { dog: AdminDog; state: DogEvaluationState }) {
  const stamped = useHasChanged(state);

  return (
    <section
      aria-label="سگ و صاحبش"
      className={cn(ADMIN_PLATE, "flex flex-col gap-4 p-3 md:grid md:grid-cols-[15rem_minmax(0,1fr)] md:gap-5 xl:flex")}
    >
      {/*------ Print ------*/}
      <DogPhoto
        name={dog.name}
        photo={dog.photo}
        microchipNumber={dog.microchipNumber}
        variant="card"
        priority
        className="aspect-[16/10] w-full rounded-2xl bg-background shadow-[0_10px_24px_-18px_rgb(0_0_0/0.9)] ring-1 ring-foreground/10 md:aspect-square xl:aspect-[4/3]"
      />

      <div className="flex min-w-0 flex-col gap-4 px-1 pb-1 md:justify-center md:py-2 xl:p-0 xl:px-1 xl:pb-1">
        {/*------ Stamp ------*/}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <span key={state} className={cn("inline-flex", stamped && "dd-stamp-late")}>
            <DogEvaluationStamp state={state} />
          </span>
          <p className="text-xs text-muted-foreground">ثبت‌شده در {formatJalaliTimestamp(dog.createdAt)}</p>
        </div>

        {/*------ Owner ------*/}
        <div className={cn("border-t pt-4", ADMIN_TEAR)}>
          <p className="mb-1 text-xs text-muted-foreground">صاحبش</p>
          <CustomerContact
            name={dog.owner.name}
            phoneNumber={dog.owner.phoneNumber}
            variant="call"
            className="[&>span:first-child]:text-base"
            callClassName="h-12 w-full justify-center text-lg"
          />
        </div>
      </div>
    </section>
  );
}
