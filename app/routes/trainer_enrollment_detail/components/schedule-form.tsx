import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { SegmentedChoice } from "~/components/segmented-choice";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { describeApiFailure } from "~/lib/api-error";
import { toLatinDigits } from "~/lib/digits";
import { isoToJalali, isValidJalali, jalaliToIso, type JalaliDate } from "~/lib/jalali";
import { tehranToUtc, utcToTehranParts } from "~/lib/tehran-time";
import {
  SESSION_DEFAULT_DURATION_MINUTES,
  SESSION_PLACE_KIND_LABELS,
  SESSION_PLACE_KINDS,
  type SessionPlaceKind,
} from "~/orpc/enrollment/constants";
import type { SessionOverlap, TrainerEnrollment, TrainingSession } from "~/orpc/enrollment/contract";
import { client } from "~/orpc/client";
import { JalaliDateSelect } from "~/routes/trainer_schedule/components/jalali-date-select";
import { parseClockTime } from "~/routes/trainer_schedule/open-times-plan";
import { presetPlace } from "~/routes/trainer_enrollment_detail/format";

const DAY_MS = 86_400_000;

type Values = { time: string; duration: string; placeKind: SessionPlaceKind; place: string };

/*===== Schedule Form =====*/
/**
 * One composer for placing a session in an empty box and for moving a scheduled one. The day is picked in the Jalali
 * calendar and the time typed, both on the Tehran clock, so what is saved is what the trainer reads on the wall.
 *
 * A new session starts a day from now, at 17:00, in the place the enrollment implies (the address, or the kennel with
 * boarding); a moved one starts from its own values. Overlaps with other sessions or assessments are handed to
 * `onSaved` for the card to warn about; they never stop the save.
 *
 * @param session The session being moved, or none for a new one.
 */
export function ScheduleForm({
  enrollment,
  session,
  onSaved,
}: {
  enrollment: TrainerEnrollment;
  session?: TrainingSession;
  onSaved: (overlaps: SessionOverlap[]) => void;
}) {
  const [alert, setAlert] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /*------ Initial Values ------*/
  // Read once when the form opens: this component only mounts in an open popover or sheet, so it is never on the
  // server.
  const [initial] = useState(() => {
    const startsAt = session?.startsAt ?? new Date(Date.now() + DAY_MS);
    const parts = utcToTehranParts(startsAt);
    const placeKind: SessionPlaceKind = session?.placeKind ?? (enrollment.boarding ? "boarding" : "home");
    return {
      day: isoToJalali(parts.date),
      today: isoToJalali(utcToTehranParts(new Date()).date),
      values: {
        time: session ? parts.time : "17:00",
        duration: String(session?.durationMinutes ?? SESSION_DEFAULT_DURATION_MINUTES),
        placeKind,
        place: session?.place ?? presetPlace({ kind: placeKind, enrollment }),
      } satisfies Values,
    };
  });
  const [day, setDay] = useState<JalaliDate>(initial.day);
  const { register, handleSubmit, getValues, setValue, setError, formState } = useForm<Values>({
    defaultValues: initial.values,
  });

  /*------ Place ------*/
  // Changing the kind swaps the place for the new kind's preset, but never overwrites something the trainer typed.
  const kindRegistration = register("placeKind");
  const onKindChange: typeof kindRegistration.onChange = async (event) => {
    const result = await kindRegistration.onChange(event);
    const presets = new Set(["", ...SESSION_PLACE_KINDS.map((kind) => presetPlace({ kind, enrollment }))]);
    if (presets.has(getValues("place").trim())) {
      setValue("place", presetPlace({ kind: event.target.value as SessionPlaceKind, enrollment }));
    }
    return result;
  };

  /*------ Save ------*/
  const save = useMutation({
    mutationFn: ({ startsAt, durationMinutes, placeKind, place }: SaveInput) =>
      session
        ? client.enrollment.trainer.rescheduleSession({
            sessionId: session.id,
            startsAt,
            durationMinutes,
            placeKind,
            place,
          })
        : client.enrollment.trainer.scheduleSession({
            enrollmentId: enrollment.id,
            startsAt,
            durationMinutes,
            placeKind,
            place,
          }),
    onSuccess: ({ overlaps }) => onSaved(overlaps),
    onError: (error) => {
      const failure = describeApiFailure({ error, fallback: "ذخیره نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setFieldErrors(failure.fields);
    },
  });

  const submit = handleSubmit((values) => {
    setAlert(null);
    setFieldErrors({});

    const time = parseClockTime(values.time);
    if (time === null) {
      setError("time", { message: "ساعت را مثل ۱۷:۰۰ بنویس." });
      return;
    }
    if (!isValidJalali(day)) return;
    const durationMinutes = Number(toLatinDigits(values.duration));

    save.mutate({
      startsAt: tehranToUtc({ date: jalaliToIso(day), time }),
      durationMinutes,
      placeKind: values.placeKind,
      place: values.place,
    });
  });

  const timeError = formState.errors.time?.message ?? fieldErrors.startsAt;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert message={alert ?? undefined} />

      {/*------ Day and Time ------*/}
      <FieldSet className="gap-2">
        <legend className="text-sm font-bold">روز</legend>
        <JalaliDateSelect
          labelPrefix="روز جلسه"
          value={day}
          onChange={setDay}
          years={[initial.today.year, initial.today.year + 1]}
        />
      </FieldSet>

      <div className="grid grid-cols-2 gap-3">
        <Field data-invalid={!!timeError}>
          <FieldLabel htmlFor="session-time">ساعت</FieldLabel>
          <Input
            id="session-time"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            placeholder="17:00"
            aria-invalid={!!timeError}
            className="text-center font-bold tabular-nums"
            {...register("time")}
          />
          <FieldError>{timeError}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors.durationMinutes}>
          <FieldLabel htmlFor="session-duration">مدت (دقیقه)</FieldLabel>
          <Input
            id="session-duration"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!fieldErrors.durationMinutes}
            className="tabular-nums"
            {...register("duration")}
          />
          <FieldError>{fieldErrors.durationMinutes}</FieldError>
        </Field>
      </div>

      {/*------ Place ------*/}
      <SegmentedChoice
        legend="کجا؟"
        options={SESSION_PLACE_KINDS.map((kind) => ({ value: kind, label: SESSION_PLACE_KIND_LABELS[kind] }))}
        registration={{ ...kindRegistration, onChange: onKindChange }}
      />
      <Field data-invalid={!!fieldErrors.place}>
        <FieldLabel htmlFor="session-place">نشانی یا محل دیدار</FieldLabel>
        <Textarea
          id="session-place"
          rows={2}
          aria-invalid={!!fieldErrors.place}
          className="min-h-16"
          {...register("place")}
        />
        <FieldError>{fieldErrors.place}</FieldError>
      </Field>

      <Button type="submit" disabled={save.isPending} className="w-full">
        {save.isPending && <Spinner data-icon="inline-start" />}
        {session ? "زمان را عوض کن" : "جلسه را بگذار"}
      </Button>
    </form>
  );
}

type SaveInput = {
  startsAt: Date;
  durationMinutes: number;
  placeKind: SessionPlaceKind;
  place: string;
};
