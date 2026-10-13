import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import { formatNumberFa } from "~/lib/digits";
import { COURSE_COMMANDS_MAX_LINES, COURSE_HIGHLIGHTS_MAX_LINES } from "~/orpc/course/validation";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, splitLines } from "~/routes/admin_course_form/schema";

/** «۳ از ۶ خط», red once over the limit. */
function LineCounter({ count, max }: { count: number; max: number }) {
  return (
    <p className={count > max ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      {formatNumberFa(count)} از {formatNumberFa(max)} خط
    </p>
  );
}

/*===== Text Section =====*/
/** «متن صفحه‌ی دوره»: the two lists the course page prints, one item per line. */
export function TextSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const highlightCount = splitLines(useWatch({ control, name: "highlights" }) ?? "").length;
  const commandCount = splitLines(useWatch({ control, name: "commands" }) ?? "").length;

  return (
    <FormSection title="متن صفحه‌ی دوره">
      {/*------ Highlights ------*/}
      <Field data-invalid={!!errors.highlights}>
        <FieldLabel htmlFor="course-highlights">نتیجه‌ها</FieldLabel>
        <Textarea
          id="course-highlights"
          rows={4}
          className="min-h-28 text-sm"
          aria-invalid={!!errors.highlights}
          {...register("highlights")}
        />
        <FieldDescription>چیزهایی که صاحب سگ می‌شناسد و می‌خواهد حل شود.</FieldDescription>
        <LineCounter count={highlightCount} max={COURSE_HIGHLIGHTS_MAX_LINES} />
        <FieldError errors={[errors.highlights]} />
      </Field>

      {/*------ Commands ------*/}
      <Field data-invalid={!!errors.commands}>
        <FieldLabel htmlFor="course-commands">فرمان‌ها و سرفصل‌ها</FieldLabel>
        <Textarea
          id="course-commands"
          rows={12}
          className="min-h-72 text-sm"
          aria-invalid={!!errors.commands}
          {...register("commands")}
        />
        <LineCounter count={commandCount} max={COURSE_COMMANDS_MAX_LINES} />
        <FieldError errors={[errors.commands]} />
      </Field>
    </FormSection>
  );
}
