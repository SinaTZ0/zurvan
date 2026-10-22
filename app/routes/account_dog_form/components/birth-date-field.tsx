import { useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { entryCalendar } from "~/lib/date-entry";
import { formatNumber } from "~/lib/locale-format";
import { DOG_MAX_AGE_YEARS } from "~/orpc/dog/constants";
import { m } from "~/paraglide/messages";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import {
  AGE_MONTH_OPTIONS,
  AGE_YEAR_OPTIONS,
  type DogFormInput,
  type DogFormValues,
} from "~/routes/account_dog_form/schema";

/*===== Birth Date Field =====*/
/**
 * The birth date, two ways: a date for owners who know it (Jalali on the Persian pages, Gregorian on the English
 * ones; the stored date is the same either way), or an age in years and months for the many who don't («approximate is
 * fine», spec entity 4). The age becomes an approximate date, and the site says «حدوداً» / "About".
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
  const calendar = entryCalendar();
  const thisYear = calendar.today().year;
  const years = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => thisYear - index);
  // Until a month and year are picked, the calendar offers 31 days; the schema rejects a day the month doesn't have.
  const dayCount = calendar.monthLength({ year: Number(year), month: Number(month) });
  const error = mode === "approximate" ? errors.ageYears : errors.birthDay;

  return (
    <div className="flex flex-col gap-3">
      <ChoicePills
        legend={m.account_dog_form_field_birth_date()}
        options={[
          { value: "exact", label: m.account_dog_form_birth_mode_exact() },
          { value: "approximate", label: m.account_dog_form_birth_mode_approximate() },
        ]}
        registration={register("birthMode")}
      />

      {/*------ Exact Date ------*/}
      {mode === "exact" ? (
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2">
          <DateSelect label={m.account_dog_form_birth_day()} registration={register("birthDay")} invalid={!!error}>
            {Array.from({ length: dayCount }, (_, index) => (
              <NativeSelectOption key={index + 1} value={index + 1}>
                {calendar.dayLabel(index + 1)}
              </NativeSelectOption>
            ))}
          </DateSelect>
          <DateSelect label={m.account_dog_form_birth_month()} registration={register("birthMonth")} invalid={!!error}>
            {calendar.months.map((name, index) => (
              <NativeSelectOption key={name} value={index + 1}>
                {name}
              </NativeSelectOption>
            ))}
          </DateSelect>
          <DateSelect label={m.account_dog_form_birth_year()} registration={register("birthYear")} invalid={!!error}>
            {years.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {calendar.yearLabel(option)}
              </NativeSelectOption>
            ))}
          </DateSelect>
        </div>
      ) : (
        /*------ Age ------*/
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{m.account_dog_form_birth_about()}</span>
          <DateSelect label={m.account_dog_form_age_years_label()} registration={register("ageYears")} invalid={!!error} className="w-24">
            {AGE_YEAR_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {ageYearsLabel(option)}
              </NativeSelectOption>
            ))}
          </DateSelect>
          <span className="text-muted-foreground">{m.account_dog_form_birth_and()}</span>
          <DateSelect label={m.account_dog_form_age_months_label()} registration={register("ageMonths")} invalid={!!error} className="w-24">
            {AGE_MONTH_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {ageMonthsLabel(option)}
              </NativeSelectOption>
            ))}
          </DateSelect>
        </div>
      )}

      {/* Keyed by the message, so a new one rises in again. */}
      <FieldError key={error?.message} errors={[error]} className="answer-in" />
    </div>
  );
}

/*===== Age Labels =====*/
/** «۳ سال» / "3 years": the plural form follows the count (Persian has one form, so both messages read the same). */
function ageYearsLabel(count: number) {
  const params = { count: formatNumber(count) };
  return count === 1 ? m.account_dog_form_age_years_one(params) : m.account_dog_form_age_years_other(params);
}

function ageMonthsLabel(count: number) {
  const params = { count: formatNumber(count) };
  return count === 1 ? m.account_dog_form_age_months_one(params) : m.account_dog_form_age_months_other(params);
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
