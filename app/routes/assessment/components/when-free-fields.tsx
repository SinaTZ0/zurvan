import {
  useController,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { toPersianDigits, formatNumberFa } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS, jalaliMonthLength, todayIso } from "~/lib/jalali";
import {
  EVALUATION_PERIOD_LABELS,
  EVALUATION_PERIODS,
  EVALUATION_WEEKDAY_LABELS,
  EVALUATION_WEEKDAYS,
} from "~/orpc/evaluation/constants";
import { ChoiceChip } from "~/routes/assessment/components/choice-chip";
import type { EvaluationRequestInput, EvaluationRequestValues } from "~/routes/assessment/schema";

/*===== When Free Fields =====*/
/**
 * «کی وقت داری؟»: the earliest day as three selects (Jalali, Persian digits), then the weekdays and times of day the
 * owner is usually free. The Admin calls to agree a real time; the app only records these (F3).
 */
export function WhenFreeFields({
  register,
  control,
  setValue,
  errors,
}: {
  register: UseFormRegister<EvaluationRequestInput>;
  control: Control<EvaluationRequestInput, unknown, EvaluationRequestValues>;
  setValue: UseFormSetValue<EvaluationRequestInput>;
  errors: FieldErrors<EvaluationRequestInput>;
}) {
  const [day, month, year] = useWatch({ control, name: ["earliestDay", "earliestMonth", "earliestYear"] });

  /*------ Options ------*/
  // Only this Jalali year and the next: an evaluation is asked for soon, never years ahead.
  const thisYear = isoToJalali(todayIso()).year;
  const years = [thisYear, thisYear + 1];
  const dayCount = jalaliMonthLength({ year: Number(year), month: Number(month) });
  const dateError = errors.earliestDay?.message;

  /*------ Keep the Day Real ------*/
  // A native select can't show a value that isn't among its options, so a day the new month lacks (31 → a 30-day
  // month) is pulled back to the month's last day instead of being left selected invisibly.
  const dayRegistration = register("earliestDay");
  const monthRegistration = register("earliestMonth");
  const yearRegistration = register("earliestYear");
  function clampDay({ nextMonth, nextYear }: { nextMonth: number; nextYear: number }) {
    const length = jalaliMonthLength({ year: nextYear, month: nextMonth });
    if (Number(day) > length) setValue("earliestDay", String(length));
  }

  return (
    <div className="flex flex-col gap-6">
      {/*===== Earliest Date =====*/}
      <fieldset
        className="min-w-0"
        aria-invalid={!!dateError}
        aria-describedby={dateError ? "earliest-error" : undefined}
      >
        <legend className="mb-2 text-sm font-bold">از چه روزی؟</legend>
        <div className="grid max-w-md grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2">
          <NativeSelect aria-label="روز" aria-invalid={!!dateError} className="w-full" {...dayRegistration}>
            {Array.from({ length: dayCount }, (_, index) => (
              <NativeSelectOption key={index + 1} value={index + 1}>
                {formatNumberFa(index + 1)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="ماه"
            aria-invalid={!!dateError}
            className="w-full"
            {...monthRegistration}
            onChange={(event) => {
              void monthRegistration.onChange(event);
              clampDay({ nextMonth: Number(event.target.value), nextYear: Number(year) });
            }}
          >
            {JALALI_MONTHS.map((name, index) => (
              <NativeSelectOption key={name} value={index + 1}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="سال"
            aria-invalid={!!dateError}
            className="w-full"
            {...yearRegistration}
            onChange={(event) => {
              void yearRegistration.onChange(event);
              clampDay({ nextMonth: Number(month), nextYear: Number(event.target.value) });
            }}
          >
            {years.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {toPersianDigits(String(option))}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div id="earliest-error" className="mt-2">
          <FieldError errors={[errors.earliestDay]} />
        </div>
      </fieldset>

      {/*===== Weekdays =====*/}
      <ChipGroup
        control={control}
        name="availableDays"
        legend="چه روزهایی معمولاً آزادی؟"
        options={EVALUATION_WEEKDAYS.map((value) => ({ value, label: EVALUATION_WEEKDAY_LABELS[value] }))}
        error={errors.availableDays?.message}
      />

      {/*===== Times of Day =====*/}
      <ChipGroup
        control={control}
        name="availablePeriods"
        legend="چه ساعتی از روز؟"
        options={EVALUATION_PERIODS.map((value) => ({ value, label: EVALUATION_PERIOD_LABELS[value] }))}
        error={errors.availablePeriods?.message}
      />
    </div>
  );
}

/*===== Chip Group =====*/
/** A labelled row of toggle chips whose picked values are one list in the form. */
function ChipGroup({
  control,
  name,
  legend,
  options,
  error,
}: {
  control: Control<EvaluationRequestInput, unknown, EvaluationRequestValues>;
  name: "availableDays" | "availablePeriods";
  legend: string;
  options: readonly { value: string; label: string }[];
  error?: string;
}) {
  const { field } = useController({ control, name });
  const picked: readonly string[] = field.value;
  const errorId = `${name}-error`;

  return (
    <fieldset className="min-w-0" aria-invalid={!!error} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ChoiceChip
            key={option.value}
            name={name}
            label={option.label}
            checked={picked.includes(option.value)}
            onChange={(checked) => {
              // Keep the list in the options' order (the Persian week), whatever order they were tapped in.
              const next = options
                .map((item) => item.value)
                .filter((value) => (value === option.value ? checked : picked.includes(value)));
              field.onChange(next);
            }}
          />
        ))}
      </div>
      <div id={errorId} className="mt-2">
        <FieldError errors={[error ? { message: error } : undefined]} />
      </div>
    </fieldset>
  );
}
