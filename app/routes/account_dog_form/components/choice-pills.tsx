import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "~/components/ui/field";

/*===== Choice Pills =====*/
/**
 * A short «pick one» question as a row of pills (نر / ماده, بله / نه), or «pick any» with `multiple` (the training
 * goals). Native radios (or checkboxes) underneath, so arrow keys, the form library and screen readers work as for any
 * radio group or set of checkboxes. The selected pill has a gold border, a tint and a
 * tick, so selection is never told by colour alone; the tick pops in when a pill is picked (`df-tick`, form-motion.tsx)
 * and an error rises in under the row.
 */
export function ChoicePills({
  legend,
  description,
  options,
  registration,
  error,
  multiple = false,
  className,
}: {
  legend: string;
  description?: string;
  /** Checkboxes instead of radios: several can be picked (the form gets an array). */
  multiple?: boolean;
  options: readonly { value: string; label: string }[];
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
  className?: string;
}) {
  const errorId = `${registration.name}-error`;
  const descriptionId = `${registration.name}-description`;
  const describedBy = [description && descriptionId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2", className)} aria-describedby={describedBy}>
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      {description && (
        <p id={descriptionId} className="-mt-1 mb-1 text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          // `group/pill` lets the tick follow the radio's checked state in CSS: a radio is only «checked» in the DOM,
          // so React state would lag behind the form library that owns the value.
          <label key={option.value} className="group/pill relative">
            <input
              type={multiple ? "checkbox" : "radio"}
              value={option.value}
              className="peer sr-only"
              {...registration}
            />
            <span
              className={cn(
                "flex h-11 cursor-pointer items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-bold text-muted-foreground transition-colors select-none",
                error ? "border-destructive/60" : "border-input/60",
                "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/50 hover:text-foreground",
                "motion-safe:transition-[transform,border-color,background-color,color] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
              )}
            >
              <CheckIcon
                aria-hidden
                className="df-tick hidden size-4 text-primary group-has-checked/pill:block"
                strokeWidth={3}
              />
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <div id={errorId}>
        {/* Keyed by the message, so a new one rises in again. */}
        <FieldError key={error?.message} errors={[error]} className="answer-in" />
      </div>
    </fieldset>
  );
}
