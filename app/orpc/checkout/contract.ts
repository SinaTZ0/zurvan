import { oc } from "@orpc/contract";
import { z } from "zod";

import { INELIGIBILITY_KINDS } from "~/lib/eligibility";
import { PAYMENT_STATUSES } from "~/orpc/checkout/constants";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { EVALUATION_PERIODS, EVALUATION_WEEKDAYS } from "~/orpc/evaluation/constants";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
const ineligibilitySchema = z.object({
  kind: z.enum(INELIGIBILITY_KINDS),
  /** Persian, for the page as it is. */
  message: z.string(),
  /** For `prerequisite`: the course to finish first. */
  courseSlug: z.string().nullable(),
});

const dogSummarySchema = z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() });

/**
 * When the customer is usually free, for the call that arranges the lessons (F5): the weekdays and the parts of the day, in
 * the same words as an evaluation request. A preference, never a booked time. Bounded so a request can't be padded.
 */
const availableDaysSchema = z.array(z.enum(EVALUATION_WEEKDAYS)).max(EVALUATION_WEEKDAYS.length);
const availablePeriodsSchema = z.array(z.enum(EVALUATION_PERIODS)).max(EVALUATION_PERIODS.length);

/** F4: whether one dog can take a course, and why not. */
const verdictSchema = z.object({ eligible: z.boolean(), problems: z.array(ineligibilitySchema) });

/** One of the customer's dogs against a course, for Course Detail. */
export const dogEligibilitySchema = verdictSchema.extend({ dog: dogSummarySchema });

export type DogEligibility = z.infer<typeof dogEligibilitySchema>;

/** One item of the browser's cart: one course for one dog. */
export const cartItemSchema = z.strictObject({ courseSlug: z.string(), dogId: z.string() });

export type CartItem = z.infer<typeof cartItemSchema>;

/**
 * A cart item read fresh from the server (F5): the course's current price and the dog's eligibility today. `course` and
 * `dog` are null for an item whose course was removed or whose dog isn't the customer's: it is shown as unavailable.
 */
export const reviewedItemSchema = verdictSchema.extend({
  courseSlug: z.string(),
  dogId: z.string(),
  course: z.object({ slug: z.string(), title: z.string(), latinName: z.string() }).nullable(),
  dog: dogSummarySchema.nullable(),
  /** Rial. Null when the course isn't sold. */
  price: z.number().int().nullable(),
});

export type ReviewedItem = z.infer<typeof reviewedItemSchema>;

export const cartReviewSchema = z.object({
  items: z.array(reviewedItemSchema),
  /** Rial: the sum of the eligible items, the full price. */
  total: z.number().int(),
  /** The deposit percent in force now (100: the whole price is taken). */
  depositPercent: z.number().int(),
  /** Rial: what «پرداخت» would charge now, of `total`; the rest is settled when the lessons are arranged. */
  dueNow: z.number().int(),
});

export type CartReview = z.infer<typeof cartReviewSchema>;

/** A payment as its customer sees it, with the enrollment each item bought. All amounts are Rial. */
export const paymentItemSchema = z.object({
  id: z.string(),
  course: z.object({ slug: z.string(), title: z.string() }),
  dog: z.object({ id: z.string(), name: z.string() }),
  price: z.number().int(),
  /** Set once the payment is paid and the item got its enrollment. */
  enrollment: z.object({ id: z.string(), status: z.string() }).nullable(),
});

export const paymentSchema = z.object({
  id: z.string(),
  status: z.enum(PAYMENT_STATUSES),
  /** Rial charged at the gateway: the whole price, or the deposit. */
  amount: z.number().int(),
  /** Rial: the full price of what was bought. Equal to `amount` unless a deposit was taken. */
  totalAmount: z.number().int(),
  /** The deposit percent the payment was made with (100: the whole price). */
  depositPercent: z.number().int(),
  /** When the customer said they are usually free, for coordination; empty when they gave none. */
  availableDays: availableDaysSchema,
  availablePeriods: availablePeriodsSchema,
  referenceId: z.string().nullable(),
  cardNumberMasked: z.string().nullable(),
  failureReason: z.string().nullable(),
  items: z.array(paymentItemSchema),
  createdAt: z.date(),
  paidAt: z.date().nullable(),
});

