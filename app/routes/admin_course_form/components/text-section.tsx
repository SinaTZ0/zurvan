import { cn } from "cn";
import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import { formatNumberFa } from "~/lib/digits";
import { COURSE_COMMANDS_MAX_LINES, COURSE_HIGHLIGHTS_MAX_LINES } from "~/orpc/course/validation";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, splitLines } from "~/routes/admin_course_form/schema";

/** «۳ از ۶ خط», red once over the limit, after the field's own hint. */
function lineCount({ count, max }: { count: number; max: number }) {
  return `${formatNumberFa(count)} از ${formatNumberFa(max)} خط`;
}

/*===== Text Section =====*/
/** «متن صفحه‌ی دوره»: the two lists the course page prints, one item per line, each with its line counter. */
export function TextSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const highlightCount = splitLines(useWatch({ control, name: "highlights" }) ?? "").length;
  const commandCount = splitLines(useWatch({ control, name: "commands" }) ?? "").length;

  return (
    <FormSection id="text" description="هر مورد یه خط؛ خط‌های خالی حساب نمی‌شن.">
      {/*------ Highlights ------*/}
      <Field data-invalid={!!errors.highlights} className="gap-2">
        <FieldLabel htmlFor="course-highlights">نتیجه‌ها</FieldLabel>
        <Textarea
          id="course-highlights"
          rows={4}
          className="min-h-28 text-sm"
          aria-invalid={!!errors.highlights}
          aria-describedby={describedBy({ id: "course-highlights", hint: true, error: !!errors.highlights })}
          {...register("highlights")}
        />
        <FieldHint id="course-highlights" className="flex flex-wrap justify-between gap-x-4">
          <span>چیزهایی که صاحب سگ می‌شناسه و می‌خواد حل بشه.</span>
          <span
            className={cn("tabular-nums", highlightCount > COURSE_HIGHLIGHTS_MAX_LINES && "font-bold text-destructive")}
          >
            {lineCount({ count: highlightCount, max: COURSE_HIGHLIGHTS_MAX_LINES })}
          </span>
        </FieldHint>
        <FieldMessage id="course-highlights" message={errors.highlights?.message} />
      </Field>

      {/*------ Commands ------*/}
      <Field data-invalid={!!errors.commands} className="gap-2">
        <FieldLabel htmlFor="course-commands">فرمان‌ها و سرفصل‌ها</FieldLabel>
        <Textarea
          id="course-commands"
          rows={12}
          className="min-h-72 text-sm"
          aria-invalid={!!errors.commands}
          aria-describedby={describedBy({ id: "course-commands", hint: true, error: !!errors.commands })}
          {...register("commands")}
        />
        <FieldHint id="course-commands" className="flex flex-wrap justify-between gap-x-4">
          <span>برای دوره‌های سگ کار و ورزشی، هر خط یه گرایشه و روی کارت هم میاد.</span>
          <span
            className={cn("tabular-nums", commandCount > COURSE_COMMANDS_MAX_LINES && "font-bold text-destructive")}
          >
            {lineCount({ count: commandCount, max: COURSE_COMMANDS_MAX_LINES })}
          </span>
        </FieldHint>
        <FieldMessage id="course-commands" message={errors.commands?.message} />
      </Field>
    </FormSection>
  );
}
