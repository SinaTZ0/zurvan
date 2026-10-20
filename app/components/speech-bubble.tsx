import { cn } from "cn";

/*===== Types =====*/
/** Which edge the tail leaves from, and which end of that edge it sits at. "end" is the reading end: left, in RTL. */
export type BubbleTail = "bottom-end" | "bottom-start" | "top-end" | "top-start";

/*===== Tail Placement =====*/
// The tail is drawn once, leaving the bottom edge and curling toward the end. The other three are mirrors of it. Each
// placement also has an `lg:` twin, so a bubble can sit above the dog on a phone and beside it on desktop.
const TAIL_CLASSES: Record<BubbleTail, string> = {
  "bottom-end": "top-full bottom-auto end-[18%] start-auto scale-x-100 scale-y-100",
  "bottom-start": "top-full bottom-auto start-[18%] end-auto -scale-x-100 scale-y-100",
  "top-end": "bottom-full top-auto end-[18%] start-auto scale-x-100 -scale-y-100",
  "top-start": "bottom-full top-auto start-[18%] end-auto -scale-x-100 -scale-y-100",
};

const LG_TAIL_CLASSES: Record<BubbleTail, string> = {
  "bottom-end": "lg:top-full lg:bottom-auto lg:end-[18%] lg:start-auto lg:scale-x-100 lg:scale-y-100",
  "bottom-start": "lg:top-full lg:bottom-auto lg:start-[18%] lg:end-auto lg:-scale-x-100 lg:scale-y-100",
  "top-end": "lg:bottom-full lg:top-auto lg:end-[18%] lg:start-auto lg:scale-x-100 lg:-scale-y-100",
  "top-start": "lg:bottom-full lg:top-auto lg:start-[18%] lg:end-auto lg:-scale-x-100 lg:-scale-y-100",
};

/*===== Speech Bubble =====*/
/**
 * The dog talking to the visitor: its words in the hand face, inside a chalk outline drawn as if by marker, with a
 * tail pointing back at the dog. The outline is a fixed hand-drawn path stretched to the text, so its stroke thickens
 * a little along the long sides, which reads as a real marker line rather than a vector box.
 *
 * `drawIn` plays the page's one orchestrated moment: the outline draws itself, then the words appear. Reduced motion
 * shows the finished bubble.
 *
 * Superseded by `ChalkBubble` (`~/components/chalk-bubble`), the mascot's ink bubble of the current look. This one
 * stays on the pages not yet redesigned; a page moves to `ChalkBubble` when it is.
 */
export function SpeechBubble({
  children,
  tail = "bottom-end",
  lgTail,
  drawIn = false,
  className,
}: {
  children: React.ReactNode;
  tail?: BubbleTail;
  /** The tail from `lg` up, when it differs from the phone's. */
  lgTail?: BubbleTail;
  drawIn?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative isolate inline-block max-w-xs text-chalk", className)}>
      {/*------ Outline ------*/}
      {/* Opaque black inside: the bubbles sit on photos, and the words must read over fur and lights. The path ends a
          little past where it starts, the way a marker overshoots when a hand closes a loop. */}
      <svg
        aria-hidden
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="absolute inset-0 -z-10 size-full overflow-visible"
      >
        <path
          d="M8 22 C7 10 14 5 30 5 C80 2 140 3 184 6 C195 7 197 15 197 28 C197 52 198 70 195 84 C193 94 184 96 170 96 C120 98 70 98 26 96 C12 95 4 90 4 76 C3 56 3 36 6 18"
          fill="black"
        />
        <path
          d="M30 5 C80 2 140 3 184 6 C195 7 197 15 197 28 C197 52 198 70 195 84 C193 94 184 96 170 96 C120 98 70 98 26 96 C12 95 4 90 4 76 C3 56 3 36 6 18 C8 9 15 6 40 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          pathLength={1}
          className={cn("[stroke-dasharray:1]", drawIn && "motion-safe:animate-doodle-draw")}
        />
      </svg>

      {/*------ Tail ------*/}
      {/* Overlaps the outline by a few pixels so its black fill covers the stroke where they join. */}
      <svg
        aria-hidden
        viewBox="0 0 30 30"
        className={cn(
          "absolute -my-[3px] h-7 w-7 overflow-visible",
          TAIL_CLASSES[tail],
          lgTail && LG_TAIL_CLASSES[lgTail],
          drawIn && "motion-safe:animate-doodle-fade motion-safe:[animation-delay:0.9s]",
        )}
      >
        <path d="M24 0 C22 12 15 22 3 28 C10 19 12 10 9 0 Z" fill="black" />
        <path
          d="M24 1 C22 12 15 22 3 28 C10 19 12 10 9 1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/*------ Words ------*/}
      <p
        className={cn(
          "px-6 py-4 font-hand text-lg leading-[1.75] font-medium text-pretty lg:text-xl",
          drawIn && "motion-safe:animate-doodle-fade motion-safe:[animation-delay:0.75s]",
        )}
      >
        {children}
      </p>
    </div>
  );
}
