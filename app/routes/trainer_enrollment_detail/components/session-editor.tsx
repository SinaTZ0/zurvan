import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { FormAlert } from "~/components/form-alert";
import type { SessionBoxData } from "~/components/session-card";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { describeApiFailure } from "~/lib/api-error";
import { SESSION_NOTE_MAX_LENGTH, SESSION_PLACE_KIND_LABELS } from "~/orpc/enrollment/constants";
import type { SessionOverlap, TrainerEnrollment, TrainingSession } from "~/orpc/enrollment/contract";
import { client } from "~/orpc/client";
import { ScheduleForm } from "~/routes/trainer_enrollment_detail/components/schedule-form";
import { formatMinutes, formatSessionWhen } from "~/routes/trainer_enrollment_detail/format";

/** What the card learns from a saved edit: overlaps to warn about, or the session just punched. */
export type EditDone = { overlaps?: SessionOverlap[]; punchedSessionId?: string };

/*===== Session Editor =====*/
/**
 * What opens from a box, by its state: the composer for an empty one; for a scheduled one its details, «برگزار شد» and
 * «غیبت» once its time has started, and moving or cancelling it; for a held or missed one its note.
 */
export function SessionEditor({
  enrollment,
  box,
  onDone,
}: {
  enrollment: TrainerEnrollment;
  box: SessionBoxData;
  onDone: (done: EditDone) => void;
}) {
  const { session } = box;

  if (!session) {
    return <ScheduleForm enrollment={enrollment} onSaved={(overlaps) => onDone({ overlaps })} />;
  }
  if (session.status === "scheduled") {
    return <ScheduledSession enrollment={enrollment} session={session} onDone={onDone} />;
  }
  return <RecordedSession session={session} onDone={onDone} />;
}

/*===== Session Summary =====*/
function SessionSummary({ session }: { session: TrainingSession }) {
  return (
    <dl className="flex flex-col gap-1 text-sm">
      <div className="flex flex-wrap gap-x-2">
        <dt className="sr-only">زمان</dt>
        <dd className="font-bold">
          {formatSessionWhen(session.startsAt)}، {formatMinutes(session.durationMinutes)}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2 text-muted-foreground">
        <dt className="sr-only">محل</dt>
        <dd className="text-pretty">
          {SESSION_PLACE_KIND_LABELS[session.placeKind]}: {session.place}
        </dd>
      </div>
    </dl>
  );
}

/*===== Note Field =====*/
function NoteField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>یادداشت برای صاحب سگ</FieldLabel>
      <Textarea
        id={id}
        value={value}
        maxLength={SESSION_NOTE_MAX_LENGTH}
        aria-invalid={!!error}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24"
        placeholder="مثلاً: امروز روی «بمان» کار کردیم؛ این هفته روزی دو بار تمرین کنید."
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/*===== Scheduled Session =====*/
type ScheduledView = "main" | "move" | "cancel";

function ScheduledSession({
  enrollment,
  session,
  onDone,
}: {
  enrollment: TrainerEnrollment;
  session: TrainingSession;
  onDone: (done: EditDone) => void;
}) {
  const [view, setView] = useState<ScheduledView>("main");
  const [note, setNote] = useState("");
  const [alert, setAlert] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | undefined>();
  // Read once on opening: whether the session has begun decides what can be recorded, and the API checks again.
  const [started] = useState(() => session.startsAt.getTime() <= Date.now());

  function fail(error: unknown, fallback: string) {
    const failure = describeApiFailure({ error, fallback });
    setAlert(failure.message);
    setNoteError(failure.fields.trainerNote);
  }

  const mark = useMutation({
    mutationFn: (status: "held" | "missed") =>
      client.enrollment.trainer.markSession({ sessionId: session.id, status, trainerNote: note }),
    onSuccess: (_, status) => onDone({ punchedSessionId: status === "held" ? session.id : undefined }),
    onError: (error) => fail(error, "ثبت نشد. دوباره امتحان کن."),
  });

  const cancel = useMutation({
    mutationFn: () => client.enrollment.trainer.cancelSession({ sessionId: session.id }),
    onSuccess: () => onDone({}),
    onError: (error) => fail(error, "لغو نشد. دوباره امتحان کن."),
  });

  /*------ Move ------*/
  if (view === "move") {
    return (
      <div className="flex flex-col gap-4">
        <ScheduleForm enrollment={enrollment} session={session} onSaved={(overlaps) => onDone({ overlaps })} />
        <Button type="button" variant="ghost" onClick={() => setView("main")}>
          برگرد
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SessionSummary session={session} />
      <FormAlert message={alert ?? undefined} />

      {/*------ Record ------*/}
      {started ? (
        <div className="flex flex-col gap-3">
          <NoteField id="mark-note" value={note} onChange={setNote} error={noteError} />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={mark.isPending} onClick={() => mark.mutate("held")}>
              {mark.isPending && mark.variables === "held" && <Spinner data-icon="inline-start" />}
              برگزار شد
            </Button>
            <Button type="button" variant="outline" disabled={mark.isPending} onClick={() => mark.mutate("missed")}>
              {mark.isPending && mark.variables === "missed" && <Spinner data-icon="inline-start" />}
              غیبت
            </Button>
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            غیبت هم یک جلسه‌ی مصرف‌شده حساب می‌شود و در بازپرداخت دیده می‌شود.
          </p>
        </div>
      ) : (
        <p className="border-s-2 border-primary/50 ps-3 text-sm text-pretty">
          بعد از شروع وقت می‌توانی «برگزار شد» یا «غیبت» را ثبت کنی.
        </p>
      )}

      {/*------ Move or Cancel ------*/}
      <div className="flex flex-col gap-2 border-t pt-4">
        {view === "cancel" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-pretty">این جلسه لغو شود؟ برای صاحب سگ پیامک می‌رود و جعبه‌اش خالی می‌شود.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setView("main")}>
                برگرد
              </Button>
              <Button type="button" variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
                {cancel.isPending && <Spinner data-icon="inline-start" />}
                لغو کن
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" onClick={() => setView("move")}>
              زمان را عوض کن
            </Button>
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => setView("cancel")}>
              لغو جلسه
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/*===== Recorded Session =====*/
/** A held or missed session: only its note changes; what happened in it is a fact. */
function RecordedSession({ session, onDone }: { session: TrainingSession; onDone: (done: EditDone) => void }) {
  const [note, setNote] = useState(session.trainerNote ?? "");
  const [alert, setAlert] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | undefined>();

  const save = useMutation({
    mutationFn: () => client.enrollment.trainer.updateSessionNote({ sessionId: session.id, trainerNote: note }),
    onSuccess: () => onDone({}),
    onError: (error) => {
      const failure = describeApiFailure({ error, fallback: "ذخیره نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setNoteError(failure.fields.trainerNote);
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setAlert(null);
        setNoteError(undefined);
        save.mutate();
      }}
    >
      <SessionSummary session={session} />
      <FormAlert message={alert ?? undefined} />
      <NoteField id="recorded-note" value={note} onChange={setNote} error={noteError} />
      <Button type="submit" disabled={save.isPending} className="w-full">
        {save.isPending && <Spinner data-icon="inline-start" />}
        یادداشت را ذخیره کن
      </Button>
    </form>
  );
}
