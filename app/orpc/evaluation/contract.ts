import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors, errorDataSchema } from "~/orpc/errors";
import {
  EVALUATION_PERIODS,
  EVALUATION_STATUSES,
  EVALUATION_VIDEO_FORMATS,
  EVALUATION_WEEKDAYS,
} from "~/orpc/evaluation/constants";
import { mediaSchema } from "~/orpc/media/contract";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";

/*===== Schemas =====*/
/** A video of the dog. `url` plays it for the people allowed to; nobody else gets bytes from it. */
export const evaluationVideoSchema = z.object({
  id: z.string(),
  format: z.enum(EVALUATION_VIDEO_FORMATS),
  /** The name on the customer's phone. */
  fileName: z.string(),
  sizeBytes: z.number().int(),
  /** A path on this site (`/api/evaluation-videos/{id}`), served with the viewer's session. */
  url: z.string(),
});

export type EvaluationVideo = z.infer<typeof evaluationVideoSchema>;

/** An evaluation as its customer sees it (F3). */
export const evaluationSchema = z.object({
  id: z.string(),
  status: z.enum(EVALUATION_STATUSES),
  dog: z.object({ id: z.string(), name: z.string(), photo: mediaSchema.nullable() }),
  /** `YYYY-MM-DD`. Null for an evaluation the Admin recorded himself. */
  earliestDate: z.string().nullable(),
  availableDays: z.array(z.enum(EVALUATION_WEEKDAYS)),
  availablePeriods: z.array(z.enum(EVALUATION_PERIODS)),
  /** Why the Admin rejected it. */
  rejectionReason: z.string().nullable(),
  photos: z.array(mediaSchema),
  videos: z.array(evaluationVideoSchema),
  /** The Admin marked a dog he already knew as evaluated, with no request. */
  createdByAdmin: z.boolean(),
  createdAt: z.date(),
  decidedAt: z.date().nullable(),
});

export type Evaluation = z.infer<typeof evaluationSchema>;

/** The same, for the Admin: with the customer to call. */
export const adminEvaluationSchema = evaluationSchema.extend({
  customer: z.object({ id: z.string(), name: z.string(), phoneNumber: z.string().nullable() }),
});

export type AdminEvaluation = z.infer<typeof adminEvaluationSchema>;

// Structure only; meaning (real dates, allowed values, limits) is checked by `validation.ts`.
const requestEvaluationInputSchema = z.strictObject({
  dogId: z.string(),
  earliestDate: z.string(),
  availableDays: z.array(z.string()),
  availablePeriods: z.array(z.string()),
  /** IDs of images uploaded with `media.upload` (kind `evaluation`). */
  photoMediaIds: z.array(z.string()),
  /** IDs of videos uploaded to `/api/evaluation-videos`. */
  videoIds: z.array(z.string()),
});
const idInputSchema = z.strictObject({ id: z.string() });
const listMineInputSchema = z.strictObject({ dogId: z.string().optional() });
const adminListInputSchema = z.strictObject({ status: z.enum(EVALUATION_STATUSES).optional() });
const rejectInputSchema = z.strictObject({ id: z.string(), reason: z.string() });
const markEvaluatedInputSchema = z.strictObject({ dogId: z.string() });

/*===== Errors =====*/
// Conflicts with the current state answer with HTTP 409 (see `errors.ts`) and carry a Persian message in
// `data.errors`. NOT_FOUND is also the answer for another customer's dog or evaluation and a malformed id.
const notFoundError = {
  NOT_FOUND: {
    message: "Not found.",
    data: errorDataSchema,
  },
};

const requestErrors = {
  ...notFoundError,
  NOT_REQUESTABLE: {
    message: "The dog already has a pending or finished evaluation.",
    data: errorDataSchema,
  },
};

const withdrawErrors = {
  ...notFoundError,
  NOT_WITHDRAWABLE: {
    message: "The evaluation is no longer waiting for an answer.",
    data: errorDataSchema,
  },
};

const answerErrors = {
  ...notFoundError,
  NOT_ANSWERABLE: {
    message: "The evaluation is no longer waiting for an answer.",
    data: errorDataSchema,
  },
};

const baseErrors = { ...commonErrors, ...authErrors, ...roleErrors };

/*===== Procedures =====*/
export const requestEvaluationContract = oc
  .errors({ ...baseErrors, ...requestErrors })
  .input(requestEvaluationInputSchema)
  .output(evaluationSchema);

export const withdrawEvaluationContract = oc
  .errors({ ...baseErrors, ...withdrawErrors })
  .input(idInputSchema)
  .output(evaluationSchema);

/** The customer's evaluations, newest first, for the Dashboard; `dogId` narrows them to one dog's page. */
export const listMyEvaluationsContract = oc
  .errors(baseErrors)
  .input(listMineInputSchema)
  .output(z.array(evaluationSchema));

/** Every evaluation, requests waiting for an answer first, then newest first. */
export const adminListEvaluationsContract = oc
  .errors(baseErrors)
  .input(adminListInputSchema)
  .output(z.array(adminEvaluationSchema));

export const adminGetEvaluationContract = oc
  .errors({ ...baseErrors, ...notFoundError })
  .input(idInputSchema)
  .output(adminEvaluationSchema);

/** «ارزیابی شد»: the dog is evaluated and its courses can be bought. */
export const adminEvaluateContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(idInputSchema)
  .output(adminEvaluationSchema);

/** «رد»: with a reason the customer sees. The customer can request again. */
export const adminRejectContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(rejectInputSchema)
  .output(adminEvaluationSchema);

/** A dog the Admin already knows: evaluated directly, with no request (or the dog's open request is answered). */
export const adminMarkEvaluatedContract = oc
  .errors({ ...baseErrors, ...answerErrors })
  .input(markEvaluatedInputSchema)
  .output(adminEvaluationSchema);

export const evaluationContract = {
  request: requestEvaluationContract,
  withdraw: withdrawEvaluationContract,
  listMine: listMyEvaluationsContract,
  admin: {
    list: adminListEvaluationsContract,
    get: adminGetEvaluationContract,
    evaluate: adminEvaluateContract,
    reject: adminRejectContract,
    markEvaluated: adminMarkEvaluatedContract,
  },
};
