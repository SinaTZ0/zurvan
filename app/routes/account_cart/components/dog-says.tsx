import { cn } from "cn";

import { SpeechBubble } from "~/components/speech-bubble";

/*===== Dog Says =====*/
/**
 * A card where the cut-out dog speaks in its bubble and the words and buttons sit beside it: the payment banner and the
 * Cart's «couldn't read it» state are both this. The dog is cut off by the card's bottom edge, like `DogEmptyState`.
 *
 * Phones put the bubble across the top and the dog under it at the start, with the words next to the dog; desktop sets
 * the dog at the start and the bubble and words in the column beside it. The tail leaves the bubble toward the dog in
 * both.
 */
export function DogSays({
  bubble,
  drawIn = false,
  label,
  children,
  className,
}: {
  /** The dog's own words. */
  bubble: string;
  /** The page's one orchestrated moment: the bubble draws itself in. */
  drawIn?: boolean;
  /** Names the region for screen readers. */
  label: string;
  /** The words and buttons beside the dog. */
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "grid w-full grid-cols-[6.5rem_minmax(0,1fr)] items-end gap-x-5 gap-y-4 overflow-hidden border border-border bg-card px-5 pt-6 shadow-sm",
        "sm:grid-cols-[8rem_minmax(0,1fr)] sm:px-7 sm:pt-7",
        "lg:max-w-4xl lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-x-9 lg:px-9 lg:pt-8",
        className,
      )}
    >
      {/*------ Bubble ------*/}
      <div className="col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
        <SpeechBubble drawIn={drawIn} tail="bottom-start" className="max-w-full sm:max-w-sm lg:max-w-md">
          {bubble}
        </SpeechBubble>
      </div>

      {/*------ Dog ------*/}
      <img
        src="/photo/home/eval-dog-640.webp"
        alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
        width={640}
        height={879}
        className="col-start-1 row-start-2 h-auto w-full self-end lg:row-span-2 lg:row-start-1"
      />

      {/*------ Words ------*/}
      <div className="col-start-2 row-start-2 min-w-0 self-center pb-6 sm:pb-7 lg:pb-9">{children}</div>
    </section>
  );
}
