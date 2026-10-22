import { PhoneIcon, SendIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE, CENTER_TELEGRAM } from "~/lib/contact";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";

/*===== Help Ask =====*/
/**
 * The page's last word, for the question that wasn't there: talk to the center directly. Only ways to reach it, no
 * free-evaluation button (the owner asked for none in this block): the phone is the main action and Telegram the
 * quieter one. A WhatsApp button joins them once the owner sends a verified link.
 *
 * The dog with the letter stands on the card's top edge at its end corner (the page's left), a bush either side and a
 * pool of warm light, with his line in a bubble beside his head. The card has no overflow clipping, so he stands over
 * its edge; the section's top margin makes room for him. His sides are physical: he is in the card's left corner.
 */
export function HelpAsk() {
  return (
    <section
      aria-labelledby="ask-title"
      className="relative mt-52 rounded-4xl border border-border bg-card paper-grain px-6 py-10 shadow-sm sm:px-10 lg:mt-56 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12"
    >
      {/*===== Dog on the Top Edge =====*/}
      <div
        aria-hidden
        className="absolute bottom-[calc(100%-0.2rem)] left-6 z-10 w-[4.5rem] sm:left-10 lg:left-14 lg:w-24"
      >
        <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_55%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[92%] w-[70%] translate-y-[4%]" />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute right-[92%] bottom-0 w-[60%] translate-y-[4%] -scale-x-100"
        />
        <MascotCut name="letter" className="lively-breathe relative block w-full translate-y-[3%]" />
      </div>
      <ChalkBubble
        tail="left"
        className="absolute bottom-[calc(100%+8rem)] left-3 z-10 max-w-[calc(100%-1.5rem)] sm:left-8 lg:bottom-[calc(100%+10.6rem)] lg:left-12"
      >
        {m.help_ask_bubble()}
      </ChalkBubble>

      {/* The chalk sky over the card's empty stretch, beside the dog's bubble. */}
      <NightSky className="right-[8%] bottom-[calc(100%+1.5rem)] h-24 w-[34%] md:right-[10%] md:h-28 md:w-[38%] lg:bottom-[calc(100%+2rem)]" />

      {/*===== Words =====*/}
      <div className="max-w-xl">
        <h2 id="ask-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          {m.help_ask_title()}
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">{m.help_ask_text()}</p>
      </div>

      {/*===== Phone and Telegram =====*/}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
        <a
          href={`tel:${CENTER_PHONE.tel}`}
          className={buttonVariants({ variant: "solid", size: "lg", className: "w-full sm:w-auto lg:min-w-52" })}
        >
          <PhoneIcon aria-hidden />
          <span dir="ltr">{CENTER_PHONE.display}</span>
        </a>
        <a
          href={CENTER_TELEGRAM.href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
        >
          <SendIcon aria-hidden />
          <span>{m.help_ask_telegram()}</span>
        </a>
      </div>
    </section>
  );
}
