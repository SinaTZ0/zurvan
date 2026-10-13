import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "~/components/ui/field";

/*===== Choice Pills =====*/
/**
 * A short «pick one» question as a row of pills (the course's family, where it is held). Native radios underneath, so
 * arrow keys, the form library and screen readers work as for any radio group. The selected pill has a gold border, a
 * tint and a tick, so selection is never told by colour alone.
 */
export function ChoicePills({
  legend,
  description,
  options,
  registration,
  error,
}: {
  legend: string;
  description?: string;
  options: readonly { value: string; label: string }[];
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
}) {
  const errorId = `${registration.name}-error`;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      {description && <p className="-mt-1 mb-1 text-sm text-pretty text-muted-foreground">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          // `group/pill` lets the tick follow the radio's checked state in CSS: a radio is only «checked» in the DOM,
          // so React state would lag behind the form library that owns the value.
          <label key={option.value} className="group/pill relative">
            <input type="radio" value={option.value} className="peer sr-only" {...registration} />
            <span
              className={cn(
                "flex h-10 cursor-pointer items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-bold text-muted-foreground transition-colors select-none",
                error ? "border-destructive/60" : "border-input/60",
                "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/50 hover:text-foreground",
              )}
            >
              <CheckIcon
                aria-hidden
                className="hidden size-4 text-primary group-has-checked/pill:block"
                strokeWidth={3}
              />
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <div id={errorId}>
        <FieldError errors={[error]} />
      </div>
    </fieldset>
  );
}
