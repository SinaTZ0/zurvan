import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { COURSE_PLACE_LABELS, COURSE_PLACES } from "~/orpc/course/constants";
import { formatNumberFa } from "~/lib/digits";
import { ChoicePills } from "~/routes/admin_course_form/components/choice-pills";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, NO_PLACE, parseWholeNumber } from "~/routes/admin_course_form/schema";

/*===== Constants =====*/
const PLACE_OPTIONS = [
  ...COURSE_PLACES.map((place) => ({ value: place, label: COURSE_PLACE_LABELS[place] })),
  { value: NO_PLACE, label: "بعد از ارزیابی" },
];

/** «حدود ۲ سال» under an age typed in months, so 24 is read as two years at a glance. */
function describeYears(months: number | null): string | null {
  if (months === null) return null;
  if (months < 12) return "کمتر از یک سال";
  return `حدود ${formatNumberFa(Math.round((months / 12) * 10) / 10)} سال`;
}

/*===== Age Section =====*/
/** «سن و جلسه‌ها»: the age range in months (empty means no limit), the number of sessions and where they are held. */
export function AgeSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const minYears = describeYears(parseWholeNumber(useWatch({ control, name: "minAgeMonths" }) ?? ""));
  const maxYears = describeYears(parseWholeNumber(useWatch({ control, name: "maxAgeMonths" }) ?? ""));

  return (
    <FormSection title="سن و جلسه‌ها">
      {/*------ Ages ------*/}
      <div className="grid grid-cols-2 gap-3">
        <Field data-invalid={!!errors.minAgeMonths}>
          <FieldLabel htmlFor="course-min-age">حداقل سن (ماه)</FieldLabel>
          <Input
            id="course-min-age"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.minAgeMonths}
            {...register("minAgeMonths")}
          />
          {minYears && <FieldDescription>{minYears}</FieldDescription>}
          <FieldError errors={[errors.minAgeMonths]} />
        </Field>
        <Field data-invalid={!!errors.maxAgeMonths}>
          <FieldLabel htmlFor="course-max-age">حداکثر سن (ماه)</FieldLabel>
          <Input
            id="course-max-age"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.maxAgeMonths}
            {...register("maxAgeMonths")}
          />
          {maxYears && <FieldDescription>{maxYears}</FieldDescription>}
          <FieldError errors={[errors.maxAgeMonths]} />
        </Field>
      </div>

      {/*------ Sessions ------*/}
      <Field data-invalid={!!errors.sessionCount} className="max-w-sm">
        <FieldLabel htmlFor="course-sessions">تعداد جلسه‌ها</FieldLabel>
        <Input
          id="course-sessions"
          inputMode="numeric"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.sessionCount}
          {...register("sessionCount")}
        />
        <FieldDescription>حدوداً؛ جلسه‌ها در برنامه دنبال نمی‌شوند.</FieldDescription>
        <FieldError errors={[errors.sessionCount]} />
      </Field>

      {/*------ Place ------*/}
      <ChoicePills
        legend="کجا برگزار می‌شود"
        options={PLACE_OPTIONS}
        registration={register("place")}
        error={errors.place}
      />
    </FormSection>
  );
}
