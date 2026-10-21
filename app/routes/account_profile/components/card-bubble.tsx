import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";

/*===== Card Bubble =====*/
/**
 * A card dog's chalk bubble. Only the dog of the card the person is in speaks: his bubble pops from its tail (keyed by
 * `take`, so every new line pops again), and when the word moves to another card it fades out with the last thing he
 * said. A dog that never spoke has no bubble. The load moment's line (`take` 0) pops at 0.4s, after the tag's swing
 * has started.
 *
 * The tail is on the bubble's bottom left (physical: every dog faces right and the bubble sits at his right, by his
 * head). Decoration only: the card's description says the same in plain words.
 */
export function CardBubble({
  line,
  speaking,
  hasSpoken,
  take,
  className,
}: {
  line: string;
  speaking: boolean;
  hasSpoken: boolean;
  take: number;
  /** Its place beside the dog (absolute, physical sides). */
  className?: string;
}) {
  if (!hasSpoken) return null;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute z-10", className)}>
      <ChalkBubble
        // A new key replays the pop; while quiet the key stays, so the fade-out runs once.
        key={speaking ? `say-${take}` : "quiet"}
        tail="left"
        className={cn(
          "max-w-[11rem] text-pretty sm:max-w-[15rem]",
          speaking ? cn("pf-say", take === 0 && "pf-say-first") : "pf-quiet",
        )}
      >
        {line}
      </ChalkBubble>
    </div>
  );
}
