import { oc } from "@orpc/contract";
import { z } from "zod";

import {
  BEHAVIOR_BLOCKED_KINDS,
  BEHAVIOR_PROBLEM_CATEGORIES,
  BEHAVIOR_REQUEST_STATUSES,
  BEHAVIOR_VIDEO_FORMATS,
} from "~/orpc/behavior-request/constants";
import { dogSchema } from "~/orpc/dog/contract";
import { commonErrors, errorDataSchema } from "~/orpc/errors";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
const dogSummarySchema = z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() });

/** A video of the behavior. `url` plays it for the people allowed to; nobody else gets bytes from it. */
export const behaviorVideoSchema = z.object({
  id: z.string(),
  format: z.enum(BEHAVIOR_VIDEO_FORMATS),
  /** The name on the customer's phone. */
  fileName: z.string(),
  sizeBytes: z.number().int(),
  /** A path on this site (`/api/behavior-videos/{id}`), served with the viewer's session. */
  url: z.string(),
});

export type BehaviorVideo = z.infer<typeof behaviorVideoSchema>;

/** The trainer's plan: sessions and a price, with the time left to pay (B13). Rial. */
export const behaviorPlanSchema = z.object({
  sessions: z.number().int(),
  price: z.number().int(),
  note: z.string(),
  proposedAt: z.date(),
  expiresAt: z.date(),
});

export type BehaviorPlan = z.infer<typeof behaviorPlanSchema>;

/** The parts of a request both sides see. */
const requestBaseShape = {
  id: z.string(),
  status: z.enum(BEHAVIOR_REQUEST_STATUSES),
  problemCategory: z.enum(BEHAVIOR_PROBLEM_CATEGORIES),
  description: z.string(),
  /** Where the sessions would happen. */
  address: z.string(),
  preferredTimes: z.string(),
  dog: dogSummarySchema,
  videos: z.array(behaviorVideoSchema),
  /** Set once the trainer has proposed one, and kept when it is paid or runs out. */
  plan: behaviorPlanSchema.nullable(),
  /** The trainer's reason, for a declined request. */
  declineReason: z.string().nullable(),
  /** The enrollment the paid plan created. */
  enrollmentId: z.string().nullable(),
  createdAt: z.date(),
};

/** A request as its customer sees it. */
export const customerBehaviorRequestSchema = z.object({
  ...requestBaseShape,
  trainer: z.object({ name: z.string(), isHeadTrainer: z.boolean() }),
  /** A proposed plan whose time hasn't run out: the customer can go to checkout. */
  canPay: z.boolean(),
  /** Submitted or proposed: the customer can still take it back. */
  canWithdraw: z.boolean(),
});

export type CustomerBehaviorRequest = z.infer<typeof customerBehaviorRequestSchema>;

/** A request in the trainer's list. */
export const trainerBehaviorRequestSummarySchema = z.object({
  ...requestBaseShape,
  customer: z.object({ name: z.string() }),
  /** Submitted: it's waiting for the trainer's answer. */
  needsAnswer: z.boolean(),
});

export type TrainerBehaviorRequestSummary = z.infer<typeof trainerBehaviorRequestSummarySchema>;

/** A request as its trainer sees it: the whole dog and the customer's contact details. */
export const trainerBehaviorRequestSchema = z.object({
  ...trainerBehaviorRequestSummarySchema.shape,
  dog: dogSchema,
  customer: z.object({ name: z.string(), phoneNumber: z.string().nullable() }),
  /** Submitted, or proposed and not paid: the trainer can propose (again) or decline. */
  canAnswer: z.boolean(),
});

export type TrainerBehaviorRequest = z.infer<typeof trainerBehaviorRequestSchema>;

/** What the request form needs: the customer's dogs, and which of them can't start one and why. */
export const behaviorRequestOptionsSchema = z.object({
  course: z.object({ slug: z.string(), title: z.string() }).nullable(),
  dogs: z.array(
    z.object({
      dog: dogSchema,
      blocked: z
        .object({
          kind: z.enum(BEHAVIOR_BLOCKED_KINDS),
          message: z.string(),
          /** For `open-request`: the request being worked on. */
          requestId: z.string().nullable(),
          /** For `live-enrollment`: the plan the dog is in now. */
          enrollmentId: z.string().nullable(),
        })
        .nullable(),
    }),
  ),
});

