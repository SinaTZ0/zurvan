import { cn } from "cn";

import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { isoToJalali, JALALI_MONTHS } from "~/lib/jalali";
import { formatSlotTime, utcToTehranParts } from "~/lib/tehran-time";
import type { TrainingSession } from "~/orpc/enrollment/contract";
import { SESSION_STATUS_LABELS } from "~/orpc/enrollment/constants";

/*===== Session Card =====*/
// The training's punch card (docs/training-design.md, "The One Idea"): one box per planned session, in order. Held
// sessions are punched, missed ones punched and struck through, scheduled ones outlined in gold with their time, the
// rest empty. The boxes still empty or outlined are the "unheld sessions" a refund is counted on, so the card shows the
// refund rule without a sentence.

/*===== Boxes =====*/
export type SessionBoxState = "empty" | "scheduled" | "held" | "missed";

export type SessionBoxData = {
  /** 0-based position on the card. */
  index: number;
  /** The session in this box, or null for one not scheduled yet. */
  session: TrainingSession | null;
  state: SessionBoxState;
};

/**
 * Lays an enrollment's sessions onto its boxes: the sessions that weren't cancelled, oldest first, then empty boxes up
 * to the planned count. A trainer who schedules more than planned gets a box for each extra one, so no session is ever
 * hidden.
 */
export function toSessionBoxes({
  plannedSessions,
  sessions,
}: {
  plannedSessions: number;
  sessions: TrainingSession[];
}): SessionBoxData[] {
  // oxlint-disable-next-line unicorn/no-array-sort -- `filter` made a fresh array; `toSorted` needs ES2023 types.
  const live = sessions.filter((session) => session.status !== "cancelled").sort(byStart);
  const count = Math.max(plannedSessions, live.length);

  return Array.from({ length: count }, (_, index) => {
    const session = live[index] ?? null;
    const state: SessionBoxState = session ? (session.status === "cancelled" ? "empty" : session.status) : "empty";
    return { index, session, state };
  });
}

function byStart(a: TrainingSession, b: TrainingSession): number {
  return a.startsAt.getTime() - b.startsAt.getTime();
}

/** «۱۲ مهر»: a box is too small for the weekday. */
function shortDay(date: Date): string {
  const { month, day } = isoToJalali(utcToTehranParts(date).date);
  return `${toPersianDigits(String(day))} ${JALALI_MONTHS[month - 1]}`;
}

/** What a screen reader hears for one box. */
function describeBox(box: SessionBoxData): string {
  const position = `جلسه‌ی ${formatNumberFa(box.index + 1)}`;
  if (!box.session) return `${position}: هنوز زمان‌بندی نشده`;
  const when = `${shortDay(box.session.startsAt)}، ساعت ${formatSlotTime(box.session.startsAt)}`;
  return `${position}: ${SESSION_STATUS_LABELS[box.session.status]}، ${when}`;
}

export type SessionCardSize = "strip" | "full";

/*------ Box ------*/
/**
 * One box of the card. Exported so the trainer's editable card can wrap each box in its own control (a popover
 * trigger) and still draw it the same way.
 *
 * @param highlighted Marks a box that a refund counts as unheld, in the cancel dialog.
 * @param punchKey Changing it replays the punch, when the trainer has just marked the session held.
 */
