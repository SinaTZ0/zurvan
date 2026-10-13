import { useId } from "react";

import { Link } from "~/components/link";
import { SpeechBubble } from "~/components/speech-bubble";
import { buttonVariants } from "~/components/ui/button";

/*===== Dog Empty State =====*/
/**
 * An empty signed-in page (no dogs, an empty cart, no purchases): the cut-out dog says one line in its bubble, a title
 * and a sentence say what to do, and one gold button does it. The dog stands at the card's start on desktop, cut off by
 * its bottom edge, and sits between the bubble and the words on phones.
 */
export function DogEmptyState({
  bubble,
  title,
  children,
  action,
}: {
  /** The dog's own words. */
  bubble: string;
  title: string;
  /** The supporting sentence. */
  children: React.ReactNode;
  action: { label: string; to: string };
}) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="grid overflow-hidden rounded-3xl border border-border bg-card px-6 pt-8 shadow-sm sm:px-8 lg:grid-cols-12 lg:gap-x-10 lg:px-10 lg:pt-0"
    >
      {/*------ Bubble ------*/}
      <div className="flex justify-center lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:items-end lg:justify-start lg:pt-12">
        <SpeechBubble tail="bottom-end" lgTail="bottom-start" className="max-w-[16rem] sm:max-w-xs lg:max-w-md">
          {bubble}
        </SpeechBubble>
      </div>

      {/*------ Dog ------*/}
      <div className="relative mx-auto mt-8 w-44 sm:w-52 lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-8 lg:w-full lg:max-w-72 lg:self-end">
        <img
          src="/photo/home/eval-dog-640.webp"
          alt="ژرمن‌شپردی با عینک آفتابی و دستمال‌گردن زرد که با دهان باز می‌خندد"
          width={640}
          height={879}
          className="h-auto w-full"
        />
      </div>

      {/*------ Words ------*/}
      <div className="pt-8 pb-8 lg:col-span-8 lg:col-start-5 lg:row-start-2 lg:pt-6 lg:pb-12">
        <h2 id={titleId} className="text-2xl font-extrabold text-balance">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{children}</p>
        <Link to={action.to} className={buttonVariants({ size: "lg", className: "mt-6 w-full sm:w-auto sm:min-w-52" })}>
          {action.label}
        </Link>
      </div>
    </section>
  );
}
