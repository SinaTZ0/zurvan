import { LockIcon } from "lucide-react";

import { FieldDescription, FieldError } from "~/components/ui/field";
import { describeDogAge } from "~/lib/dog-format";
import { formatJalaliDate } from "~/lib/jalali";
import type { Dog } from "~/orpc/dog/contract";
import { LOCKED_FIELD_NOTE } from "~/routes/account_dog_form/schema";

/*===== Locked Birth Date =====*/
/**
 * The birth date as plain text, in place of `BirthDateField`, once the dog is evaluated (app-spec F2). It decides
 * which courses the dog is old enough for, so only the Admin can change it. The form still submits the stored date
 * (see `toDogInput`); `error` is the server's message if a change somehow got through, such as an evaluation that
 * landed while the form was open.
 */
export function LockedBirthDate({
  dog,
  error,
}: {
  dog: Pick<Dog, "birthDate" | "birthDateApproximate">;
  error?: { message?: string };
}) {
  return (
    <fieldset aria-describedby="dog-birth-locked-note" className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">تاریخ تولد</legend>

      {/*------ Value ------*/}
      <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-input/60 bg-sunken px-4 py-2">
        <div className="flex flex-col">
          <span className="font-medium">
            {formatJalaliDate(dog.birthDate)}
            {dog.birthDateApproximate && " (تقریبی)"}
          </span>
          <span className="text-sm text-muted-foreground">{describeDogAge(dog)}</span>
        </div>
        <LockIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <FieldDescription id="dog-birth-locked-note">{LOCKED_FIELD_NOTE}</FieldDescription>
      <FieldError errors={[error]} />
    </fieldset>
  );
}
