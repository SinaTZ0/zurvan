import { cn } from "cn";

/*===== Dog Evaluation Stamp =====*/
// Where a dog is on the road (F3), as one small pill the Admin can run his eye down: evaluated (green, like
// `EvaluationStatusBadge`), waiting for the Admin's answer (gold outline: the one state that waits on him) or not yet
// (an ink outline, so a quiet register shows no gold). It is a dog's
// state, not an evaluation's status, so it has no «رد شد» or «پس گرفته شد»: a dog whose last request ended that way is
// simply «ارزیابی نشده».

export type DogEvaluationState = "evaluated" | "waiting" | "none";

const STAMPS: Record<DogEvaluationState, { label: string; tone: string }> = {
  evaluated: { label: "ارزیابی شده", tone: "border-success/40 bg-success/10 text-success" },
  waiting: { label: "منتظر ارزیابی", tone: "border-primary/60 text-primary" },
  none: { label: "ارزیابی نشده", tone: "border-foreground/15 text-muted-foreground" },
};

/** The state a dog is in: evaluated, else waiting when it has a request the Admin hasn't answered, else none. */
export function getDogEvaluationState({
  isEvaluated,
  hasWaitingRequest,
}: {
  isEvaluated: boolean;
  hasWaitingRequest: boolean;
}): DogEvaluationState {
  if (isEvaluated) return "evaluated";
  return hasWaitingRequest ? "waiting" : "none";
}

/** A dog's evaluation state as a small pill with its Persian label. */
export function DogEvaluationStamp({ state, className }: { state: DogEvaluationState; className?: string }) {
  const stamp = STAMPS[state];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        stamp.tone,
        className,
      )}
    >
      {stamp.label}
    </span>
  );
}
