import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import type { ApiFailure } from "~/lib/api-error";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS, jalaliMonthLength, todayIso } from "~/lib/jalali";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import type { LogbookEntry } from "~/orpc/logbook/contract";
import {
  type SessionFormInput,
  type SessionFormValues,
  serverFieldToForm,
  sessionFormSchema,
  toSessionDefaults,
  toSessionInput,
} from "~/routes/admin_dog_detail/logbook-schema";

/*===== Types =====*/
export type SessionInput = ReturnType<typeof toSessionInput>;

/** How many Jalali years the day's select offers, counting this one: sessions are written soon after they happen. */
const YEAR_OPTIONS = 3;

/*===== Session Form =====*/
/**
 * One session as a form, inside the session sheet: a scrolling body and a footer with «ذخیره» / «انصراف». The sheet owns
 * the request; this component validates, hands the sheet the API input, and puts the sheet's `failure` back on the
 * fields and in the alert above the buttons. Input is kept after a failure.
 *
 * `entry` is the session being corrected, or null for a new one. A session's «public» mark is the entry's own and is not
 * touched here: no record can be made public yet (F14), so the form doesn't offer it.
 */
export function SessionForm({
  entry,
  enrollments,
  isPending,
  failure,
  onSubmit,
  onCancel,
}: {
  entry: LogbookEntry | null;
  enrollments: AdminEnrollment[];
  isPending: boolean;
  failure: ApiFailure | null;
  onSubmit: (input: SessionInput) => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SessionFormInput, unknown, SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      ...toSessionDefaults(entry),
      enrollmentId: entry ? (enrollments.find((item) => item.course.slug === entry.course?.slug)?.id ?? "") : "",
    },
  });

  /*------ Server Messages ------*/
  const orphanMessages: string[] = [];
  useEffect(() => {
    if (!failure) return;
    for (const [field, message] of Object.entries(failure.fields)) {
      const target = serverFieldToForm(field);
      if (target) setError(target, { message });
    }
  }, [failure, setError]);
  for (const [field, message] of Object.entries(failure?.fields ?? {})) {
    if (!serverFieldToForm(field)) orphanMessages.push(message);
  }
  const alert = [failure?.message, ...orphanMessages].filter(Boolean).join(" ");

  /*------ Date ------*/
  const [year, month] = useWatch({ control, name: ["year", "month"] });
  const thisYear = isoToJalali(todayIso()).year;
  const dayCount = year && month ? jalaliMonthLength({ year: Number(year), month: Number(month) }) : 31;

  const submit = handleSubmit((values) => onSubmit(toSessionInput({ values, isPublic: entry?.isPublic ?? false })));

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      {/*===== Fields (scrolling) =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {/*------ Day ------*/}
        <fieldset
          className="flex min-w-0 flex-col gap-3"
          aria-describedby={errors.day ? "session-date-error" : undefined}
        >
          <legend className="mb-2 text-sm font-bold">روز جلسه</legend>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)_6rem] gap-2">
            <NativeSelect aria-label="روز" aria-invalid={!!errors.day} className="w-full" {...register("day")}>
              {Array.from({ length: dayCount }, (_, index) => (
                <NativeSelectOption key={index + 1} value={index + 1}>
                  {formatNumberFa(index + 1)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect aria-label="ماه" aria-invalid={!!errors.day} className="w-full" {...register("month")}>
              {JALALI_MONTHS.map((name, index) => (
                <NativeSelectOption key={name} value={index + 1}>
                  {name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect aria-label="سال" aria-invalid={!!errors.day} className="w-full" {...register("year")}>
              {Array.from({ length: YEAR_OPTIONS }, (_, index) => thisYear - index).map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {toPersianDigits(String(option))}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {errors.day && (
            <p id="session-date-error" role="alert" className="text-sm text-destructive">
              {errors.day.message}
            </p>
          )}
        </fieldset>

        {/*------ Course ------*/}
        <Field data-invalid={!!errors.enrollmentId}>
          <FieldLabel htmlFor="session-course">دوره</FieldLabel>
          <NativeSelect
            id="session-course"
            className="w-full"
            aria-invalid={!!errors.enrollmentId}
            {...register("enrollmentId")}
          >
            <NativeSelectOption value="">بدون دوره</NativeSelectOption>
            {enrollments.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.course.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={[errors.enrollmentId]} />
        </Field>

        {/*------ Notes ------*/}
        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="session-notes">چه کار کردید؟</FieldLabel>
          <Textarea id="session-notes" rows={6} aria-invalid={!!errors.notes} {...register("notes")} />
          <FieldDescription>صاحب سگ این را می‌خواند. فقط خودش و تو می‌بینید.</FieldDescription>
          <FieldError errors={[errors.notes]} />
        </Field>

        {/*------ Exercises ------*/}
        <Field data-invalid={!!errors.exercises}>
          <FieldLabel htmlFor="session-exercises">تمرین‌ها</FieldLabel>
          <Textarea id="session-exercises" rows={4} aria-invalid={!!errors.exercises} {...register("exercises")} />
          <FieldDescription>هر تمرین توی یک خط.</FieldDescription>
          <FieldError errors={[errors.exercises]} />
        </Field>

        {/*------ Progress ------*/}
        <Field data-invalid={!!errors.progress}>
          <FieldLabel htmlFor="session-progress">جمع‌بندی</FieldLabel>
          <Input id="session-progress" autoComplete="off" aria-invalid={!!errors.progress} {...register("progress")} />
          <FieldDescription>یک جمله، مثلاً: از هفته‌ی قبل بهتر شده.</FieldDescription>
          <FieldError errors={[errors.progress]} />
        </Field>
      </div>

      {/*===== Footer (fixed) =====*/}
      <footer className="flex flex-col gap-3 border-t border-border p-4">
        <FormAlert message={alert || undefined} />
        <div className="flex gap-2">
          <Button type="submit" variant="solid" className="flex-1" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? "در حال ذخیره…" : "ذخیره"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            انصراف
          </Button>
        </div>
      </footer>
    </form>
  );
}
