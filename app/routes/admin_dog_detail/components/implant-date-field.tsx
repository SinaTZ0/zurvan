import { XIcon } from "lucide-react";
import { useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { FieldDescription, FieldError } from "~/components/ui/field";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS, jalaliMonthLength, todayIso } from "~/lib/jalali";
import { DOG_MAX_AGE_YEARS } from "~/orpc/dog/constants";
import type { DogEditInput, DogEditValues } from "~/routes/admin_dog_detail/schema";

/*===== Implant Date Field =====*/
/**
 * The day the microchip was implanted, as the same three Jalali selects as the birth date (روز / ماه / سال). It is
 * optional, so all three may stay empty; «پاک کردن» empties them again after a pick. `onClear` is the form's setter,
 * which also drops the error of a half-filled date.
 */
export function ImplantDateField({
  register,
  control,
  errors,
  onClear,
  onPartChange,
}: {
  register: UseFormRegister<DogEditInput>;
  control: Control<DogEditInput, unknown, DogEditValues>;
  errors: FieldErrors<DogEditInput>;
  onClear: () => void;
  /** After any of the three parts changes: the date's one error belongs to the day, so it is checked again as a whole. */
  onPartChange: () => void;
}) {
  const [day, month, year] = useWatch({ control, name: ["implantDay", "implantMonth", "implantYear"] });

  /*------ Options ------*/
  const thisYear = isoToJalali(todayIso()).year;
  const years = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => thisYear - index);
  const dayCount = year && month ? jalaliMonthLength({ year: Number(year), month: Number(month) }) : 31;
  const error = errors.implantDay;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3" aria-describedby={error ? "implant-date-error" : undefined}>
      <legend className="mb-2 text-sm font-bold">تاریخ کاشت میکروچیپ</legend>

      <div className="grid grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2">
        <DateSelect label="روز" registration={register("implantDay", { onChange: onPartChange })} invalid={!!error}>
          {Array.from({ length: dayCount }, (_, index) => (
            <NativeSelectOption key={index + 1} value={index + 1}>
              {formatNumberFa(index + 1)}
            </NativeSelectOption>
          ))}
        </DateSelect>
        <DateSelect label="ماه" registration={register("implantMonth", { onChange: onPartChange })} invalid={!!error}>
          {JALALI_MONTHS.map((name, index) => (
            <NativeSelectOption key={name} value={index + 1}>
              {name}
            </NativeSelectOption>
          ))}
        </DateSelect>
        <DateSelect label="سال" registration={register("implantYear", { onChange: onPartChange })} invalid={!!error}>
          {years.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {toPersianDigits(String(option))}
            </NativeSelectOption>
          ))}
        </DateSelect>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-3">
        <FieldDescription>اختیاریه؛ اگه نمی‌دونی خالی بذار.</FieldDescription>
        {(day || month || year) && (
          <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={onClear}>
            <XIcon aria-hidden />
            پاک کردن
          </Button>
        )}
      </div>

      <div id="implant-date-error">
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
