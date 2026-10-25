import { XIcon } from "lucide-react";
import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { m } from "~/paraglide/messages";
import { DateParts } from "~/routes/account_dog_form/components/date-parts";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

/*===== Implant Date Field =====*/
/**
 * The day the microchip was implanted, optional: three selects like the birth date's, and «پاک کردن» once any part is
 * picked, since a select can't go back to empty on its own when the owner changes their mind.
 */
export function ImplantDateField() {
  const errorId = useId();
  const {
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<DogFormInput, unknown, DogFormValues>();
  const parts = useWatch({ control, name: ["implantDay", "implantMonth", "implantYear"] });
  const picked = parts.some(Boolean);
  const error = errors.implantDay;

  const clear = () => {
    for (const name of ["implantDay", "implantMonth", "implantYear"] as const) {
      setValue(name, "", { shouldDirty: true });
    }
    clearErrors("implantDay");
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">
        {m.account_dog_form_field_implant()}{" "}
        <span className="font-medium text-muted-foreground">{m.account_dog_form_optional()}</span>
      </legend>
      <DateParts
        fields={{ day: "implantDay", month: "implantMonth", year: "implantYear" }}
        invalid={!!error}
        describedBy={error ? errorId : undefined}
      />
      {/* The error at the start, «پاک کردن» at the end of the same row; the selects can't go back to empty alone. */}
      <div className="flex items-start justify-between gap-3">
        <div id={errorId} className="min-w-0">
          <FieldError key={error?.message} errors={[error]} className="answer-in" />
        </div>
        {picked && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="answer-in ms-auto shrink-0 text-muted-foreground"
            onClick={clear}
          >
            <XIcon aria-hidden />
            {m.account_dog_form_implant_clear()}
          </Button>
        )}
      </div>
    </fieldset>
  );
}
