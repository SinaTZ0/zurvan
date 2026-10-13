import { useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { Checkbox } from "~/components/ui/checkbox";
import { FieldError } from "~/components/ui/field";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS, jalaliMonthLength, todayIso } from "~/lib/jalali";
import { DOG_MAX_AGE_YEARS } from "~/orpc/dog/constants";
import type { DogEditInput, DogEditValues } from "~/routes/admin_dog_detail/schema";

/*===== Birth Date Field =====*/
/**
 * The birth date as three Jalali selects (روز / ماه / سال, years from this year back 25) and a checkbox for a date
 * that is only an estimate. `onApproximateChange` is the form's setter: base-ui's checkbox isn't a native input, so it
 * can't be registered.
 */
export function BirthDateField({
  register,
  control,
  errors,
  onApproximateChange,
}: {
  register: UseFormRegister<DogEditInput>;
  control: Control<DogEditInput, unknown, DogEditValues>;
  errors: FieldErrors<DogEditInput>;
  onApproximateChange: (approximate: boolean) => void;
}) {
  const [year, month, approximate] = useWatch({ control, name: ["birthYear", "birthMonth", "birthDateApproximate"] });

  /*------ Options ------*/
  const thisYear = isoToJalali(todayIso()).year;
  const years = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => thisYear - index);
  // Until a month and year are picked, offer 31 days; the schema rejects a day the month doesn't have.
  const dayCount = year && month ? jalaliMonthLength({ year: Number(year), month: Number(month) }) : 31;
  const error = errors.birthDay;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3" aria-describedby={error ? "birth-date-error" : undefined}>
      <legend className="mb-2 text-sm font-bold">تاریخ تولد</legend>

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

      {/*------ Approximate ------*/}
      <div className="flex items-center gap-2">
        <Checkbox
          id="dog-birth-approximate"
          checked={approximate}
          onCheckedChange={(checked) => onApproximateChange(checked)}
        />
        <Label htmlFor="dog-birth-approximate" className="text-sm font-medium">
          تاریخ تقریبی است
        </Label>
      </div>

      <div id="birth-date-error">
        <FieldError errors={[error]} />
      </div>
    </fieldset>
  );
}

/*===== Date Select =====*/
/** One part of the date. Its label is read by screen readers; sighted people see it as the empty option. */
function DateSelect({
  label,
  registration,
  invalid,
  children,
}: {
  label: string;
  registration: ReturnType<UseFormRegister<DogEditInput>>;
  invalid: boolean;
  children: React.ReactNode;
}) {
  return (
    <NativeSelect aria-label={label} aria-invalid={invalid} className="w-full" {...registration}>
      <NativeSelectOption value="">{label}</NativeSelectOption>
      {children}
    </NativeSelect>
  );
}
