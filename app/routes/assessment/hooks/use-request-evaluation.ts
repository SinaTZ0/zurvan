import { useMutation } from "@tanstack/react-query";

import { client } from "~/orpc/client";
import type { Evaluation } from "~/orpc/evaluation/contract";
import type { EvaluationRequestValues } from "~/routes/assessment/schema";

/*===== Request Evaluation =====*/
/**
 * Sends the free evaluation request (F3). Nothing is invalidated here: the page refreshes the dogs and evaluations
 * itself once the receipt is on its way, so it decides when the dog states change on screen.
 */
export function useRequestEvaluation() {
  return useMutation({
    mutationFn: (input: EvaluationRequestValues): Promise<Evaluation> => client.evaluation.request(input),
  });
}
