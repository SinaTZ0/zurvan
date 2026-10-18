import type { DatabaseOrTransaction } from "~/db/client.server";
import { auditEvent } from "~/db/schema";

/*===== Audit Trail =====*/
/**
 * Writes one line of the audit trail (docs/app-spec.md, F5): who did what to which record, with the few facts worth
 * keeping. Call it inside the same transaction as the change, so a change and its record stand or fall together. `data`
 * must never hold a password, a phone number or the text of a private note.
 */
export async function recordAudit({
  db,
  actorId,
  action,
  entityType,
  entityId,
  data,
}: {
  db: DatabaseOrTransaction;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  data?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await db.insert(auditEvent).values({ actorId, action, entityType, entityId, data: data ?? null });
}
