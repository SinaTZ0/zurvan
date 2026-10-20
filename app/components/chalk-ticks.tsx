import { cn } from "cn";

/*===== Chalk Ticks =====*/
/** Three short ink strokes beside the mascot's head, the storybook sign for "excited". Drawn for the head's right side. */
export function ChalkTicks({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={cn("pointer-events-none text-foreground/80", className)}
    >
      <path d="M14 9l6-5M13 13h7M14 17l6 4" />
    </svg>
  );
}
