import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { formatNumberFa } from "~/lib/digits";
import { ASSESSMENT_TRAINER_NOTES_MAX_LENGTH, MAX_RECOMMENDED_COURSES } from "~/orpc/assessment/constants";
import { client } from "~/orpc/client";
import { CoursePicker } from "~/routes/trainer_assessment_detail/components/course-picker";
import { MarkNoShow } from "~/routes/trainer_assessment_detail/components/mark-no-show";
import { RecommendationPath, type PathCourse } from "~/routes/trainer_assessment_detail/components/recommendation-path";

/*===== Outcome Form =====*/
/**
 * How it went: the note the customer will read and the path of recommended courses, pre-filled from the owner's
 * standing recommendations. Before the meeting starts it is shown read-only with the reason, so the trainer sees what
 * is coming and when it unlocks. «ارزیابی را ثبت کن» is the page's one gold-leaf action.
 *
 * @param courses Every approved course the trainer can recommend (not behavior modification, which starts from a
 * request).
 * @param suggested The starting path, already in order, and the courses marked «پیش‌فرض».
 * @param readOnly Booked, but the time hasn't come: nothing can be recorded yet.
 */
export function OutcomeForm({
  assessmentId,
  courses,
  suggested,
  readOnly,
}: {
  assessmentId: string;
  courses: readonly PathCourse[];
  suggested: readonly PathCourse[];
  readOnly: boolean;
}) {
  const revalidator = useRevalidator();
  const [notes, setNotes] = useState("");
  const [path, setPath] = useState<readonly PathCourse[]>(suggested);
  const [alert, setAlert] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const defaults = new Set(suggested.map((course) => course.slug));

  const complete = useMutation({
    mutationFn: () =>
      client.assessment.trainer.complete({
        id: assessmentId,
        trainerNotes: notes,
        recommendedCourseSlugs: path.map((course) => course.slug),
      }),
    onSuccess: async () => {
      toast.add({ title: "ارزیابی ثبت شد.", type: "success" });
      // The reloaded page shows the completed state.
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const failure = describeApiFailure({ error, fallback: "ثبت نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setFields(failure.fields);
      // A refusal means the assessment changed under us (recorded elsewhere, cancelled): show what it is now.
      if (failure.message && Object.keys(failure.fields).length === 0) await revalidator.revalidate();
    },
  });

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setAlert(null);
    setFields({});
    complete.mutate();
  }

  const available = courses.filter((course) => !path.some((chosen) => chosen.slug === course.slug));
  const pathFull = path.length >= MAX_RECOMMENDED_COURSES;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <FormAlert message={alert ?? undefined} />

      {/*------ Note to the Owner ------*/}
      <Field data-invalid={!!fields.trainerNotes}>
        <FieldLabel htmlFor="trainer-notes">یادداشت برای صاحب سگ</FieldLabel>
        <FieldDescription>صاحب سگ این را در پرونده‌ی سگش می‌بیند.</FieldDescription>
        <Textarea
          id="trainer-notes"
          value={notes}
          disabled={readOnly}
          maxLength={ASSESSMENT_TRAINER_NOTES_MAX_LENGTH}
          aria-invalid={!!fields.trainerNotes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-36"
          placeholder={readOnly ? undefined : "مثلاً: چه دیدی، از کجا شروع می‌کنید، تمرین‌های این هفته"}
        />
        <FieldError>{fields.trainerNotes}</FieldError>
      </Field>

      {/*------ The Path ------*/}
      <section aria-labelledby="path-title" className="flex flex-col gap-4">
        <div>
          <h3 id="path-title" className="font-extrabold">
            مسیر پیشنهادی
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">صاحب سگ همین ترتیب را در صفحه‌ی سگش می‌بیند.</p>
        </div>

        <RecommendationPath
          courses={path}
          defaults={defaults}
          onMove={
            readOnly
              ? undefined
              : ({ index, direction }) =>
                  setPath((current) => {
                    const next = [...current];
                    const [moved] = next.splice(index, 1);
                    if (moved) next.splice(index + direction, 0, moved);
                    return next;
                  })
          }
          onRemove={readOnly ? undefined : (index) => setPath((current) => current.filter((_, at) => at !== index))}
        />

        {!readOnly && (
          <div className="flex flex-col gap-2">
            <CoursePicker
              courses={available}
              disabled={pathFull}
              onAdd={(course) => setPath((current) => [...current, course])}
            />
            {pathFull && (
              <p className="text-sm text-muted-foreground">
                حداکثر {formatNumberFa(MAX_RECOMMENDED_COURSES)} دوره در مسیر جا دارد.
              </p>
            )}
            <FieldError>{fields.recommendedCourseSlugs}</FieldError>
          </div>
        )}
      </section>

      {/*------ Actions ------*/}
      {readOnly ? (
        <p className="border-s-2 border-primary/50 ps-3 text-sm text-pretty">
          بعد از شروع وقت می‌توانی نتیجه را ثبت کنی.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
          <Button type="submit" disabled={complete.isPending} className="w-full sm:w-auto sm:min-w-48">
            {complete.isPending && <Spinner data-icon="inline-start" />}
            ارزیابی را ثبت کن
          </Button>
          <MarkNoShow assessmentId={assessmentId} />
        </div>
      )}
    </form>
  );
}
