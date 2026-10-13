import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { commission, partner, platformSetting, user } from "~/db/schema";
import { COMMISSION_PERCENT_SETTING_KEY } from "~/orpc/commission/constants";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type CommissionRecord = typeof commission.$inferSelect;

export type CommissionRow = {
  commission: CommissionRecord;
  partner: { id: string; name: string };
  customer: { id: string; name: string };
};

/*===== Reads =====*/
/** The stored commission percentage, or null when the Admin never changed it (the caller falls back to the default). */
export async function findCommissionPercentSetting({ db }: Executor): Promise<number | null> {
  const [row] = await db
    .select({ value: platformSetting.value })
    .from(platformSetting)
    .where(eq(platformSetting.key, COMMISSION_PERCENT_SETTING_KEY));
  const percent = row ? Number(row.value) : Number.NaN;
  return Number.isInteger(percent) && percent >= 0 && percent <= 100 ? percent : null;
}

/** The customer's partner, when they have one and it is active (F7: an inactive partner earns nothing). */
export async function findActivePartnerOfCustomer({
  db,
  customerId,
}: Executor & { customerId: string }): Promise<string | undefined> {
  const [row] = await db
    .select({ partnerId: partner.userId })
    .from(user)
    .innerJoin(partner, eq(user.referredByPartnerId, partner.userId))
    .where(and(eq(user.id, customerId), eq(partner.isActive, true)));
  return row?.partnerId;
}

/** Commissions with the people around them, newest first. `partnerId` narrows them to one partner's. */
export async function findCommissions({
  db,
  partnerId,
  paid,
}: Executor & { partnerId?: string; paid?: boolean }): Promise<CommissionRow[]> {
  const partnerUser = alias(user, "partner_user");
  const customerUser = alias(user, "customer_user");

  return db
    .select({
      commission,
      partner: { id: partnerUser.id, name: partnerUser.name },
      customer: { id: customerUser.id, name: customerUser.name },
    })
    .from(commission)
    .innerJoin(partnerUser, eq(commission.partnerId, partnerUser.id))
    .innerJoin(customerUser, eq(commission.customerId, customerUser.id))
    .where(
      and(
        partnerId ? eq(commission.partnerId, partnerId) : undefined,
        paid === undefined ? undefined : paid ? isNotNull(commission.paidAt) : isNull(commission.paidAt),
      ),
    )
    .orderBy(desc(commission.createdAt), asc(commission.id));
}

/*===== Writes =====*/
/**
 * Writes the commission unless the customer already has one. The unique index on the customer is the arbiter (F12), so
 * "one commission per customer, ever" holds however many purchases race.
 *
 * @returns Whether a commission was written.
 */
export async function insertCommissionOnce({
  db,
  values,
}: Executor & { values: typeof commission.$inferInsert }): Promise<boolean> {
  const rows = await db
    .insert(commission)
    .values(values)
    .onConflictDoNothing({ target: commission.customerId })
    .returning({ id: commission.id });
  return rows.length > 0;
}

/** «پرداخت شد»: a conditional update, so a commission is marked paid once. Returns whether this call did. */
export async function markCommissionPaid({ db, id }: Executor & { id: string }): Promise<boolean> {
  const rows = await db
    .update(commission)
    .set({ paidAt: new Date() })
    .where(and(eq(commission.id, id), isNull(commission.paidAt)))
    .returning({ id: commission.id });
  return rows.length > 0;
}
