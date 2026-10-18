import { REFUND_STATUSES, type RefundStatus } from "~/orpc/refund/constants";
import type { MyRefund, Refund } from "~/orpc/refund/contract";
import type { RefundRecord } from "~/orpc/refund/repository";

/*===== Refund =====*/
function isRefundStatus(value: string): value is RefundStatus {
  return (REFUND_STATUSES as readonly string[]).includes(value);
}

/**
 * A stored refund as the Admin sees it: no `createdBy` (he is the only one who writes them).
 *
 * @throws When the status isn't a known value: it is only ever written by this service, so that means corrupted data
 * that should surface instead of showing a wrong state next to an amount of money.
 */
export function toRefund(record: RefundRecord): Refund {
  if (!isRefundStatus(record.status)) throw new Error(`Refund ${record.id} has an unknown status: ${record.status}`);
  return {
    id: record.id,
    paymentId: record.paymentId,
    paymentItemId: record.paymentItemId,
    amount: record.amount,
    status: record.status,
    reason: record.reason,
    reference: record.reference,
    createdAt: record.createdAt,
    paidAt: record.paidAt,
    cancelledAt: record.cancelledAt,
  };
}

/** The same for the customer whose payment it is: without the Admin's reason. */
export function toMyRefund(record: RefundRecord): MyRefund {
  const { reason: _reason, ...rest } = toRefund(record);
  return rest;
}
