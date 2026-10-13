import { useId } from "react";

import { SpeechBubble } from "~/components/speech-bubble";

/*===== Admin Empty State =====*/
/**
 * An Admin list with nothing in it. The dog barely speaks in the Admin area, so this is small: the cut-out dog with one
 * short line, a title and a sentence. No button: an Admin list has no "add" to offer (rows come from customers).
 */
export function AdminEmptyState({
  bubble,
  title,
  children,
}: {
  /** The dog's own few words. */
  bubble: string;
  title: string;
  children?: React.ReactNode;
}) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-dashed border-border px-6 pt-8 text-center sm:flex-row sm:items-end sm:gap-8 sm:px-10 sm:text-start"
    >
      {/*------ Dog ------*/}
      <img
        src="/photo/home/eval-dog-640.webp"
        alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
        width={640}
        height={879}
        className="order-2 h-auto w-32 shrink-0 sm:order-1 sm:w-40"
      />

      {/*------ Words ------*/}
      <div className="order-1 flex flex-col items-center gap-4 pb-2 sm:order-2 sm:items-start sm:pb-8">
        <SpeechBubble tail="bottom-end" lgTail="bottom-start" className="max-w-[16rem]">
          {bubble}
        </SpeechBubble>
        <div>
          <h2 id={titleId} className="text-lg font-extrabold text-balance">
            {title}
          </h2>
          {children && <p className="mt-1 max-w-md text-sm text-pretty text-muted-foreground">{children}</p>}
        </div>
      </div>
    </section>
  );
}
