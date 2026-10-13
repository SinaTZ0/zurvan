import { cn } from "cn";

import { ChalkDoodle } from "~/components/chalk-doodle";
import { SpeechBubble } from "~/components/speech-bubble";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Lines =====*/
// The page's live guide: the dog's line follows how far the form has got. The furthest step reached wins, so a line is
// never taken back when the owner fills the form out of order. Informal spoken Persian, in the dog's voice.
export const GUIDE_LINES = [
  "قبل از هر کاری، بیا با هم آشنا شیم!",
  `عکس و فیلم یادت نره! ${HEAD_TRAINER.firstName} می‌خواد منو بشناسه.`,
  `عالی! ${HEAD_TRAINER.firstName} خوشش میاد`,
  `${HEAD_TRAINER.firstName} زنگ می‌زنه، قول می‌دم`,
] as const;

/** How far along the form is: 0 nothing, 1 a dog chosen, 2 files added, 3 days and times picked. */
export type GuideProgress = 0 | 1 | 2 | 3;

const SENT_LINE = `رسید! ${HEAD_TRAINER.firstName} بهت زنگ می‌زنه`;

/*===== Dog Guide =====*/
/**
 * The dog beside the form, talking. Not a card: the cut-out stands on the page itself. On desktop it is sticky at the
 * end of the page with its bubble above its head; on phones it leans on the form card's top edge, its bubble above.
 *
 * The bubble is for the eyes only (`aria-hidden`); a live region carries the same words to screen readers, so each
 * change is announced once. After sending, the bubble draws itself in: the page's one orchestrated moment.
 */
export function DogGuide({
  progress,
  sent,
  message,
  className,
}: {
  progress: GuideProgress;
  sent: boolean;
  /** One fixed line instead of the form-following ones, for when there is no form (no dog yet, none left to ask for). */
  message?: string;
  className?: string;
}) {
  const line = message ?? (sent ? SENT_LINE : GUIDE_LINES[progress]);

  return (
    <div className={cn("relative flex flex-col items-center lg:items-end", className)}>
      <p aria-live="polite" className="sr-only">
        {line}
      </p>

      {/*===== Bubble =====*/}
      {/* Phones: the dog's ears reach about 4rem above its strip, so the bubble clears them with a margin. */}
      <div aria-hidden className="relative z-10 mb-14 lg:mb-8">
        {message ? (
          <SpeechBubble key="message" tail="bottom-end" className="max-w-[15rem] sm:max-w-xs lg:max-w-[16rem]">
            {message}
          </SpeechBubble>
        ) : sent ? (
          <SpeechBubble key="sent" drawIn tail="bottom-end" className="max-w-[15rem] sm:max-w-xs">
            {SENT_LINE}
          </SpeechBubble>
        ) : (
          <SpeechBubble key="guide" tail="bottom-end" className="max-w-[15rem] sm:max-w-xs lg:max-w-[16rem]">
            {/* Every line sits in the same cell, so the bubble keeps the size of the longest and nothing jumps;
                the current one fades in over the others. Reduced motion swaps them without the fade. */}
            <span className="grid">
              {GUIDE_LINES.map((text, index) => (
                <span
                  key={text}
                  className={cn(
                    "col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-500",
                    index === progress ? "opacity-100" : "opacity-0",
                  )}
                >
                  {text}
                </span>
              ))}
            </span>
          </SpeechBubble>
        )}
      </div>

      {/*===== Dog =====*/}
      {/* Phones: a strip the card starts under, the dog standing on it with its head above. Desktop: the whole
          cut-out, sized to leave room for the bubble in a laptop's viewport. */}
      <div className="relative h-44 w-44 lg:h-auto lg:w-[min(100%,21rem)]">
        <img
          src="/photo/home/eval-dog-640.webp"
          alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
          width={640}
          height={879}
          className="absolute inset-x-0 bottom-0 h-auto w-full lg:static"
        />
        <ChalkDoodle
          name="crown"
          className="absolute -end-10 -top-12 w-12 rotate-12 lg:-start-6 lg:end-auto lg:top-2 lg:w-16 lg:-rotate-6"
        />
      </div>
    </div>
  );
}
