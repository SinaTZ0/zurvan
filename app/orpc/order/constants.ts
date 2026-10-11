/*===== Order Constants =====*/
// Browser-safe values shared by the API, the seed and the booking and checkout screens. Stored as plain text (see
// `app/db/schema.ts`).

/*===== Order Status =====*/
export const ORDER_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially-refunded",
] as const;

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شد",
  failed: "ناموفق",
  cancelled: "لغو شد",
  refunded: "بازگشت داده شد",
  "partially-refunded": "بخشی بازگشت داده شد",
};

/*===== Payment Status =====*/
export const PAYMENT_STATUSES = ["pending", "succeeded", "failed"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/*===== Discount Codes =====*/
export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_SCOPES = ["all", "selected"] as const;

export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

export const DISCOUNT_CODE_MAX_LENGTH = 40;

/*===== Eligibility =====*/
// Why a dog can't book a course (spec 3.8). Each comes with a Persian sentence for the booking page.
export const INELIGIBILITY_KINDS = [
  /** A course needs a record: a new dog starts with the free assessment. */
  "no-record",
  /** A required course, or its test, isn't passed yet. */
  "prerequisite",
  "too-young",
  "too-old",
  /** The dog is already enrolled in this course (scheduling or active). */
  "live-enrollment",
] as const;

export type IneligibilityKind = (typeof INELIGIBILITY_KINDS)[number];

/** Why a course, or its test, can't be booked online at all. */
export const UNAVAILABLE_KINDS = [
  /** Behavior modification starts from a request with a video. */
  "behavior-request",
  /** No list price yet (working and sport dogs): it starts from the free assessment. */
  "no-price",
  /** `?kind=test` on a course without a test. */
  "no-test",
] as const;

export type UnavailableKind = (typeof UNAVAILABLE_KINDS)[number];

/*===== Booking Limits =====*/
export const BOOKING_ADDRESS_MAX_LENGTH = 300;
export const BOOKING_PREFERRED_TIMES_MAX_LENGTH = 500;

/*===== Gateway =====*/
/** The fake gateway of showcase mode: it always succeeds (docs/foundations-plan.md, "Showcase Shortcuts"). */
export const DEMO_GATEWAY = "demo";
