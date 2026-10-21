import { cn } from "cn";
import { LockIcon } from "lucide-react";
import { useController, useFormContext } from "react-hook-form";

import { Checkbox } from "~/components/ui/checkbox";
import { ADMIN_HAIRLINE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import type { AdminCourse } from "~/orpc/course/contract";
import { COURSE_MAX_PREREQUISITES } from "~/orpc/course/validation";
import { FieldMessage } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import type { CourseFormInput } from "~/routes/admin_course_form/schema";

/*===== Prerequisites Section =====*/
/**
 * «پیش‌نیازها»: the other courses, in catalogue order, as rows on the plate split by ink hairlines, each a checkbox,
 * the title and the Latin name. A course that already requires this one is shown but locked, with the reason:
 * choosing it would make each wait for the other to be passed, and the API refuses that too. A ticked row is never
 * gold-bordered; the checkbox says it.
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
    field: { value, onChange, ref },
    fieldState: { error },
  } = useController({ control, name: "prerequisites" });
  const selected = value ?? [];

  return (
    <FormSection
      id="prerequisites"
      description={`سگ باید این‌ها رو تموم کرده باشه، یا خودت گذرونده علامتش زده باشی. حداکثر ${formatNumberFa(COURSE_MAX_PREREQUISITES)} تا.`}
    >
      <FieldMessage id="course-prerequisites" message={error?.message} />

      {/*------ Courses ------*/}
      {/* The rows run to the plate's edges, so the hairlines read as the plate's own lines. */}
      <ul className={cn("-mx-5 -mb-5 divide-y border-t sm:-mx-6 sm:-mb-6", ADMIN_HAIRLINE)}>
        {options.map((option, index) => {
          const blocked = requiredBy.has(option.slug);
          const checked = selected.includes(option.slug);
          const labelId = `prerequisite-${option.slug}`;

          return (
            <li key={option.slug}>
              <label
                className={cn(
                  "flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm sm:flex-nowrap sm:px-6",
                  index === options.length - 1 && "rounded-b-3xl",
                  blocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-foreground/[0.03]",
                )}
              >
                <Checkbox
                  // The first box takes the field's ref, so a message on the list focuses the list.
                  ref={index === 0 ? ref : undefined}
                  checked={checked}
                  disabled={blocked}
                  aria-labelledby={labelId}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    [blocked && `${labelId}-reason`, error && "course-prerequisites-error"].filter(Boolean).join(" ") ||
                    undefined
                  }
                  onCheckedChange={(next) =>
                    onChange(next ? [...selected, option.slug] : selected.filter((slug) => slug !== option.slug))
                  }
                />
                <span
                  id={labelId}
                  className={cn(
                    "flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5",
                    blocked && "text-muted-foreground",
                  )}
                >
                  <span className={cn("font-bold", !blocked && "text-foreground")}>{option.title}</span>
                  <bdi dir="ltr" className="text-xs text-muted-foreground">
                    {option.latinName}
                  </bdi>
                  {option.status === "archived" && (
                    <span className="rounded-full border border-dashed border-foreground/20 px-2 text-xs text-muted-foreground">
                      بایگانی‌شده
                    </span>
                  )}
                </span>
                {blocked && (
                  <span
                    id={`${labelId}-reason`}
                    className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground max-sm:basis-full max-sm:ps-7"
                  >
                    <LockIcon aria-hidden strokeWidth={1.8} className="size-3.5" />
                    خودش این دوره رو لازم داره
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </FormSection>
  );
}
