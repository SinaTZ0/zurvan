import { cn } from "cn";

import { Link } from "~/components/link";

/*===== Evaluation Button =====*/
/** The site's main action, the free evaluation: a gold pill with near-black words. One per screen. */
export function EvaluationButton({
  children = "درخواست ارزیابی رایگان",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/assessment"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
