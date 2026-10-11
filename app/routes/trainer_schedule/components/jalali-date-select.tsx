import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { JALALI_MONTHS, jalaliMonthLength, type JalaliDate } from "~/lib/jalali";

/*===== Jalali Date Select =====*/
/**
 * A day, month and year in the Jalali calendar as three native selects (the same pick the dog form uses for a birth
 * date). Always a real date: changing the month or year pulls the day back to the month's last when it no longer fits.
 *
 * @param years The years offered, e.g. this one and the next.
 */
export function JalaliDateSelect({
  value,
  onChange,
  years,
  labelPrefix,
}: {
  value: JalaliDate;
  onChange: (next: JalaliDate) => void;
  years: readonly number[];
  /** Names the three selects for screen readers, e.g. «شروع». */
  labelPrefix: string;
}) {
  function change(part: Partial<JalaliDate>) {
    const next = { ...value, ...part };
    onChange({ ...next, day: Math.min(next.day, jalaliMonthLength(next)) });
  }

  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_5.5rem] gap-2">
      <NativeSelect
        aria-label={`${labelPrefix}: روز`}
        value={value.day}
        onChange={(event) => change({ day: Number(event.target.value) })}
        className="w-full"
      >
        {Array.from({ length: jalaliMonthLength(value) }, (_, index) => (
          <NativeSelectOption key={index + 1} value={index + 1}>
            {formatNumberFa(index + 1)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={`${labelPrefix}: ماه`}
        value={value.month}
        onChange={(event) => change({ month: Number(event.target.value) })}
        className="w-full"
      >
        {JALALI_MONTHS.map((name, index) => (
          <NativeSelectOption key={name} value={index + 1}>
            {name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={`${labelPrefix}: سال`}
        value={value.year}
        onChange={(event) => change({ year: Number(event.target.value) })}
        className="w-full"
      >
        {years.map((year) => (
          <NativeSelectOption key={year} value={year}>
            {toPersianDigits(String(year))}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
