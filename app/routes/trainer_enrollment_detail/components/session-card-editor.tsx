import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { toSessionBoxes } from "~/components/session-card";
import { formatNumberFa } from "~/lib/digits";
import { SESSION_PLACE_KIND_LABELS, SESSION_STATUS_LABELS } from "~/orpc/enrollment/constants";
import type { SessionOverlap, TrainerEnrollment } from "~/orpc/enrollment/contract";
import { BoxSlot } from "~/routes/trainer_enrollment_detail/components/box-slot";
import { PlannedSessions } from "~/routes/trainer_enrollment_detail/components/planned-sessions";
import type { EditDone } from "~/routes/trainer_enrollment_detail/components/session-editor";
import { formatMinutes, formatSessionWhen } from "~/routes/trainer_enrollment_detail/format";
import { formatSlotTime } from "~/lib/tehran-time";

/*===== Session Card Editor =====*/
/**
 * The enrollment's session card, editable: every box is the trigger of its own editor, so the trainer plans and
 * records the course on the card itself. Under it, the overlaps the last save came back with, the planned count with
 * its refund effect, and the written list of every session (cancelled ones included, which the card doesn't draw).
 *
 * @param now Passed from the loader so the server and the browser agree on what is overdue.
 */
export function SessionCardEditor({ enrollment, now }: { enrollment: TrainerEnrollment; now: Date }) {
  const revalidator = useRevalidator();
  const [overlaps, setOverlaps] = useState<SessionOverlap[]>([]);
  const [punchedId, setPunchedId] = useState<string | null>(null);

  const boxes = toSessionBoxes({ plannedSessions: enrollment.plannedSessions, sessions: enrollment.sessions });
  const missed = enrollment.sessions.filter((session) => session.status === "missed").length;

  function handleDone(done: EditDone) {
    // Every save replaces the warning: it is about the session just placed, not an earlier one.
    setOverlaps(done.overlaps ?? []);
    if (done.punchedSessionId) setPunchedId(done.punchedSessionId);
    void revalidator.revalidate();
  }

  return (
    <section aria-labelledby="sessions-title" className="flex flex-col gap-5">
      <h2 id="sessions-title" className="text-xl font-extrabold">
        جلسه‌ها
      </h2>

      {/*------ The Card ------*/}
      <div className="rounded-3xl bg-sunken p-4 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] sm:p-5">
        <ol aria-label="جلسه‌ها" className="flex flex-wrap gap-2">
          {boxes.map((box) => (
            <li key={box.session?.id ?? `empty-${box.index}`}>
              <BoxSlot
                box={box}
                enrollment={enrollment}
                // Only the session just marked held changes its key, so only its hole is pressed in.
                punchKey={box.session?.id === punchedId ? `punched-${punchedId}` : undefined}
                onDone={handleDone}
              />
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-pretty text-muted-foreground">
          {formatNumberFa(enrollment.usedSessions)} از {formatNumberFa(enrollment.plannedSessions)} جلسه گذشته
          {missed > 0 && `، ${formatNumberFa(missed)} غیبت`}.
          {enrollment.canSchedule && " روی هر جعبه بزن تا زمان بگذاری یا جلسه را ثبت کنی."}
        </p>
      </div>

      {/*------ Overlaps ------*/}
      {overlaps.length > 0 && <OverlapWarning overlaps={overlaps} onDismiss={() => setOverlaps([])} />}

      {/*------ Planned Count ------*/}
      <PlannedSessions
        key={`${enrollment.plannedSessions}-${enrollment.usedSessions}`}
        enrollment={enrollment}
        now={now}
      />

      {/*------ Written List ------*/}
      {enrollment.sessions.length > 0 && <SessionList enrollment={enrollment} now={now} />}
    </section>
  );
}

/*===== Overlap Warning =====*/
/** A clash is the trainer's call (two dogs on a walk, a quick swap), so it is told after saving and never blocks. */
function OverlapWarning({ overlaps, onDismiss }: { overlaps: SessionOverlap[]; onDismiss: () => void }) {
  return (
    <output className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm">
      <TriangleAlertIcon aria-hidden strokeWidth={1.7} className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <ul className="flex flex-col gap-1">
          {overlaps.map((overlap) => (
            <li key={`${overlap.kind}-${overlap.startsAt.toISOString()}-${overlap.label}`} className="text-pretty">
              با {overlap.label} ({formatSessionWhen(overlap.startsAt)}) هم‌پوشانی دارد.
            </li>
          ))}
        </ul>
        <p className="mt-1 text-muted-foreground">جلسه ذخیره شد؛ اگر لازم است زمانش را عوض کن.</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-sm font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        فهمیدم
      </button>
    </output>
  );
}

/*===== Session List =====*/
function SessionList({ enrollment, now }: { enrollment: TrainerEnrollment; now: Date }) {
  const sessions = [...enrollment.sessions].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return (
    <div>
      <h3 className="border-b pb-3 font-extrabold">فهرست جلسه‌ها</h3>
      <ul className="divide-y">
        {sessions.map((session) => {
          const overdue = session.status === "scheduled" && session.startsAt.getTime() <= now.getTime();
          return (
            <li key={session.id} className="flex flex-col gap-1 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-bold tabular-nums">
                  {formatSessionWhen(session.startsAt)}
                  <span className="sr-only">، ساعت {formatSlotTime(session.startsAt)}</span>
                </span>
                <span className={overdue ? "text-sm font-bold text-primary" : "text-sm text-muted-foreground"}>
                  {overdue ? "وقتش گذشته؛ ثبتش کن" : SESSION_STATUS_LABELS[session.status]}
                </span>
              </div>
              <p className="text-sm text-pretty text-muted-foreground">
                {SESSION_PLACE_KIND_LABELS[session.placeKind]}، {formatMinutes(session.durationMinutes)}
              </p>
              {session.trainerNote && (
                <p className="border-s-2 border-primary/40 ps-3 text-sm text-pretty whitespace-pre-line">
                  {session.trainerNote}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
