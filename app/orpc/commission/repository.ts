import { and, asc, countDistinct, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { commission, partner, platformSetting, user } from "~/db/schema";
import type { CommissionTier } from "~/lib/business-rules";
import { COMMISSION_TIERS_SETTING_KEY } from "~/orpc/commission/constants";
import { resolveCommissionTiers } from "~/orpc/commission/validation";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type CommissionRecord = typeof commission.$inferSelect;

export type CommissionRow = {
  commission: CommissionRecord;
  partner: { id: string; name: string };
  customer: { id: string; name: string };
};

/*===== Reads =====*/
/** The commission steps in force: the stored ones, or the default when none are stored or the row is unreadable. */
export async function findCommissionTiers({ db }: Executor): Promise<CommissionTier[]> {
  const [row] = await db
    .select({ value: platformSetting.value })
    .from(platformSetting)
    .where(eq(platformSetting.key, COMMISSION_TIERS_SETTING_KEY));
  return resolveCommissionTiers(row?.value);
}

/** How many distinct customers have earned this partner a commission: the count the steps are read against (F7). */
export async function countPayingCustomers({ db, partnerId }: Executor & { partnerId: string }): Promise<number> {
  const [row] = await db
    .select({ count: countDistinct(commission.customerId) })
    .from(commission)
    .where(eq(commission.partnerId, partnerId));
  return row?.count ?? 0;
}

/** Whether this customer has already earned this partner a commission (a repeat buyer doesn't raise the count). */
export async function hasEarnedFromCustomer({
  db,
  partnerId,
  customerId,
}: Executor & { partnerId: string; customerId: string }): Promise<boolean> {
  const [row] = await db
    .select({ id: commission.id })
    .from(commission)
    .where(and(eq(commission.partnerId, partnerId), eq(commission.customerId, customerId)))
    .limit(1);
  return row !== undefined;
}

/**
 * The customer's partner, when they have one and it is active (F7: an inactive partner earns nothing). The partner's row
 * is locked until the transaction ends, so two of their customers paying at once are counted one after the other and
 * can't both land on the same step.
 */
export async function lockActivePartnerOfCustomer({
  db,
  customerId,
}: Executor & { customerId: string }): Promise<string | undefined> {
  const [row] = await db
    .select({ partnerId: partner.userId })
    .from(user)
    .innerJoin(partner, eq(user.referredByPartnerId, partner.userId))
    .where(and(eq(user.id, customerId), eq(partner.isActive, true)))
    .for("update", { of: partner });
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
 * Writes the commission unless the payment already has one. The unique index on the payment is the arbiter (F12), so a
 * repeated callback can't write a second.
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
    .onConflictDoNothing({ target: commission.paymentId })
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
