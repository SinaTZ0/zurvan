import { cn } from "cn";
import { useFormContext, useWatch, type UseFormRegisterReturn } from "react-hook-form";

import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { entryCalendar } from "~/lib/date-entry";
import { DOG_MAX_AGE_YEARS } from "~/orpc/dog/constants";
import { m } from "~/paraglide/messages";
import type { DogFormInput, DogFormValues } from "~/routes/account_dog_form/schema";

type DatePartFields = {
  day: "birthDay" | "implantDay";
  month: "birthMonth" | "implantMonth";
  year: "birthYear" | "implantYear";
};

/*===== Date Parts =====*/
/**
 * A day as three selects in the page's entry calendar (Jalali on the Persian pages, Gregorian on the English ones; the
 * stored date is the same either way): day, month, year, in the order the dates are shown. The years run from this
 * one back as far as a dog lives here (`DOG_MAX_AGE_YEARS`), for the birth date and the chip's implant date alike.
 *
 * Each select's label is read by screen readers; sighted people see it as the empty option.
 */
export function DateParts({
  fields,
  invalid,
  describedBy,
}: {
  fields: DatePartFields;
  invalid: boolean;
  /** The ids of the error (and hint) under the selects. */
  describedBy?: string;
}) {
  const { register, control } = useFormContext<DogFormInput, unknown, DogFormValues>();
  const [year, month] = useWatch({ control, name: [fields.year, fields.month] });

  /*------ Options ------*/
  const calendar = entryCalendar();
  const thisYear = calendar.today().year;
  const years = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => thisYear - index);
  // Until a month and year are picked, the calendar offers 31 days; the schema rejects a day the month doesn't have.
  const dayCount = calendar.monthLength({ year: Number(year), month: Number(month) });

  return (
    // English's "Day" runs wider than «روز» beside the select's chevron, and on a phone "September" needs the room
    // too: there the three selects take less inner padding (the chevron still clears the text) and the month takes
    // what the day and year columns give up.
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2 ltr:grid-cols-[5.75rem_minmax(0,1fr)_6rem] ltr:max-sm:grid-cols-[4.75rem_minmax(0,1fr)_5.25rem] ltr:max-sm:[&_select]:ps-3 ltr:max-sm:[&_select]:pe-8">
      <PartSelect
        label={m.account_dog_form_birth_day()}
        registration={register(fields.day)}
        invalid={invalid}
        describedBy={describedBy}
      >
        {Array.from({ length: dayCount }, (_, index) => (
          <NativeSelectOption key={index + 1} value={index + 1}>
            {calendar.dayLabel(index + 1)}
          </NativeSelectOption>
        ))}
      </PartSelect>
      <PartSelect
        label={m.account_dog_form_birth_month()}
        registration={register(fields.month)}
        invalid={invalid}
        describedBy={describedBy}
      >
        {calendar.months.map((name, index) => (
          <NativeSelectOption key={name} value={index + 1}>
            {name}
          </NativeSelectOption>
        ))}
      </PartSelect>
      <PartSelect
        label={m.account_dog_form_birth_year()}
        registration={register(fields.year)}
        invalid={invalid}
        describedBy={describedBy}
      >
        {years.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {calendar.yearLabel(option)}
          </NativeSelectOption>
        ))}
      </PartSelect>
    </div>
  );
}

/*===== Part Select =====*/
/** One select of a date or an age, with its label as the empty option. */
export function PartSelect({
  label,
  registration,
  invalid,
  describedBy,
  className,
  children,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  invalid: boolean;
  describedBy?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <NativeSelect
      aria-label={label}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={cn("w-full", className)}
      {...registration}
    >
      <NativeSelectOption value="">{label}</NativeSelectOption>
      {children}
    </NativeSelect>
  );
}
