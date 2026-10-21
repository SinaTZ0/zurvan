import { cn } from "cn";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldMessage } from "~/routes/admin_course_form/components/field-parts";

/*===== Choice Pills =====*/
/**
 * A short «pick one» question as a row of pills (the course's family, where it is held), drawn like `AdminFilterPills`
 * so a choice looks the same as a filter across the Admin pages: the chosen one in flat gold, the others outlined in
 * ink. Native radios underneath, so arrow keys, the form library and screen readers work as for any radio group; the
 * look follows the radio's DOM `checked` state in CSS (`peer-checked`), since React state would lag behind the form
 * library that owns the value. Gold fill against an outline differs in lightness, not only in hue.
 */
export function ChoicePills({
  legend,
  options,
  registration,
  error,
}: {
  legend: string;
  options: readonly { value: string; label: string }[];
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
}) {
  const fieldId = `course-${registration.name}`;

  return (
    // `data-invalid` lets the form's «first field with a message» find the group (a radio takes no `aria-invalid`).
    <fieldset
      data-invalid={error ? true : undefined}
      className="flex min-w-0 flex-col gap-2"
      aria-describedby={error ? `${fieldId}-error` : undefined}
    >
      <legend className="mb-2 text-sm font-bold">{legend}</legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input type="radio" value={option.value} className="peer sr-only" {...registration} />
            <span
              className={cn(
                "flex h-10 cursor-pointer items-center rounded-full border bg-card px-4 text-sm font-bold text-muted-foreground select-none",
                "transition-[background-color,border-color,color] duration-300 ease-out motion-reduce:transition-none",
                error ? "border-destructive/60" : "border-foreground/15",
                "hover:border-foreground/30 hover:text-foreground",
                "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <FieldMessage id={fieldId} message={error?.message} />
    </fieldset>
  );
}
