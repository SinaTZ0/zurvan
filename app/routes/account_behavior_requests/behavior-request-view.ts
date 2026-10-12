import { planDaysLeft } from "~/lib/behavior-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { CustomerBehaviorRequest } from "~/orpc/behavior-request/contract";

/*===== Behavior Request View =====*/
/** A request with the days left to pay computed on the server, so the server and the browser show the same count. */
export type BehaviorRequestView = CustomerBehaviorRequest & { daysLeft: number | null };

/**
 * Adds `daysLeft` to a request, counted from `now`, the one instant the loader took for the whole page.
 * `null` when no plan was ever proposed.
 */
export function toBehaviorRequestView(request: CustomerBehaviorRequest, now: Date): BehaviorRequestView {
  return {
    ...request,
    daysLeft: request.plan ? planDaysLeft({ expiresAt: request.plan.expiresAt, now }) : null,
  };
}

/** The name the trainer's note is signed with: the head trainer by first name, anyone else by the profile name. */
export function signerName(trainer: CustomerBehaviorRequest["trainer"]): string {
  return trainer.isHeadTrainer ? HEAD_TRAINER.firstName : trainer.name;
}
