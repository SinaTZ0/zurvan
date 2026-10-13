import { count, desc, eq, inArray, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { smsOutbox } from "~/db/schema";
import { SMS_KINDS, SMS_PAGE_SIZE, type SmsKind } from "~/orpc/sms/constants";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type SmsRecord = Omit<typeof smsOutbox.$inferSelect, "kind"> & { kind: SmsKind };

/*===== Reads =====*/
// Every query narrows to `SMS_KINDS`: a kind removed from the union stays in old rows, and must not reach the output
// schema, which would fail the whole page.

/** One page of the outbox, newest first. `id` breaks ties between messages written in the same instant. */
export async function findSmsPage({
  db,
  kind,
  page,
}: Executor & { kind?: SmsKind; page: number }): Promise<SmsRecord[]> {
  const rows = await db
    .select()
    .from(smsOutbox)
    .where(kindFilter({ kind }))
    .orderBy(desc(smsOutbox.createdAt), desc(smsOutbox.id))
    .limit(SMS_PAGE_SIZE)
    .offset(page * SMS_PAGE_SIZE);
  // The `where` above guarantees the kind is one of `SMS_KINDS`.
  return rows as SmsRecord[];
}

/** How many messages match the kind filter (all of them without one). */
export async function countSms({ db, kind }: Executor & { kind?: SmsKind }): Promise<number> {
  const [row] = await db.select({ value: count() }).from(smsOutbox).where(kindFilter({ kind }));
  return row?.value ?? 0;
}

/**
 * Messages per kind, ignoring any filter. One GROUP BY; a kind with no rows is absent.
 */
export async function countSmsByKind({ db }: Executor): Promise<Partial<Record<SmsKind, number>>> {
  const rows = await db
    .select({ kind: smsOutbox.kind, value: sql<number>`count(*)`.mapWith(Number) })
    .from(smsOutbox)
    .where(inArray(smsOutbox.kind, SMS_KINDS))
    .groupBy(smsOutbox.kind);
  return Object.fromEntries(rows.map((row) => [row.kind, row.value])) as Partial<Record<SmsKind, number>>;
}

/*===== Helpers =====*/
/** Only known kinds, plus the optional single kind the Admin filtered on (`undefined` adds no condition). */
function kindFilter({ kind }: { kind?: SmsKind }) {
  return kind ? eq(smsOutbox.kind, kind) : inArray(smsOutbox.kind, SMS_KINDS);
}
