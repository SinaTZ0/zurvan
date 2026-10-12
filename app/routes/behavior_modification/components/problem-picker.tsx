import { cn } from "cn";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { BEHAVIOR_PROBLEM_CATEGORIES, BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";

/*===== Problem Picker =====*/
/** Part 2's first question: one problem category as a wrapping set of chips over native radios. «سایر» is last. */
export function ProblemPicker({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
}) {
  const errorId = `${registration.name}-error`;

  return (
    <div className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <div className="flex flex-wrap gap-2">
        {BEHAVIOR_PROBLEM_CATEGORIES.map((category) => (
          <label key={category} className="relative block">
            <input type="radio" value={category} className="peer sr-only" {...registration} />
            <span
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-full bg-card px-4 text-sm font-bold ring-1 ring-border transition-[box-shadow,background-color] duration-150",
                "peer-checked:bg-primary/10 peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:ring-primary/50",
              )}
            >
              {BEHAVIOR_PROBLEM_CATEGORY_LABELS[category]}
            </span>
          </label>
        ))}
      </div>
      <div id={errorId}>
        <FieldError errors={[error]} />
      </div>
    </div>
  );
}
