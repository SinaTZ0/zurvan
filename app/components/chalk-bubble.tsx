import { cn } from "cn";

/*===== Chalk Bubble =====*/
/**
 * The mascot's hand-drawn speech bubble, the current one: ink outline, a fill of the surface it sits on
 * (`bg-background`, so inside a `surface-inverse` band it is cut from the band's grey), and a tail that points at him.
 * The older `SpeechBubble` (white chalk) stays on the pages not yet redesigned; a page moves to this one when it is.
 *
 * `tail` is a physical side (left/right) because the tail is a rotated square and must aim at the dog, whichever way
 * the page reads. `tailEdge` puts it on the bottom edge (the dog is below) or the top edge (the speaker is above, as a
 * dog's row over its verdict). The words are the dog's: informal spoken Persian in his first person, short and warm.
 */
export function ChalkBubble({
  children,
  tail = "right",
  tailEdge = "bottom",
  className,
}: {
  children: React.ReactNode;
  tail?: "left" | "right";
  tailEdge?: "bottom" | "top";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "relative w-max max-w-full rounded-[1.4rem] border-2 border-foreground bg-background px-4 py-2.5 font-hand text-[15px] leading-snug text-foreground md:text-lg",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute size-4 rotate-45 border-foreground bg-background",
          tailEdge === "bottom" ? "-bottom-[9px] border-r-2 border-b-2" : "-top-[9px] border-t-2 border-l-2",
          tail === "right" ? "right-7" : "left-7",
        )}
      />
    </p>
  );
}
