import type { DatabaseOrTransaction } from "~/db/client.server";
import { calculateCommission, DEFAULT_PARTNER_COMMISSION_PERCENT } from "~/lib/business-rules";
import { formatNumberFa } from "~/lib/digits";
import { notify } from "~/lib/notify.server";
import { isUuid } from "~/lib/uuid";
import { user } from "~/db/schema";
import { eq } from "drizzle-orm";
import {
  findActivePartnerOfCustomer,
  findCommissionPercentSetting,
  findCommissions,
  insertCommissionOnce,
  markCommissionPaid,
} from "~/orpc/commission/repository";
import type { AdminCommission, PartnerCommission } from "~/orpc/commission/contract";
import { toAdminCommission, toPartnerCommission } from "~/orpc/commission/mapper";

/*===== Record =====*/
/**
 * F7: at a customer's first paid purchase, if they have an active partner, writes one commission: the setting's
 * percentage (default 10%) of the total of the enrollments that payment created, rounded down to the Rial.
 *
 * Runs inside the callback's transaction. Nothing is written when the payment created no enrollment (there is no base
 * to take a share of), and the customer's one commission is left for a later purchase that does. The unique index on
 * the customer keeps it to one however the purchases race.
 *
 * @returns Whether a commission was written.
 */
export async function recordFirstPurchaseCommission({
  db,
  customerId,
  paymentId,
  baseAmount,
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  paymentId: string;
  /** Rial: the total of the enrollments the payment created. */
  baseAmount: number;
}): Promise<boolean> {
  if (baseAmount <= 0) return false;

  const partnerId = await findActivePartnerOfCustomer({ db, customerId });
  if (!partnerId) return false;

  const percent = (await findCommissionPercentSetting({ db })) ?? DEFAULT_PARTNER_COMMISSION_PERCENT;
  return insertCommissionOnce({
    db,
    values: {
      partnerId,
      customerId,
      paymentId,
      baseAmount,
      percent,
      amount: calculateCommission({ baseAmount, percent }),
    },
  });
}

/*===== Lists =====*/
/** A partner's own commissions, newest first: paid or unpaid. No prices (F12). */
export async function listPartnerCommissions({
  db,
  partnerId,
}: {
  db: DatabaseOrTransaction;
  partnerId: string;
}): Promise<PartnerCommission[]> {
  return (await findCommissions({ db, partnerId })).map(toPartnerCommission);
}

/** Every commission, newest first; `paid` narrows them to paid or unpaid. */
export async function adminListCommissions({
  db,
  paid,
}: {
  db: DatabaseOrTransaction;
  paid?: boolean;
}): Promise<AdminCommission[]> {
  return (await findCommissions({ db, paid })).map(toAdminCommission);
}

/*===== Mark Paid =====*/
type MarkPaidResult =
  { kind: "success"; commission: AdminCommission } | { kind: "not-found" } | { kind: "already-paid"; errors: string[] };

/** The Admin has paid the partner outside the app and presses «پرداخت شد». The partner is told. */
export async function markPaid({ db, id }: { db: DatabaseOrTransaction; id: string }): Promise<MarkPaidResult> {
  if (!isUuid(id)) return { kind: "not-found" };

  const rows = await findCommissions({ db });
  const existing = rows.find((row) => row.commission.id === id);
  if (!existing) return { kind: "not-found" };

  if (!(await markCommissionPaid({ db, id }))) {
    return { kind: "already-paid", errors: ["این پورسانت قبلاً پرداخت شده."] };
  }

  const [partnerUser] = await db
    .select({ phoneNumber: user.phoneNumber })
    .from(user)
    .where(eq(user.id, existing.commission.partnerId));
  await notify({
    phoneNumber: partnerUser?.phoneNumber,
    kind: "commission-paid",
    body: `آموزش K9: پورسانت ${formatNumberFa(Math.round(existing.commission.amount / 10))} تومانی شما پرداخت شد.`,
  });

  const updated = (await findCommissions({ db })).find((row) => row.commission.id === id);
  if (!updated) throw new Error(`markPaid: commission ${id} could not be read back`);
  return { kind: "success", commission: toAdminCommission(updated) };
}
