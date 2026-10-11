import { TRAINING_GOALS, type TrainingGoal } from "~/orpc/assessment/constants";
import { ENROLLMENT_KINDS, type EnrollmentKind } from "~/orpc/enrollment/constants";
import { toPublicMedia } from "~/orpc/media/mapper";
import {
  ORDER_PAYMENT_STATUSES,
  PAYMENT_STATUSES,
  type OrderPaymentStatus,
  type PaymentStatus,
} from "~/orpc/order/constants";
import type { CheckoutOrder } from "~/orpc/order/contract";
import type { OrderRow } from "~/orpc/order/repository";

/*===== Checkout Order =====*/
/**
 * Converts a stored order into what its customer sees. Plain-text values are narrowed; one the lists no longer know
 * fails loudly, since amounts and statuses shown wrongly would mislead about money.
 */
export function toCheckoutOrder({ row, walletBalance }: { row: OrderRow; walletBalance: number }): CheckoutOrder {
  const { order, latestPayment } = row;

  return {
    id: order.id,
    number: order.number,
    status: narrow(ORDER_PAYMENT_STATUSES, order.paymentStatus, "order status") as OrderPaymentStatus,
    items: row.items.map(({ item, course, dog, photo, enrollmentId }) => ({
      id: item.id,
      kind: narrow(ENROLLMENT_KINDS, item.kind, "order item kind") as EnrollmentKind,
      course: { slug: course.slug, title: course.title, latinName: course.latinName },
      dog: { id: dog.id, name: dog.name, photo: photo ? toPublicMedia(photo) : null },
      trainingGoal: narrow(TRAINING_GOALS, item.trainingGoal, "training goal") as TrainingGoal,
      boarding: item.boarding,
      address: item.address,
      preferredTimes: item.preferredTimes,
      isRetake: item.isRetake,
      unitPrice: item.unitPrice,
      boardingPrice: item.boardingPrice,
      discountAmount: item.discountAmount,
      paidAmount: item.paidAmount,
      refundedAmount: item.refundedAmount,
      refundPolicy: { name: item.refundPolicyName, percent: item.refundPolicyPercent },
      enrollmentId,
    })),
    subtotal: order.subtotal,
    discountCode: row.discountCode,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    paidFromWallet: order.paidFromWallet,
    paidViaGateway: order.paidViaGateway,
    refundedAmount: order.refundedAmount,
    walletBalance,
    payment: latestPayment && {
      status: narrow(PAYMENT_STATUSES, latestPayment.status, "payment status") as PaymentStatus,
      referenceId: latestPayment.referenceId,
      cardNumberMasked: latestPayment.cardNumberMasked,
      failureReason: latestPayment.failureReason,
      paidAt: latestPayment.paidAt,
    },
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}

/** @throws When `value` isn't one of `allowed`: corrupted data that should surface. */
function narrow(allowed: readonly string[], value: string, what: string): string {
  if (!allowed.includes(value)) throw new Error(`Unknown ${what}: ${value}`);
  return value;
}
