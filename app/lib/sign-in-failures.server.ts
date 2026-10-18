import { and, count, eq, gte, lt } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { signInFailure } from "~/db/schema";
import { MAX_SIGN_IN_FAILURES, SIGN_IN_FAILURE_WINDOW_MINUTES } from "~/lib/user-constants";

/*===== Sign-in Failures =====*/
// Pauses a phone number after too many wrong passwords. The per-IP limit is Better-Auth's own; this one follows the
// number, so guessing from many addresses is slowed too. A paused number can still sign in with a code, which is the
// point: the owner of the number is never locked out, only the guessing is.

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Whether this number has had `MAX_SIGN_IN_FAILURES` wrong passwords inside the window. */
export async function isSignInPaused({
  db,
  phoneNumber,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  phoneNumber: string;
  now?: Date;
}): Promise<boolean> {
  const since = new Date(now.getTime() - SIGN_IN_FAILURE_WINDOW_MINUTES * MINUTE_MS);
  const [row] = await db
    .select({ failures: count() })
    .from(signInFailure)
    .where(and(eq(signInFailure.phoneNumber, phoneNumber), gte(signInFailure.createdAt, since)));
  return (row?.failures ?? 0) >= MAX_SIGN_IN_FAILURES;
}

/** Records one wrong password and drops every row older than a day, so the table never grows without bound. */
export async function recordSignInFailure({
  db,
  phoneNumber,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  phoneNumber: string;
  now?: Date;
}): Promise<void> {
  await db.insert(signInFailure).values({ phoneNumber, createdAt: now });
  await db.delete(signInFailure).where(lt(signInFailure.createdAt, new Date(now.getTime() - DAY_MS)));
}

/** A good sign-in forgives the number's earlier wrong passwords. */
export async function clearSignInFailures({
  db,
  phoneNumber,
}: {
  db: DatabaseOrTransaction;
  phoneNumber: string;
}): Promise<void> {
  await db.delete(signInFailure).where(eq(signInFailure.phoneNumber, phoneNumber));
}
