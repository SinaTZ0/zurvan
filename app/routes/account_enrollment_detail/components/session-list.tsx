import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import { SESSION_PLACE_KIND_LABELS, SESSION_STATUS_LABELS } from "~/orpc/enrollment/constants";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";

const STATUS_TONES = {
  scheduled: "text-primary",
  held: "text-success",
  missed: "text-muted-foreground",
  cancelled: "text-muted-foreground",
} as const;

/*===== Session List =====*/
/**
 * Every session the dog has had or will have, oldest first, as a ruled list: when, where, how it went, and the
 * trainer's note as a quote. Cancelled sessions appear here and nowhere on the card, so nothing the customer was told
 * ever disappears; they carry no number, because the card doesn't count them.
 */
export function SessionList({
  sessions,
  address,
}: {
  sessions: CustomerEnrollment["sessions"];
  /** The enrollment's own address, which the details already give: a session at it needs only its kind. */
  address: string | null;
}) {
  // The number counts only sessions that stand, so it matches the card's boxes.
  const positions = sessions.map(
    (_, index) => sessions.slice(0, index + 1).filter((s) => s.status !== "cancelled").length,
  );

  return (
    <ol className="divide-y border-y">
      {sessions.map((session, index) => {
        const cancelled = session.status === "cancelled";
        const position = positions[index] ?? 0;

        return (
          <li key={session.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 py-4">
            <span aria-hidden className="pt-0.5 text-lg font-extrabold text-primary tabular-nums">
              {cancelled ? "" : formatNumberFa(position)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className={cn("font-bold", cancelled && "text-muted-foreground line-through")}>
                  {formatSlotDay(session.startsAt)}، ساعت {formatSlotTime(session.startsAt)}
                </p>
                <p className={cn("text-sm font-bold", STATUS_TONES[session.status])}>
                  {SESSION_STATUS_LABELS[session.status]}
                </p>
              </div>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {SESSION_PLACE_KIND_LABELS[session.placeKind]}
                {session.place && session.place !== address && ` · ${session.place}`}
                {` · ${formatNumberFa(session.durationMinutes)} دقیقه`}
              </p>
              {session.trainerNote && (
                <p className="mt-3 border-s-2 border-primary/40 ps-3 leading-relaxed text-pretty whitespace-pre-line">
                  {session.trainerNote}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
