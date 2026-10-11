import { cn } from "cn";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "~/components/ui/field";

/*===== Segmented Choice =====*/
/**
 * A short either-or question as one bar of segments (نر / ماده, بله / نه). Native radios underneath, so arrow keys,
 * the form library and screen readers all work as they do for any radio group.
 */
export function SegmentedChoice({
  legend,
  description,
  options,
  registration,
  error,
  className,
}: {
  legend: string;
  description?: string;
  options: readonly { value: string; label: string }[];
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
  className?: string;
}) {
  const errorId = `${registration.name}-error`;

  return (
    <fieldset
      className={cn("flex flex-col gap-2", className)}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      {description && <p className="-mt-1 mb-1 text-sm text-pretty text-muted-foreground">{description}</p>}

      <div
        className={cn(
          "grid auto-cols-fr grid-flow-col gap-1 rounded-xl border bg-sunken p-1",
          error ? "border-destructive/50" : "border-input/60",
        )}
      >
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input type="radio" value={option.value} className="peer sr-only" {...registration} />
            <span
              className={cn(
                "flex h-12 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-bold text-muted-foreground transition-colors",
                "peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm hover:text-foreground",
                "peer-checked:ring-1 peer-checked:ring-primary/40 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              )}
            >
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
