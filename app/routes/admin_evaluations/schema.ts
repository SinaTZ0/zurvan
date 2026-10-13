import { z } from "zod";

import { EVALUATION_REASON_MAX_LENGTH } from "~/orpc/evaluation/constants";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";

/*===== Answer =====*/
/** The two ways the Admin answers a waiting request. */
export type AnswerKind = "evaluate" | "reject";

/** A chosen answer: which one, and for which evaluation. Row buttons and the drawer footer both produce it. */
export type EvaluationAnswer = { kind: AnswerKind; evaluation: AdminEvaluation };

/*===== Reject Form =====*/
// The server checks the reason again; this only catches an empty box before the request goes out.
export const rejectFormSchema = z.object({
  reason: z.string().trim().min(1, "دلیل را بنویس.").max(EVALUATION_REASON_MAX_LENGTH, "دلیل خیلی بلند است."),
});

export type RejectFormValues = z.infer<typeof rejectFormSchema>;
