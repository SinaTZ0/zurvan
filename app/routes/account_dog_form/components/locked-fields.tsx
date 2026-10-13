import { LockIcon } from "lucide-react";
import { useId } from "react";

import { FieldError } from "~/components/ui/field";
import { describeDogAge } from "~/lib/dog-format";
import { formatJalaliDate } from "~/lib/jalali";
import type { Dog } from "~/orpc/dog/contract";
import { LOCKED_FIELD_NOTE } from "~/routes/account_dog_form/schema";

/*===== Locked Fields =====*/
/**
 * The breed and the birth date as two engraved plates, in place of their inputs, once the dog is evaluated (app-spec
 * F2): they decide which courses the dog fits, so only the Admin changes them. One note under both says why.
 *
 * Nothing is editable here and nothing needs to be registered: the form submits the stored values (see `toDogInput`).
 * `breedError` and `birthError` are the server's messages if a change somehow got through, such as an evaluation that
 * landed while the form was open.
 */
export function LockedFields({
  dog,
  breedError,
  birthError,
}: {
  dog: Pick<Dog, "breed" | "birthDate" | "birthDateApproximate">;
  breedError?: { message?: string };
  birthError?: { message?: string };
}) {
  const noteId = useId();

  return (
    <div className="flex flex-col gap-4">
      {/*------ Breed ------*/}
      <Plate label="نژاد" noteId={noteId} error={breedError}>
        {dog.breed ? (
          <span className="font-medium">{dog.breed}</span>
        ) : (
          <span className="text-muted-foreground">ثبت نشده</span>
        )}
      </Plate>

      {/*------ Birth Date ------*/}
      <Plate label="تاریخ تولد" noteId={noteId} error={birthError}>
        <span className="font-medium">
          {formatJalaliDate(dog.birthDate)}
          {dog.birthDateApproximate && " (تقریبی)"}
        </span>
        <span className="text-sm text-muted-foreground">{describeDogAge(dog)}</span>
      </Plate>

      {/*------ Shared Note ------*/}
      <p id={noteId} className="-mt-2 text-sm text-pretty text-muted-foreground">
        {LOCKED_FIELD_NOTE}
      </p>
    </div>
  );
}

/*===== Plate =====*/
/** One engraved read-only value with its visible label above it and the shared note as its description. */
function Plate({
  label,
  noteId,
  error,
  children,
}: {
  label: string;
  noteId: string;
  error?: { message?: string };
  children: React.ReactNode;
}) {
  return (
    // A fieldset names the plate by its legend and carries the shared note as its description.
    <fieldset aria-describedby={noteId} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-primary/25 bg-sunken px-4 py-2">
        <div className="flex flex-col">{children}</div>
        <LockIcon aria-hidden className="size-4 shrink-0 text-primary" />
      </div>
      <FieldError errors={[error]} />
    </fieldset>
  );
}
