import { toSessionBoxes } from "~/components/session-card";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";

/*===== Session Positions =====*/
/** Where a session sits in its course: «جلسه‌ی ۳ از ۷» is `{ position: 3, planned: 7 }`. */
export type SessionPosition = { position: number; planned: number };

/**
 * The position of every live session of an enrollment, keyed by session id. It is the box the session has on the
 * enrollment's card, so the week view and the card always agree. The week view's own list can't say it: it only holds
 * the sessions of one week, and not how many the course is planned for.
 */
export function sessionPositions(enrollment: TrainerEnrollment): Record<string, SessionPosition> {
  const boxes = toSessionBoxes({ plannedSessions: enrollment.plannedSessions, sessions: enrollment.sessions });

  const positions: Record<string, SessionPosition> = {};
  for (const box of boxes) {
    if (box.session) positions[box.session.id] = { position: box.index + 1, planned: boxes.length };
  }
  return positions;
}