export type BehaviorRequestOptions = z.infer<typeof behaviorRequestOptionsSchema>;

/*===== Inputs =====*/
// Structure only; meaning is checked by `validation.ts`.
const submitInputSchema = z.strictObject({
  dogId: z.string(),
  problemCategory: z.string(),
  description: z.string(),
  address: z.string(),
  preferredTimes: z.string(),
  /** Ids from the video upload (`POST /api/behavior-videos`). */
  videoIds: z.array(z.string()),
});
const idInputSchema = z.strictObject({ id: z.string() });
const proposeInputSchema = z.strictObject({
  id: z.string(),
  sessions: z.number(),
  /** Rial. */
  price: z.number(),
  note: z.string(),
});
const declineInputSchema = z.strictObject({ id: z.string(), reason: z.string() });
const trainerListInputSchema = z.strictObject({ status: z.string().optional() });

/*===== Errors =====*/
// Conflicts with the current state answer with HTTP 409 (see `errors.ts`) and carry a Persian message in
// `data.errors`. NOT_FOUND is also the answer for another person's request or dog and a malformed id.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
export const behaviorRequestOptionsContract = oc.errors({ ...baseErrors }).output(behaviorRequestOptionsSchema);

/** A dog that already has a request being worked on, or is in a behavior plan, answers with NOT_ELIGIBLE. */
export const submitBehaviorRequestContract = oc
  .errors({
    ...baseErrors,
    ...notFoundError,
    NOT_ELIGIBLE: { message: "The dog can't start a request now.", data: errorDataSchema },
  })
  .input(submitInputSchema)
  .output(z.object({ id: z.string() }));

export const listMyBehaviorRequestsContract = oc
  .errors({ ...baseErrors })
  .output(z.array(customerBehaviorRequestSchema));

export const withdrawBehaviorRequestContract = oc
  .errors({
    ...baseErrors,
    ...notFoundError,
    NOT_WITHDRAWABLE: { message: "The request can no longer be withdrawn.", data: errorDataSchema },
  })
  .input(idInputSchema)
  .output(z.object({ id: z.string() }));

/**
 * Starts paying a proposed plan: creates the pending order for it (a plan is bought through the same order flow as a
 * course) and returns its id, to go on to checkout. A plan whose time ran out answers with NOT_PAYABLE.
 */
export const checkoutBehaviorPlanContract = oc
  .errors({
    ...baseErrors,
    ...notFoundError,
    NOT_PAYABLE: { message: "The plan can't be paid now.", data: errorDataSchema },
  })
  .input(idInputSchema)
  .output(z.object({ orderId: z.string() }));

export const trainerListBehaviorRequestsContract = oc
  .errors({ ...baseErrors })
  .input(trainerListInputSchema)
  .output(z.array(trainerBehaviorRequestSummarySchema));

export const trainerGetBehaviorRequestContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(idInputSchema)
  .output(trainerBehaviorRequestSchema);

const answerErrors = {
  ...notFoundError,
  NOT_ANSWERABLE: { message: "The request can no longer be answered.", data: errorDataSchema },
};

/** Proposes a plan, or replaces the proposed one (which restarts the time to pay and cancels an order started from it). */
export const trainerProposeBehaviorPlanContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(proposeInputSchema)
  .output(trainerBehaviorRequestSchema);

export const trainerDeclineBehaviorRequestContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(declineInputSchema)
  .output(trainerBehaviorRequestSchema);

export const behaviorRequestContract = {
  options: behaviorRequestOptionsContract,
  submit: submitBehaviorRequestContract,
  listMine: listMyBehaviorRequestsContract,
  withdraw: withdrawBehaviorRequestContract,
  checkout: checkoutBehaviorPlanContract,
  trainer: {
    list: trainerListBehaviorRequestsContract,
    get: trainerGetBehaviorRequestContract,
    propose: trainerProposeBehaviorPlanContract,
    decline: trainerDeclineBehaviorRequestContract,
  },
};
