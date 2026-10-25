import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";
import { ChoicePills } from "~/routes/account_dog_form/components/choice-pills";
import { DateParts, PartSelect } from "~/routes/account_dog_form/components/date-parts";
import { NativeSelectOption } from "~/components/ui/native-select";
import {
  AGE_MONTH_OPTIONS,
  AGE_YEAR_OPTIONS,
  type DogFormInput,
  type DogFormValues,
} from "~/routes/account_dog_form/schema";

/*===== Birth Date Field =====*/
/**
 * The birth date, two ways: a date for owners who know it (in the page's entry calendar, `DateParts`), or an age in
 * years and months for the many who don't («approximate is fine», spec entity 4). The age becomes an approximate
 * date, and the site says «حدوداً» / "About".
 */
export function BirthDateField() {
  const errorId = useId();
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DogFormInput, unknown, DogFormValues>();
  const mode = useWatch({ control, name: "birthMode" });
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
        <DateParts
          fields={{ day: "birthDay", month: "birthMonth", year: "birthYear" }}
          invalid={!!error}
          describedBy={error ? errorId : undefined}
        />
      ) : (
        /*------ Age ------*/
        // "11 months" needs about 8rem with the chevron, so on English phones «حدوداً» ("About") takes its own row and
        // the two selects share the next one; from `sm` they sit in the row as in Persian.
        <div className="flex flex-wrap items-center gap-2 text-sm ltr:max-sm:grid ltr:max-sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <span className="text-muted-foreground ltr:max-sm:col-span-3">{m.account_dog_form_birth_about()}</span>
          <PartSelect
            label={m.account_dog_form_age_years_label()}
            registration={register("ageYears")}
            invalid={!!error}
            describedBy={error ? errorId : undefined}
            className="w-24 ltr:w-full ltr:sm:w-36"
          >
            {AGE_YEAR_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {ageYearsLabel(option)}
              </NativeSelectOption>
            ))}
          </PartSelect>
          <span className="text-muted-foreground">{m.account_dog_form_birth_and()}</span>
          <PartSelect
            label={m.account_dog_form_age_months_label()}
            registration={register("ageMonths")}
            invalid={!!error}
            describedBy={error ? errorId : undefined}
            className="w-24 ltr:w-full ltr:sm:w-36"
          >
            {AGE_MONTH_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {ageMonthsLabel(option)}
              </NativeSelectOption>
            ))}
          </PartSelect>
        </div>
      )}

      {/* Keyed by the message, so a new one rises in again. */}
      <div id={errorId}>
        <FieldError key={error?.message} errors={[error]} className="answer-in" />
      </div>
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
