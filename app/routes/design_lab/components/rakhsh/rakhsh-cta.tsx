import { cn } from "cn";

import { Link } from "~/components/link";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

/*===== Evaluation CTA =====*/
/** The one place signal orange is used for actions: the free-evaluation button. */
export function EvaluationButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <Link
      to={LAB_LINKS.evaluation}
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-[var(--rk-signal)] px-6 py-3 font-display text-base font-black text-[var(--rk-mask)] transition-colors hover:bg-[#f0742f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rk-bone)]",
        className,
      )}
    >
      {children ?? "ارزیابی رایگان"}
    </Link>
  );
}
