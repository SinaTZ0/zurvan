import { cn } from "cn";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { TRAINING_GOAL_LABELS, TRAINING_GOALS, type TrainingGoal } from "~/orpc/assessment/constants";

/*===== Goal Picker =====*/
const GOAL_LINES: Record<TrainingGoal, string> = {
  home: "یک همراه آرام و خوش‌اخلاق برای خانه.",
  sport: "چابکی و ورزش‌های سگی.",
  work: "نگهبانی و سگ‌های کاری.",
};

/** Part 2: what the dog is for, as three choice cards over native radios. */
export function GoalPicker({ registration, error }: { registration: UseFormRegisterReturn; error?: FormFieldError }) {
  const errorId = `${registration.name}-error`;

  return (
    <div className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <div className="grid gap-3 sm:grid-cols-3">
        {TRAINING_GOALS.map((goal) => (
          <label key={goal} className="relative block">
            <input type="radio" value={goal} className="peer sr-only" {...registration} />
            <span
              className={cn(
                "flex h-full cursor-pointer flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-border transition-shadow",
                "peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:ring-primary/50",
              )}
            >
              <span className="font-extrabold">{TRAINING_GOAL_LABELS[goal]}</span>
              <span className="text-sm text-pretty text-muted-foreground">{GOAL_LINES[goal]}</span>
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
