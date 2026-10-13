import { useFormContext, useController } from "react-hook-form";

import { Checkbox } from "~/components/ui/checkbox";
import { FieldError } from "~/components/ui/field";
import type { AdminCourse } from "~/orpc/course/contract";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import type { CourseFormInput } from "~/routes/admin_course_form/schema";

/*===== Prerequisites Section =====*/
/**
 * «پیش‌نیازها»: the other courses, in catalogue order, as checkboxes. A course that already requires this one is shown
 * but disabled: choosing it would make each wait for the other to be passed, and the API refuses that too.
 */
export function PrerequisitesSection({
  options,
  requiredBy,
}: {
  /** Every other course, archived ones included (a dog may still have to pass one). */
  options: AdminCourse[];
  /** Slugs of the courses that list this one as a prerequisite (none for a new course). */
  requiredBy: ReadonlySet<string>;
}) {
  const { control } = useFormContext<CourseFormInput>();
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name: "prerequisites" });
  const selected = value ?? [];

  return (
    <FormSection title="پیش‌نیازها">
      <p className="-mt-2 text-sm text-pretty text-muted-foreground">
        سگ باید این‌ها را تمام کرده باشد، یا خودت گذرانده علامتش زده باشی.
      </p>

      {/*------ Courses ------*/}
      <ul className="flex flex-col gap-2">
        {options.map((option) => {
          const blocked = requiredBy.has(option.slug);
          const checked = selected.includes(option.slug);
          const labelId = `prerequisite-${option.slug}`;

          return (
            <li key={option.slug}>
              <label
                className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  blocked
                    ? "border-border/60 text-muted-foreground"
                    : "cursor-pointer border-border hover:border-primary/50 has-data-checked:border-primary/60 has-data-checked:bg-primary/5"
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={blocked}
                  aria-labelledby={labelId}
                  onCheckedChange={(next) =>
                    onChange(next ? [...selected, option.slug] : selected.filter((slug) => slug !== option.slug))
                  }
                />
                <span id={labelId} className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-bold">{option.title}</span>
                  <bdi dir="ltr" className="text-xs text-muted-foreground">
                    {option.latinName}
                  </bdi>
                  {option.status === "archived" && (
                    <span className="rounded-full border border-border px-2 text-xs text-muted-foreground">
                      بایگانی
                    </span>
                  )}
                  {blocked && <span className="text-xs">این دوره را لازم دارد</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <FieldError errors={[error]} />
    </FormSection>
  );
}
