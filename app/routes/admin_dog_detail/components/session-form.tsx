import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import { INK_OUTLINE, SHEET_FOOTER, SHEET_GROUP } from "~/routes/admin_dog_detail/surfaces";

/*===== Types =====*/
export type SessionInput = ReturnType<typeof toSessionInput>;

/** How many Jalali years the day's select offers, counting this one: sessions are written soon after they happen. */
const YEAR_OPTIONS = 3;

/*===== Session Form =====*/
/**
 * One session as a form, inside the session sheet: a scrolling body in groups split by the tear (when and which course, what was done, the public mark) and a footer with «انصراف» / «ذخیره». The sheet owns
 * the request; this component validates, hands the sheet the API input, and puts the sheet's `failure` back on the
 * fields and in the alert above the buttons. Input is kept after a failure.
 *
 * `entry` is the session being corrected, or null for a new one. The entry's «public» mark (it may be shown on the dog's
 * public record, if its owner makes the record public, F14) is offered only when an owner can make a record public at all
 * (`publicRecordsAvailable`); otherwise it is kept as the entry has it.
 */
export function SessionForm({
  entry,
  publicRecordsAvailable,
  enrollments,
  isPending,
  failure,
  onSubmit,
  onCancel,
}: {
  entry: LogbookEntry | null;
  publicRecordsAvailable: boolean;
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
    setValue,
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
  const [year, month, isPublic] = useWatch({ control, name: ["year", "month", "isPublic"] });
  const thisYear = isoToJalali(todayIso()).year;
  const dayCount = year && month ? jalaliMonthLength({ year: Number(year), month: Number(month) }) : 31;

  const submit = handleSubmit((values) => onSubmit(toSessionInput({ values })));

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      {/*===== Fields (scrolling) =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/*------ When and Which Course ------*/}
        <div className={SHEET_GROUP}>
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
        </div>

        {/*------ What Was Done ------*/}
        <div className={SHEET_GROUP}>
          {/*------ Notes ------*/}
          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="session-notes">چی کار کردید؟</FieldLabel>
            <Textarea id="session-notes" rows={6} aria-invalid={!!errors.notes} {...register("notes")} />
            <FieldDescription>صاحب سگ اینو می‌خونه؛ فقط خودش و تو می‌بینید.</FieldDescription>
            <FieldError errors={[errors.notes]} />
          </Field>

          {/*------ Exercises ------*/}
          <Field data-invalid={!!errors.exercises}>
            <FieldLabel htmlFor="session-exercises">تمرین‌ها</FieldLabel>
            <Textarea id="session-exercises" rows={4} aria-invalid={!!errors.exercises} {...register("exercises")} />
            <FieldDescription>هر تمرین توی یه خط.</FieldDescription>
            <FieldError errors={[errors.exercises]} />
          </Field>

          {/*------ Progress ------*/}
          <Field data-invalid={!!errors.progress}>
            <FieldLabel htmlFor="session-progress">جمع‌بندی</FieldLabel>
            <Input
              id="session-progress"
              autoComplete="off"
              aria-invalid={!!errors.progress}
              {...register("progress")}
            />
            <FieldDescription>یه جمله، مثلاً: از هفته‌ی قبل بهتر شده.</FieldDescription>
            <FieldError errors={[errors.progress]} />
          </Field>
        </div>

        {/*------ Public Mark ------*/}
        {publicRecordsAvailable && (
          <div className={cn(SHEET_GROUP, "flex-row items-start gap-3")}>
            <Checkbox
              id="session-public"
              checked={!!isPublic}
              onCheckedChange={(checked) => setValue("isPublic", checked, { shouldDirty: true })}
              className="mt-1"
            />
            <Label htmlFor="session-public" className="text-sm leading-relaxed font-medium text-pretty">
              این جلسه می‌تونه توی پرونده‌ی عمومی دیده بشه (فقط اگه صاحب سگ پرونده رو عمومی کنه). یادداشت و تمرین‌ها
              همون‌طور که نوشتی دیده می‌شن.
            </Label>
          </div>
        )}
      </div>

      {/*===== Footer (fixed) =====*/}
      <footer className={SHEET_FOOTER}>
        <FormAlert message={alert || undefined} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className={INK_OUTLINE} onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit" variant="solid" className="flex-1" disabled={isPending}>
            {isPending && <Spinner aria-hidden />}
            {isPending ? "داره ذخیره می‌شه…" : "ذخیره"}
          </Button>
        </div>
      </footer>
    </form>
  );
}
