import { eq } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { user } from "~/db/schema";
import { sendSms, type SmsKind } from "~/lib/sms.server";

/*===== Notifications =====*/
// docs/app-spec.md, F9. Sent after the change they report has been committed.

/**
 * Sends an SMS, or does nothing without a number. A failure is logged instead of failing the request: the change has
 * happened and the screens show it.
 */
export async function notify({
  phoneNumber,
  kind,
  body,
}: {
  phoneNumber: string | null | undefined;
  kind: SmsKind;
  body: string;
}): Promise<void> {
  if (!phoneNumber) return;
  try {
    await sendSms({ phoneNumber, kind, body });
  } catch (error) {
    console.error(`[notify] could not send the ${kind} SMS`, error);
  }
}

/** The Admin's phone number, for the events he has to act on. There is exactly one Admin (F1). */
export async function findAdminPhoneNumber({ db }: { db: DatabaseOrTransaction }): Promise<string | null> {
  const [row] = await db.select({ phoneNumber: user.phoneNumber }).from(user).where(eq(user.role, "admin")).limit(1);
  return row?.phoneNumber ?? null;
}
