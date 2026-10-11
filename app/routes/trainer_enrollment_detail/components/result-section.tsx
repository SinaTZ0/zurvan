import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { SegmentedChoice } from "~/components/segmented-choice";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { ENROLLMENT_NOTE_MAX_LENGTH } from "~/orpc/enrollment/constants";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { client } from "~/orpc/client";
import { formatRecordedDate } from "~/routes/trainer_enrollment_detail/format";

const RESULT_OPTIONS = [
  { value: "passed", label: "قبول" },
  { value: "failed", label: "مردود" },
] as const;

/*===== Result Section =====*/
/**
 * Closes the course: the form once a session has been used, what was recorded after, and what happened if it was
 * cancelled. Before any session is used it says what unlocks the form, so the trainer isn't left looking for it.
 */
export function ResultSection({ enrollment }: { enrollment: TrainerEnrollment }) {
  const { status } = enrollment;

  return (
    <section aria-labelledby="result-title" className="flex flex-col gap-4">
      <h2 id="result-title" className="text-xl font-extrabold">
        {status === "cancelled" ? "لغو شد" : "نتیجه"}
      </h2>

      {enrollment.canRecordResult ? (
        <ResultForm enrollmentId={enrollment.id} kind={enrollment.kind} />
      ) : status === "passed" || status === "failed" ? (
        <RecordedResult enrollment={enrollment} />
      ) : status === "cancelled" ? (
        <CancelledNote enrollment={enrollment} />
      ) : (
        <p className="border-s-2 border-primary/50 ps-3 text-sm text-pretty">
          بعد از اولین جلسه‌ی برگزارشده یا غیبت، می‌توانی نتیجه را ثبت کنی.
        </p>
      )}
    </section>
  );
}

/*===== Result Form =====*/
type ResultValues = { result: string; trainerNote: string };

/** «ثبت نتیجه» is the page's one gold-leaf action. */
function ResultForm({ enrollmentId, kind }: { enrollmentId: string; kind: "course" | "test" }) {
  const revalidator = useRevalidator();
  const [alert, setAlert] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const { register, handleSubmit } = useForm<ResultValues>({ defaultValues: { result: "", trainerNote: "" } });

  const record = useMutation({
    mutationFn: (values: ResultValues) => client.enrollment.trainer.recordResult({ id: enrollmentId, ...values }),
    onSuccess: async () => {
      toast.add({ title: "نتیجه ثبت شد و صاحب سگ خبردار شد.", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const failure = describeApiFailure({ error, fallback: "ثبت نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setFields(failure.fields);
      // A refusal (already recorded, cancelled meanwhile) means the page is stale.
      if (failure.message && Object.keys(failure.fields).length === 0) await revalidator.revalidate();
    },
  });

  const submit = handleSubmit((values) => {
    setAlert(null);
    setFields({});
    record.mutate(values);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-pretty text-muted-foreground">
        {kind === "test"
          ? "تست انجام شده؛ نتیجه را بنویس."
          : "وقتی دوره تمام شد، نتیجه را بنویس. جلسه‌های زمان‌بندی‌شده‌ی باقی‌مانده لغو می‌شوند."}
      </p>
      <FormAlert message={alert ?? undefined} />

      <div>
        <SegmentedChoice legend="نتیجه" options={RESULT_OPTIONS} registration={register("result")} />
        <FieldError className="mt-2">{fields.result}</FieldError>
      </div>

      <Field data-invalid={!!fields.trainerNote}>
        <FieldLabel htmlFor="result-note">یادداشت نهایی</FieldLabel>
        <FieldDescription>صاحب سگ این را در پرونده‌ی سگش می‌بیند.</FieldDescription>
        <Textarea
          id="result-note"
          maxLength={ENROLLMENT_NOTE_MAX_LENGTH}
          aria-invalid={!!fields.trainerNote}
          className="min-h-32"
          placeholder="مثلاً: چه چیزهایی یاد گرفت، چه چیزی را ادامه بدهند"
          {...register("trainerNote")}
        />
        <FieldError>{fields.trainerNote}</FieldError>
      </Field>

      <Button type="submit" disabled={record.isPending} className="w-full sm:w-auto sm:min-w-48 sm:self-end">
        {record.isPending && <Spinner data-icon="inline-start" />}
        ثبت نتیجه
      </Button>
    </form>
  );
}

/*===== Recorded Result =====*/
function RecordedResult({ enrollment }: { enrollment: TrainerEnrollment }) {
  const { status, trainerNote, completedAt } = enrollment;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {status === "passed" ? "قبول شد" : "مردود شد"}
        {completedAt ? `، ${formatRecordedDate(completedAt)}` : ""}
      </p>
      {trainerNote && (
        <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{trainerNote}</p>
      )}
    </div>
  );
}

/*===== Cancelled Note =====*/
function CancelledNote({ enrollment }: { enrollment: TrainerEnrollment }) {
  const { cancelledByRole, cancellationReason, cancelledAt } = enrollment;
  const by = cancelledByRole === "customer" ? "صاحب سگ" : "مربی";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-pretty">
        {by} این آموزش را لغو کرد{cancelledAt ? ` (${formatRecordedDate(cancelledAt)})` : ""}.
      </p>
      {cancellationReason && (
        <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{cancellationReason}</p>
      )}
    </div>
  );
}
