import { useId } from "react";

import { SpeechBubble } from "~/components/speech-bubble";

/*===== Leads Empty =====*/
/**
 * A partner with no people yet: the dog says one line and a title says it plainly. It has no button of its own, because
 * the form right above it is the action. The layout is `DogEmptyState`'s (copied: that component insists on a gold
 * link): the dog stands at the card's start on desktop, cut off by the bottom edge, and sits under the bubble on phones.
 */
export function LeadsEmpty() {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="grid overflow-hidden rounded-3xl border border-border bg-card px-6 pt-8 sm:px-8 lg:grid-cols-12 lg:gap-x-10 lg:px-10 lg:pt-0"
    >
      {/*------ Bubble ------*/}
      <div className="flex justify-center lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:items-end lg:justify-start lg:pt-10">
        <SpeechBubble tail="bottom-end" lgTail="bottom-start" className="max-w-[16rem] sm:max-w-xs lg:max-w-md">
          شماره‌ی اولین مشتری‌ات را بنویس تا دنبالش کنیم!
        </SpeechBubble>
      </div>

      {/*------ Dog ------*/}
      <div className="relative mx-auto mt-8 w-40 sm:w-48 lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-6 lg:w-full lg:max-w-60 lg:self-end">
        <img
          src="/photo/home/eval-dog-640.webp"
          alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
          width={640}
          height={879}
          className="h-auto w-full"
        />
      </div>

      {/*------ Words ------*/}
      <div className="pt-6 pb-8 lg:col-span-8 lg:col-start-5 lg:row-start-2 lg:pt-6 lg:pb-10">
        <h2 id={titleId} className="text-2xl font-extrabold text-balance">
          هنوز کسی نیست
        </h2>
      </div>
    </section>
  );
}
