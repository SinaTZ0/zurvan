import type { BehaviorRequestOptions } from "~/orpc/behavior-request/contract";

/*===== Dog Choices =====*/
export type RequestDogChoice = BehaviorRequestOptions["dogs"][number];

/**
 * The dog the form starts on: the one named by `?dog=` if it can start a request, or the only one that can. The server
 * still refuses a blocked dog; this only saves the customer a click.
 */
export function pickInitialDogId({
  dogs,
  requestedId,
}: {
  dogs: readonly RequestDogChoice[];
  requestedId: string | null;
}): string {
  const open = dogs.filter((choice) => !choice.blocked);
  const requested = open.find((choice) => choice.dog.id === requestedId);
  if (requested) return requested.dog.id;
  return open.length === 1 ? (open[0]?.dog.id ?? "") : "";
}
