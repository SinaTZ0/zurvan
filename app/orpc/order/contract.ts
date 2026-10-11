import { oc } from "@orpc/contract";
import { z } from "zod";

import { TRAINING_GOALS } from "~/orpc/assessment/constants";
import { COURSE_PLACES } from "~/orpc/course/constants";
import { dogSchema } from "~/orpc/dog/contract";
import { ENROLLMENT_KINDS, ENROLLMENT_REFUND_RULES } from "~/orpc/enrollment/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";
import {
  INELIGIBILITY_KINDS,
  ORDER_PAYMENT_STATUSES,
  PAYMENT_STATUSES,
  UNAVAILABLE_KINDS,
} from "~/orpc/order/constants";

/*===== Schemas =====*/
const refundPolicySchema = z.object({ name: z.string(), percent: z.number().int() });

/** What the booking page needs to book a course or its test for one of the customer's dogs (spec 3.4, 3.8). */
export const bookingOptionsSchema = z.object({
  course: z.object({
    slug: z.string(),
    title: z.string(),
    latinName: z.string(),
    place: z.enum(COURSE_PLACES).nullable(),
    sessionCount: z.number().int().nullable(),
    minAgeMonths: z.number().int().nullable(),
    maxAgeMonths: z.number().int().nullable(),
    /** Rial: the course price, or the test price for a test. */
    price: z.number().int().nullable(),
    /** Rial. Null when boarding is priced on request and can't be booked online (B14). */
    boardingPrice: z.number().int().nullable(),
    /** Whether the course also offers a test, so the page can offer switching. */
    hasTest: z.boolean(),
    refundPolicy: refundPolicySchema.extend({ description: z.string() }),
    prerequisites: z.array(z.object({ slug: z.string(), title: z.string(), hasTest: z.boolean() })),
  }),
  kind: z.enum(ENROLLMENT_KINDS),
  /** Why the course (or its test) can't be booked online at all, in Persian; null when it can. */
  unavailableReason: z.string().nullable(),
  /** The same, as a value the page can pick the way out from. */
  unavailableKind: z.enum(UNAVAILABLE_KINDS).nullable(),
  dogs: z.array(
    z.object({
      dog: dogSchema,
      eligible: z.boolean(),
      /** Why this dog can't book it, each as a Persian sentence for the page. */
      problems: z.array(
        z.object({
          kind: z.enum(INELIGIBILITY_KINDS),
          message: z.string(),
          /** For `prerequisite`: the course to pass first (or its test). */
          courseSlug: z.string().nullable(),
          /** For `live-enrollment`: the enrollment the dog is in now. */
          enrollmentId: z.string().nullable(),
        }),
      ),
      /** It has passed this course already: booking is a retake the customer must confirm. */
      hasPassed: z.boolean(),
      /** The latest completed assessment that recommended this course for the dog. */
      recommendation: z.object({ assessmentId: z.string(), position: z.number().int() }).nullable(),
    }),
  ),
});

export type BookingOptions = z.infer<typeof bookingOptionsSchema>;

export const checkoutOrderItemSchema = z.object({
  id: z.string(),
  kind: z.enum(ENROLLMENT_KINDS),
  course: z.object({ slug: z.string(), title: z.string(), latinName: z.string() }),
  dog: z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() }),
  trainingGoal: z.enum(TRAINING_GOALS),
  boarding: z.boolean(),
  address: z.string().nullable(),
  preferredTimes: z.string(),
  isRetake: z.boolean(),
  /** Rial. */
  unitPrice: z.number().int(),
  boardingPrice: z.number().int(),
  discountAmount: z.number().int(),
  paidAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundPolicy: refundPolicySchema,
  /** Set once the order is paid. */
  enrollmentId: z.string().nullable(),
});

/** An order as its customer sees it, at checkout and afterwards. All amounts are Rial. */
export const checkoutOrderSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: z.enum(ORDER_PAYMENT_STATUSES),
  items: z.array(checkoutOrderItemSchema),
  subtotal: z.number().int(),
  discountCode: z.string().nullable(),
  discountAmount: z.number().int(),
  totalAmount: z.number().int(),
  paidFromWallet: z.number().int(),
  paidViaGateway: z.number().int(),
  refundedAmount: z.number().int(),
  /** The customer's wallet balance now. Only a positive balance can be spent. */
  walletBalance: z.number().int(),
  /** The newest gateway attempt, for the payment result. */
  payment: z
    .object({
      status: z.enum(PAYMENT_STATUSES),
      referenceId: z.string().nullable(),
      cardNumberMasked: z.string().nullable(),
      failureReason: z.string().nullable(),
      paidAt: z.date().nullable(),
    })
    .nullable(),
  createdAt: z.date(),
  paidAt: z.date().nullable(),
});

