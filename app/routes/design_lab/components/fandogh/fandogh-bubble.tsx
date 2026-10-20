import { cn } from "cn";

/*===== Fandogh Bubble =====*/
/**
 * One of Fandogh's speech bubbles, set in the hand face (the only place the page uses it). The tail is a rotated
 * square whose right and bottom borders form the point; `tail` says which side of the bubble it hangs from so the point
 * always aims at the dog, whichever way the layout flips on small screens.
 */
export function FandoghBubble({
  children,
  tail = "bottom-end",
  tone = "white",
  className,
}: {
  children: React.ReactNode;
  tail?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  tone?: "white" | "sky";
  className?: string;
}) {
  const bg = tone === "white" ? "bg-white" : "bg-[var(--fd-sky-soft)]";
  const tailBg = tone === "white" ? "bg-white" : "bg-[var(--fd-sky-soft)]";

  return (
    <div
      className={cn(
        "relative rounded-[1.75rem] border-2 border-[var(--fd-ink)] px-5 py-4 font-hand text-lg leading-8 text-[var(--fd-ink)]",
        bg,
        className,
      )}
    >
      {children}
      {/* The tail covers the bubble's own border where it joins, so the outline reads as one stroke. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-4 border-[var(--fd-ink)]",
          tailBg,
          tail === "bottom-end" && "end-10 -bottom-[9px] rotate-45 border-e-2 border-b-2",
          tail === "bottom-start" && "start-10 -bottom-[9px] rotate-45 border-e-2 border-b-2",
          tail === "top-end" && "end-10 -top-[9px] rotate-[225deg] border-e-2 border-b-2",
          tail === "top-start" && "start-10 -top-[9px] rotate-[225deg] border-e-2 border-b-2",
        )}
      />
    </div>
  );
}
