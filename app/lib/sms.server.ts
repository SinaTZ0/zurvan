import { and, desc, eq, gt } from "drizzle-orm";

import { db } from "~/db/client.server";
import { smsOutbox } from "~/db/schema";

/*===== SMS =====*/
// One place that "sends" SMS, so a real provider replaces it without touching callers. In showcase mode (the only
// mode until a provider is wired) every message is written to `sms_outbox` instead. The outbox is also the send log
// the sign-in rate limits count, so a real provider must keep writing it.

export type SmsKind = "sign-in-code" | "assessment-booked" | "assessment-cancelled";

/** Queues one SMS. In showcase mode it only lands in the outbox. */
export async function sendSms({ phoneNumber, kind, body }: { phoneNumber: string; kind: SmsKind; body: string }) {
  await db.insert(smsOutbox).values({ phoneNumber, kind, body });
}

/** How many messages of a kind went to a number since a moment, and when the latest one went. */
export async function recentSms({ phoneNumber, kind, since }: { phoneNumber: string; kind: SmsKind; since: Date }) {
  const rows = await db
    .select({ createdAt: smsOutbox.createdAt })
    .from(smsOutbox)
    .where(and(eq(smsOutbox.phoneNumber, phoneNumber), eq(smsOutbox.kind, kind), gt(smsOutbox.createdAt, since)))
    .orderBy(desc(smsOutbox.createdAt));
  return { count: rows.length, latest: rows[0]?.createdAt ?? null };
}