export type CheckoutOrder = z.infer<typeof checkoutOrderSchema>;

// Structure only; meaning is checked by `validation.ts`.
const bookingOptionsInputSchema = z.strictObject({ courseSlug: z.string(), kind: z.enum(ENROLLMENT_KINDS) });
const bookInputSchema = z.strictObject({
  courseSlug: z.string(),
  kind: z.string(),
  dogId: z.string(),
  trainingGoal: z.string(),
  boarding: z.boolean(),
  address: z.string().nullish(),
  preferredTimes: z.string(),
  confirmRetake: z.boolean().optional(),
  assessmentId: z.string().nullish(),
});
const orderIdInputSchema = z.strictObject({ id: z.string() });
const applyDiscountInputSchema = z.strictObject({ id: z.string(), code: z.string() });
const payInputSchema = z.strictObject({ id: z.string(), useWallet: z.boolean() });
const cancelEnrollmentInputSchema = z.strictObject({ enrollmentId: z.string(), reason: z.string().nullish() });

/*===== Errors =====*/
// Conflicts with the current state answer with HTTP 409 (see `errors.ts`) and carry a Persian message in
// `data.errors`. NOT_FOUND is also the answer for another customer's order or dog and a malformed id.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const bookErrors = {
  ...notFoundError,
  NOT_ELIGIBLE: {
    message: "The dog can't book this course.",
    data: errorDataSchema,
  },
};

const orderStateErrors = {
  ...notFoundError,
  NOT_PAYABLE: {
    message: "The order can't be paid now.",
    data: errorDataSchema,
  },
};

const cancelErrors = {
  ...notFoundError,
  NOT_CANCELLABLE: {
    message: "The enrollment can no longer be cancelled.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
export const bookingOptionsContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(bookingOptionsInputSchema)
  .output(bookingOptionsSchema);

export const bookContract = oc
  .errors({ ...baseErrors, ...bookErrors })
  .input(bookInputSchema)
  .output(z.object({ orderId: z.string() }));

export const getOrderContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(orderIdInputSchema)
  .output(checkoutOrderSchema);

/** A code that can't be used answers with INVALID_INPUT, its reason in `fields.code`. */
export const applyDiscountContract = oc
  .errors({ ...baseErrors, ...orderStateErrors })
  .input(applyDiscountInputSchema)
  .output(checkoutOrderSchema);

export const removeDiscountContract = oc
  .errors({ ...baseErrors, ...orderStateErrors })
  .input(orderIdInputSchema)
  .output(checkoutOrderSchema);

/**
 * Pays an order: from the wallet first when `useWallet`, the rest through the gateway. `paid` means it is done (the
 * wallet or a 0 total covered it); `redirect` means send the customer to the gateway's URL.
 */
export const payContract = oc
  .errors({ ...baseErrors, ...orderStateErrors })
  .input(payInputSchema)
  .output(
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("paid"), orderId: z.string() }),
      z.object({ kind: z.literal("redirect"), orderId: z.string(), url: z.string() }),
    ]),
  );

/**
 * Cancels an enrollment and refunds it into the customer's wallet (spec 3.9). A customer cancels their own, with the
 * refund policy; a trainer their own students' and the Admin anyone's, with the whole share of the unheld sessions,
 * and both must give a reason.
 */
export const cancelEnrollmentContract = oc
  .errors({ ...baseErrors, ...cancelErrors })
  .input(cancelEnrollmentInputSchema)
  .output(
    z.object({
      enrollmentId: z.string(),
      refund: z.object({ amount: z.number().int(), rule: z.enum(ENROLLMENT_REFUND_RULES) }),
    }),
  );

export const orderContract = {
  bookingOptions: bookingOptionsContract,
  book: bookContract,
  get: getOrderContract,
  applyDiscount: applyDiscountContract,
  removeDiscount: removeDiscountContract,
  pay: payContract,
  cancelEnrollment: cancelEnrollmentContract,
};
