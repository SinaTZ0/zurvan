import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { formatNumberFa } from "~/lib/digits";
import { COURSE_PLACE_LABELS, COURSE_PLACES } from "~/orpc/course/constants";
import { ChoicePills } from "~/routes/admin_course_form/components/choice-pills";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, NO_PLACE, parseWholeNumber } from "~/routes/admin_course_form/schema";

/*===== Constants =====*/
const PLACE_OPTIONS = [
  ...COURSE_PLACES.map((place) => ({ value: place, label: COURSE_PLACE_LABELS[place] })),
  { value: NO_PLACE, label: "بعد از ارزیابی" },
];

/**
 * An age typed in months, said in years under the field («۲ سال و ۶ ماه»), so 30 is read as two and a half years at a
 * glance. An empty field means no limit, and says so.
 */
function describeMonths(months: number | null): string {
  if (months === null) return "خالی یعنی بدون محدودیت";
  if (months < 12) return "کمتر از یه سال";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${formatNumberFa(years)} سال` : `${formatNumberFa(years)} سال و ${formatNumberFa(rest)} ماه`;
}

/*===== Age Section =====*/
/** «سن و جلسه‌ها»: the age range in months (empty means no limit), the number of sessions and where they are held. */
export function AgeSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const minText = useWatch({ control, name: "minAgeMonths" }) ?? "";
  const maxText = useWatch({ control, name: "maxAgeMonths" }) ?? "";
  // Text that isn't a number yet says nothing; the message on submit says why.
  const minWords =
    minText.trim() && parseWholeNumber(minText) === null ? null : describeMonths(parseWholeNumber(minText));
  const maxWords =
    maxText.trim() && parseWholeNumber(maxText) === null ? null : describeMonths(parseWholeNumber(maxText));

  return (
    <FormSection id="ages">
      {/*------ Ages and Sessions ------*/}
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4">
        <Field data-invalid={!!errors.minAgeMonths} className="gap-2">
          <FieldLabel htmlFor="course-minAgeMonths">حداقل سن (ماه)</FieldLabel>
          <Input
            id="course-minAgeMonths"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.minAgeMonths}
            aria-describedby={describedBy({
              id: "course-minAgeMonths",
              hint: !!minWords,
              error: !!errors.minAgeMonths,
            })}
            {...register("minAgeMonths")}
          />
          {minWords && <FieldHint id="course-minAgeMonths">{minWords}</FieldHint>}
          <FieldMessage id="course-minAgeMonths" message={errors.minAgeMonths?.message} />
        </Field>

        <Field data-invalid={!!errors.maxAgeMonths} className="gap-2">
          <FieldLabel htmlFor="course-maxAgeMonths">حداکثر سن (ماه)</FieldLabel>
          <Input
            id="course-maxAgeMonths"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.maxAgeMonths}
            aria-describedby={describedBy({
              id: "course-maxAgeMonths",
              hint: !!maxWords,
              error: !!errors.maxAgeMonths,
            })}
            {...register("maxAgeMonths")}
          />
          {maxWords && <FieldHint id="course-maxAgeMonths">{maxWords}</FieldHint>}
          <FieldMessage id="course-maxAgeMonths" message={errors.maxAgeMonths?.message} />
        </Field>

        {/* On phones the sessions take the full width under the two ages, so each age keeps half. */}
        <Field data-invalid={!!errors.sessionCount} className="col-span-2 gap-2 sm:col-span-1">
          <FieldLabel htmlFor="course-sessionCount">تعداد جلسه‌ها</FieldLabel>
          <Input
            id="course-sessionCount"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm max-sm:max-w-[calc(50%-0.375rem)]"
            aria-invalid={!!errors.sessionCount}
            aria-describedby={describedBy({ id: "course-sessionCount", hint: true, error: !!errors.sessionCount })}
            {...register("sessionCount")}
          />
          <FieldHint id="course-sessionCount">حدودیه؛ جلسه‌ها توی برنامه دنبال نمی‌شن.</FieldHint>
          <FieldMessage id="course-sessionCount" message={errors.sessionCount?.message} />
        </Field>
      </div>

      {/*------ Place ------*/}
      <ChoicePills
        legend="کجا برگزار می‌شه"
        options={PLACE_OPTIONS}
        registration={register("place")}
        error={errors.place}
      />
    </FormSection>
  );
}