export function SessionBox({
  box,
  size,
  highlighted = false,
  punchKey,
  className,
}: {
  box: SessionBoxData;
  size: SessionCardSize;
  highlighted?: boolean;
  punchKey?: string;
  className?: string;
}) {
  const { state, session } = box;

  /*------ Strip ------*/
  if (size === "strip") {
    return (
      <span
        className={cn(
          "relative flex h-[1.125rem] w-3.5 items-center justify-center rounded-[3px] border",
          state === "empty" && "border-border",
          state === "scheduled" && "border-primary",
          (state === "held" || state === "missed") && "border-border",
          highlighted && "bg-primary/15",
          className,
        )}
      >
        {state === "held" && (
          <span className="size-2 rounded-full bg-primary shadow-[inset_0_1px_2px_rgb(0_0_0/0.5)]" />
        )}
        {state === "missed" && <MissedHole small />}
      </span>
    );
  }

  /*------ Full ------*/
  return (
    <span
      className={cn(
        "relative flex h-24 w-[4.75rem] flex-col items-center justify-between rounded-lg border px-1 pt-1.5 pb-2 text-center",
        state === "empty" && "border-dashed border-border/70",
        state === "scheduled" && "border-primary bg-primary/5",
        (state === "held" || state === "missed") && "border-border bg-card",
        highlighted && "bg-primary/10 ring-2 ring-primary/60 ring-offset-2 ring-offset-sunken",
        className,
      )}
    >
      {/* The position: sessions are a sequence, so the number means something. */}
      <span className="self-start ps-0.5 text-[0.6875rem] leading-none text-muted-foreground tabular-nums">
        {formatNumberFa(box.index + 1)}
      </span>

      {state === "empty" && <span className="text-xs text-muted-foreground/70">—</span>}
      {state === "scheduled" && session && (
        <span className="text-sm leading-tight font-extrabold tabular-nums">{formatSlotTime(session.startsAt)}</span>
      )}
      {state === "held" && (
        <span
          key={punchKey}
          className="size-7 rounded-full bg-primary shadow-[inset_0_2px_5px_rgb(0_0_0/0.55)] motion-safe:animate-punch"
        />
      )}
      {state === "missed" && <MissedHole />}

      <span className="text-[0.6875rem] leading-none whitespace-nowrap text-muted-foreground">
        {session ? shortDay(session.startsAt) : " "}
      </span>
    </span>
  );
}

/** A punched hole with a diagonal stroke: the session is used up, but nothing happened in it. */
function MissedHole({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "relative rounded-full border border-muted-foreground/60",
        small ? "size-2" : "size-7",
        "after:absolute after:inset-x-[-15%] after:top-1/2 after:h-px after:-rotate-45 after:bg-muted-foreground/80",
      )}
    />
  );
}

/*------ Card ------*/
/**
 * The whole card: a strip for lists, or the full card on an enrollment's page. Boxes that `highlightUnheld` marks are
 * the ones a refund is counted on.
 */
export function SessionCard({
  plannedSessions,
  sessions,
  size,
  highlightUnheld = false,
  caption,
  className,
}: {
  plannedSessions: number;
  sessions: TrainingSession[];
  size: SessionCardSize;
  highlightUnheld?: boolean;
  /** A line under the full card, e.g. «۴ از ۱۲ جلسه برگزار شد». */
  caption?: React.ReactNode;
  className?: string;
}) {
  const boxes = toSessionBoxes({ plannedSessions, sessions });

  const list = (
    <ol aria-label="جلسه‌ها" className={cn("flex flex-wrap", size === "strip" ? "gap-1" : "gap-2")}>
      {boxes.map((box) => (
        <li key={box.session?.id ?? `empty-${box.index}`} aria-label={describeBox(box)}>
          <SessionBox
            box={box}
            size={size}
            highlighted={highlightUnheld && (box.state === "empty" || box.state === "scheduled")}
          />
        </li>
      ))}
    </ol>
  );

  if (size === "strip") return <div className={className}>{list}</div>;

  return (
    <div className={cn("rounded-3xl bg-sunken p-4 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] sm:p-5", className)}>
      {list}
      {caption && <p className="mt-4 text-sm text-pretty text-muted-foreground">{caption}</p>}
    </div>
  );
}

/*===== Counts =====*/
/** Held and missed sessions are both used up (B11). */
export function countUsedSessions(sessions: TrainingSession[]): number {
  return sessions.filter((session) => session.status === "held" || session.status === "missed").length;
}
