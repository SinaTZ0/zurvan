import { cn } from "cn";

/*===== Chalk Check =====*/
/**
 * A check mark in chalk: two uneven strokes, the short one first, the long one a little overshooting, the way a hand
 * ticks a line on a board. Ink, not gold, because the command list is the owner's card, not a button. Decorative.
 */
export function ChalkCheck({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-foreground/80", className)}
    >
      <path d="M3.5 12.8C5.2 14.2 6.6 15.8 8.4 18.2" />
      <path d="M8 18C11.5 12.2 15.5 7.6 21 4.6" />
    </svg>
  );
}
