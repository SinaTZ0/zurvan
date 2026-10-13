import { useMutation } from "@tanstack/react-query";

import { client } from "~/orpc/client";
import type { Evaluation } from "~/orpc/evaluation/contract";
import type { EvaluationRequestValues } from "~/routes/assessment/schema";

/*===== Request Evaluation =====*/
/**
 * Sends the free evaluation request (F3). Nothing is invalidated here: the page revalidates its loader itself, because
 * it needs the fresh dog states for the «another dog» link, not for a cached query.
 */
export function useRequestEvaluation() {
  return useMutation({
    mutationFn: (input: EvaluationRequestValues): Promise<Evaluation> => client.evaluation.request(input),
  });
}
