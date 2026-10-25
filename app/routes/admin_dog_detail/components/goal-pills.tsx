import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { Controller, type Control, type FieldError as FormFieldError } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { DOG_TRAINING_GOAL_LABELS, DOG_TRAINING_GOALS, type DogTrainingGoal } from "~/orpc/dog/constants";
import type { DogEditInput, DogEditValues } from "~/routes/admin_dog_detail/schema";

/*===== Goal Pills =====*/
/**
 * «هدف آموزش»: a dog can have several goals (a house dog that also does sport), so these are checkboxes drawn as the
 * same pills as `ChoicePills`, with the same gold border, tint and tick. The value is the list of picked goals, kept in
 * the order of `DOG_TRAINING_GOALS`; none picked is fine.
 */
export function GoalPills({
  control,
  error,
}: {
  control: Control<DogEditInput, unknown, DogEditValues>;
  error?: FormFieldError | { message?: string };
}) {
  return (
    <Controller
      control={control}
      name="trainingGoals"
      render={({ field }) => {
        const picked: DogTrainingGoal[] = field.value ?? [];
        const toggle = (goal: DogTrainingGoal, checked: boolean) =>
          field.onChange(DOG_TRAINING_GOALS.filter((item) => (item === goal ? checked : picked.includes(item))));

        return (
          <fieldset
            className="flex min-w-0 flex-col gap-2"
            aria-describedby={error ? "training-goals-error" : undefined}
          >
            <legend className="mb-2 text-sm font-bold">هدف آموزش</legend>

            <div className="flex flex-wrap gap-2">
              {DOG_TRAINING_GOALS.map((goal) => (
                <label key={goal} className="group/pill relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={picked.includes(goal)}
                    onChange={(event) => toggle(goal, event.target.checked)}
                    onBlur={field.onBlur}
                  />
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
                    {DOG_TRAINING_GOAL_LABELS[goal]}
                  </span>
                </label>
              ))}
            </div>

            <div id="training-goals-error">
              <FieldError errors={[error]} />
            </div>
          </fieldset>
        );
      }}
    />
  );
}
