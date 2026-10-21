import { cn } from "cn";

import type { AnswerKind } from "~/routes/admin_evaluations/schema";

/*===== Copy =====*/
// The stamp says the outcome in the words of the status chip it becomes. «ارزیابی شد» is in the evaluated chip's green
// (the Enrollments' «تمام شد» stamp's ink); «رد شد» stays ivory ink, since a rejection is not an error.
const STAMPS: Record<AnswerKind, { label: string; tone: string }> = {
  evaluate: { label: "ارزیابی شد", tone: "border-success text-success" },
  reject: { label: "رد شد", tone: "border-foreground/60 text-foreground/85" },
};

/*===== Answer Stamp =====*/
/**
 * The rubber stamp pressed on a row he just answered in «در انتظار», tilted as it lands (`ev-stamp`, the shared
 * `slip-stamp`). Decorative: the toast and the reloaded list say the same thing in words, so the caller hides it from
 * screen readers.
 */
export function AnswerStamp({ kind, size = "default" }: { kind: AnswerKind; size?: "default" | "sm" }) {
  const { label, tone } = STAMPS[kind];

  return (
    <span
      className={cn(
        "ev-stamp inline-flex items-center rounded-lg border-[3px] border-double font-display font-black whitespace-nowrap",
        size === "sm" ? "px-2 text-sm" : "px-3 py-0.5 text-lg",
        tone,
      )}
    >
      {label}
    </span>
  );
}
