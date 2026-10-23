import { z } from "zod";

import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { recordAudit } from "~/lib/audit.server";
import { formatToman } from "~/lib/course-format";
import { notify } from "~/lib/notify.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import { isUuid } from "~/lib/uuid";
import { REFUND_REASON_MAX_LENGTH, REFUND_REFERENCE_MAX_LENGTH } from "~/orpc/refund/constants";
import type { MyRefund, Refund } from "~/orpc/refund/contract";
import { toMyRefund, toRefund } from "~/orpc/refund/mapper";
import {
  findPaymentCustomerPhone,
  findPaymentIdsOfCustomer,
  findRefundById,
  findRefunds,
  findRefundsOfPayments,
  insertRefund,
  itemBelongsToPayment,
  lockPayment,
  markPending,
  sumStandingRefunds,
} from "~/orpc/refund/repository";

/*===== Types =====*/
type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

/*===== Reading =====*/
/** Every refund, newest first, or those of one payment (a malformed payment id has none). */
export async function adminListRefunds({
  db,
  paymentId,
}: {
  db: DatabaseOrTransaction;
  paymentId?: string;
}): Promise<Refund[]> {
  if (paymentId !== undefined && !isUuid(paymentId)) return [];
  return (await findRefunds({ db, ...(paymentId === undefined ? {} : { paymentId }) })).map(toRefund);
}

/**
 * The refunds of the customer's own payments, newest first, without the Admin's reasons. A refund the Admin withdrew
 * before paying it was never owed to anyone and is **not** returned: what the customer is told is decided here, not by
 * the page that happens to ask (F5).
 */
export async function listMyRefunds({
  db,
  customerId,
}: {
  db: DatabaseOrTransaction;
  customerId: string;
}): Promise<MyRefund[]> {
  const paymentIds = await findPaymentIdsOfCustomer({ db, customerId });
  const records = await findRefundsOfPayments({ db, paymentIds });
  return records.filter((record) => record.status !== "cancelled").map(toMyRefund);
}

/*===== Creating =====*/
type CreateResult = { kind: "success"; refund: Refund } | NotFoundResult | InvalidResult | { kind: "not-paid" };

const reasonSchema = z
  .string()
  .trim()
  .min(1, "دلیل بازپرداخت را بنویس.")
  .max(REFUND_REASON_MAX_LENGTH, `دلیل حداکثر ${REFUND_REASON_MAX_LENGTH} حرف است.`);

/**
 * Records a refund the Admin has decided, as `pending` (paying it out is done outside the app). It is only for a **paid**
 * payment, for a whole number of Rial above zero, and **the refunds that stand (pending or paid) can never add up to more
 * than the payment charged**. The check runs under a lock on the payment, so two refunds made at once can't both fit under
 * the limit, and it is written together with its line in the audit trail.
 */
export async function adminCreateRefund({
  db,
  adminId,
  input,
}: {
  db: Database;
  adminId: string;
  input: { paymentId: string; paymentItemId?: string | null | undefined; amount: number; reason: string };
}): Promise<CreateResult> {
  if (!isUuid(input.paymentId)) return { kind: "not-found" };

  const fields: Record<string, string> = {};
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success)
    fields.reason =
      issuesToErrorData(reason.error.issues.map((issue) => ({ ...issue, path: ["reason"] }))).fields.reason ?? "";
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0)
    fields.amount = "مبلغ باید یک عدد صحیح بیشتر از صفر باشد.";
  const itemId = input.paymentItemId ?? null;
  if (itemId !== null && !isUuid(itemId)) fields.paymentItemId = "این مورد مال این پرداخت نیست.";

  return db.transaction(async (tx): Promise<CreateResult> => {
    const paid = await lockPayment({ db: tx, paymentId: input.paymentId });
    if (!paid) return { kind: "not-found" };
    if (paid.status !== "paid") return { kind: "not-paid" };

    if (
      itemId !== null &&
      isUuid(itemId) &&
      !(await itemBelongsToPayment({ db: tx, paymentId: paid.id, paymentItemId: itemId }))
    ) {
      fields.paymentItemId = "این مورد مال این پرداخت نیست.";
    }
    if (!fields.amount) {
      const remaining = paid.amount - (await sumStandingRefunds({ db: tx, paymentId: paid.id }));
      if (input.amount > remaining) {
        fields.amount =
          remaining <= 0
            ? "برای این پرداخت چیزی برای بازپرداخت نمانده."
            : `بیشتر از مبلغ قابل بازپرداخت (${formatToman(remaining)}) نمی‌شود.`;
      }
    }
    if (Object.keys(fields).length > 0) return { kind: "invalid", errors: [], fields };

    const saved = await insertRefund({
      db: tx,
      values: {
        paymentId: paid.id,
        paymentItemId: itemId,
        amount: input.amount,
        reason: reason.success ? reason.data : "",
        createdBy: adminId,
      },
    });
    await recordAudit({
      db: tx,
      actorId: adminId,
      action: "refund.created",
      entityType: "refund",
      entityId: saved.id,
      data: { paymentId: paid.id, amount: saved.amount },
    });
    return { kind: "success", refund: toRefund(saved) };
  });
}