export type Payment = z.infer<typeof paymentSchema>;

/** The Admin's view: with the customer, and the items that were paid for but got no enrollment (F5). */
export const adminPaymentSchema = paymentSchema.extend({
  customer: z.object({ id: z.string(), name: z.string(), phoneNumber: z.string().nullable() }),
  items: z.array(paymentItemSchema.extend({ paidNotEnrolled: z.boolean() })),
  paidNotEnrolledCount: z.number().int(),
});

export type AdminPayment = z.infer<typeof adminPaymentSchema>;

/** One of the customer's own dogs against every approved course (F4), for the purchase page that starts from the dog. */
export const myDogCourseSchema = verdictSchema.extend({ courseSlug: z.string() });

export type MyDogCourse = z.infer<typeof myDogCourseSchema>;

/** Every approved course against one dog, for the Admin's Dog Detail. */
export const adminDogEligibilitySchema = z.array(
  verdictSchema.extend({ course: z.object({ slug: z.string(), title: z.string() }) }),
);

// Structure only; the item limit and meaning are checked by `validation.ts`.
const eligibilityInputSchema = z.strictObject({ courseSlug: z.string() });
const itemsInputSchema = z.strictObject({ items: z.array(cartItemSchema) });
/** «پرداخت»: the items, and optionally when the customer is usually free (F5). */
export const payInputSchema = z.strictObject({
  items: z.array(cartItemSchema),
  availableDays: availableDaysSchema.optional(),
  availablePeriods: availablePeriodsSchema.optional(),
});
const adminPaymentsInputSchema = z.strictObject({ status: z.enum(PAYMENT_STATUSES).optional() });
const adminDogEligibilityInputSchema = z.strictObject({ dogId: z.string() });

/*===== Errors =====*/
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const payErrors = {
  NOT_ELIGIBLE: {
    message: "An item in the cart can't be bought.",
    data: errorDataSchema,
  },
  /** Site rules are published and the customer has not accepted the version in force (F13). Nothing was saved. */
  RULES_NOT_ACCEPTED: {
    message: "Accept the site rules first.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
/** Which of the customer's dogs can take a course, and why not (F4), for Course Detail. */
export const dogEligibilityContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(eligibilityInputSchema)
  .output(z.array(dogEligibilitySchema));

/**
 * Every approved course against one of the customer's own dogs, with whether it can take it and why not (F4). The server
 * decides, so the purchase page can't offer what «پرداخت» would refuse. Another owner's dog, a made-up id and a malformed
 * one are `NOT_FOUND`.
 */
export const myDogCoursesContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(z.strictObject({ dogId: z.string() }))
  .output(z.array(myDogCourseSchema));

/** The cart's items with current prices and eligibility. */
export const reviewCartContract = oc.errors(baseErrors).input(itemsInputSchema).output(cartReviewSchema);

/**
 * «پرداخت»: checks every item again, saves a pending payment listing them at their current prices and returns where to
 * send the customer to pay. Answers NOT_ELIGIBLE, with the reasons, when any item can't be bought any more: the
 * customer reviews the cart again instead of paying a total different from the one they saw.
 */
export const payCartContract = oc
  .errors({ ...baseErrors, ...payErrors })
  .input(payInputSchema)
  .output(z.object({ url: z.string() }));

export const listMyPaymentsContract = oc.errors(baseErrors).output(z.array(paymentSchema));

export const adminListPaymentsContract = oc
  .errors(baseErrors)
  .input(adminPaymentsInputSchema)
  .output(z.array(adminPaymentSchema));

export const adminDogEligibilityContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(adminDogEligibilityInputSchema)
  .output(adminDogEligibilitySchema);

export const checkoutContract = {
  eligibility: dogEligibilityContract,
  dogCourses: myDogCoursesContract,
  review: reviewCartContract,
  pay: payCartContract,
  payments: listMyPaymentsContract,
  admin: {
    payments: adminListPaymentsContract,
    dogEligibility: adminDogEligibilityContract,
  },
};
