import { useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS, jalaliMonthLength, todayIso } from "~/lib/jalali";
import { DOG_MAX_AGE_YEARS } from "~/orpc/dog/constants";
import { SegmentedChoice } from "~/components/segmented-choice";
import {
  AGE_MONTH_OPTIONS,
  AGE_YEAR_OPTIONS,
  type DogFormInput,
  type DogFormValues,
} from "~/routes/account_dog_form/schema";

/*===== Birth Date Field =====*/
/**
 * The birth date, two ways: a Jalali date for owners who know it, or an age in years and months for the many who
 * don't («approximate is fine», spec entity 4). The age becomes an approximate date, and the site says «حدوداً».
 */
export function BirthDateField({
  register,
  control,
  errors,
}: {
  register: UseFormRegister<DogFormInput>;
  control: Control<DogFormInput, unknown, DogFormValues>;
  errors: FieldErrors<DogFormInput>;
}) {
  const [mode, year, month] = useWatch({ control, name: ["birthMode", "birthYear", "birthMonth"] });

  /*------ Options ------*/
  const thisYear = isoToJalali(todayIso()).year;
  const years = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => thisYear - index);
  // Until a month and year are picked, offer 31 days; the schema rejects a day the month doesn't have.
  const dayCount = year && month ? jalaliMonthLength({ year: Number(year), month: Number(month) }) : 31;
  const error = mode === "approximate" ? errors.ageYears : errors.birthDay;

  return (
    <div className="flex flex-col gap-3">
      <SegmentedChoice
        legend="تاریخ تولد"
        options={[
          { value: "exact", label: "تاریخش را می‌دانم" },
          { value: "approximate", label: "حدودی می‌دانم" },
        ]}
        registration={register("birthMode")}
      />

      {/*------ Exact Date ------*/}
      {mode === "exact" ? (
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2">
          <DateSelect label="روز" registration={register("birthDay")} invalid={!!error}>
            {Array.from({ length: dayCount }, (_, index) => (
              <NativeSelectOption key={index + 1} value={index + 1}>
                {formatNumberFa(index + 1)}
              </NativeSelectOption>
            ))}
          </DateSelect>
          <DateSelect label="ماه" registration={register("birthMonth")} invalid={!!error}>
            {JALALI_MONTHS.map((name, index) => (
              <NativeSelectOption key={name} value={index + 1}>
                {name}
              </NativeSelectOption>
            ))}
          </DateSelect>
          <DateSelect label="سال" registration={register("birthYear")} invalid={!!error}>
            {years.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {toPersianDigits(String(option))}
              </NativeSelectOption>
            ))}
          </DateSelect>
        </div>
      ) : (
        /*------ Age ------*/
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">حدوداً</span>
          <DateSelect label="سال" registration={register("ageYears")} invalid={!!error} className="w-24">
            {AGE_YEAR_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {formatNumberFa(option)} سال
              </NativeSelectOption>
            ))}
          </DateSelect>
          <span className="text-muted-foreground">و</span>
          <DateSelect label="ماه" registration={register("ageMonths")} invalid={!!error} className="w-24">
            {AGE_MONTH_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {formatNumberFa(option)} ماه
              </NativeSelectOption>
            ))}
          </DateSelect>
        </div>
      )}

      <FieldError errors={[error]} />
    </div>
  );
}

/*===== Date Select =====*/
/** One part of the date. Its label is read by screen readers; sighted people see it as the empty option. */
function DateSelect({
  label,
  registration,
  invalid,
  className,
  children,
}: {
  label: string;
  registration: ReturnType<UseFormRegister<DogFormInput>>;
  invalid: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <NativeSelect aria-label={label} aria-invalid={invalid} className={className ?? "w-full"} {...registration}>
      <NativeSelectOption value="">{label}</NativeSelectOption>
      {children}
    </NativeSelect>
  );
}