/*===== Answering =====*/
type AnswerResult = { kind: "success"; refund: Refund } | NotFoundResult | InvalidResult | { kind: "not-pending" };

const referenceSchema = z
  .string()
  .trim()
  .min(1, "کد پیگیری انتقال را بنویس.")
  .max(REFUND_REFERENCE_MAX_LENGTH, `کد پیگیری حداکثر ${REFUND_REFERENCE_MAX_LENGTH} حرف است.`);

/**
 * The Admin has paid a pending refund out: the transfer's reference is required and is kept. A refund answered once can't
 * be answered again (a conditional update), and the customer gets an SMS after the change is saved.
 */
export async function adminMarkRefundPaid({
  db,
  adminId,
  id,
  reference,
  now = new Date(),
}: {
  db: Database;
  adminId: string;
  id: string;
  reference: string;
  now?: Date;
}): Promise<AnswerResult> {
  if (!isUuid(id) || !(await findRefundById({ db, id }))) return { kind: "not-found" };

  const parsed = referenceSchema.safeParse(reference);
  if (!parsed.success) {
    return { kind: "invalid", errors: [], fields: { reference: parsed.error.issues[0]?.message ?? "" } };
  }

  const done = await db.transaction(async (tx) => {
    const changed = await markPending({ db: tx, id, values: { status: "paid", reference: parsed.data, paidAt: now } });
    if (!changed) return null;
    const saved = await findRefundById({ db: tx, id });
    if (!saved) throw new Error(`adminMarkRefundPaid: refund ${id} could not be read back`);
    await recordAudit({
      db: tx,
      actorId: adminId,
      action: "refund.paid",
      entityType: "refund",
      entityId: id,
      data: { paymentId: saved.paymentId, amount: saved.amount, reference: parsed.data },
    });
    return saved;
  });
  if (!done) return { kind: "not-pending" };

  // After the commit: the money has been given back and the screens show it; a lost SMS changes neither.
  await notify({
    phoneNumber: await findPaymentCustomerPhone({ db, paymentId: done.paymentId }),
    kind: "refund-paid",
    body: `زروان: ${formatToman(done.amount)} از پرداختت برگردانده شد (کد پیگیری: ${parsed.data}).`,
  });
  return { kind: "success", refund: toRefund(done) };
}

/** The Admin withdraws a refund that has not been paid. Once paid or cancelled it can't be changed. */
export async function adminCancelRefund({
  db,
  adminId,
  id,
  now = new Date(),
}: {
  db: Database;
  adminId: string;
  id: string;
  now?: Date;
}): Promise<AnswerResult> {
  if (!isUuid(id) || !(await findRefundById({ db, id }))) return { kind: "not-found" };

  const done = await db.transaction(async (tx) => {
    const changed = await markPending({ db: tx, id, values: { status: "cancelled", cancelledAt: now } });
    if (!changed) return null;
    const saved = await findRefundById({ db: tx, id });
    if (!saved) throw new Error(`adminCancelRefund: refund ${id} could not be read back`);
    await recordAudit({
      db: tx,
      actorId: adminId,
      action: "refund.cancelled",
      entityType: "refund",
      entityId: id,
      data: { paymentId: saved.paymentId, amount: saved.amount },
    });
    return saved;
  });
  return done ? { kind: "success", refund: toRefund(done) } : { kind: "not-pending" };
}
