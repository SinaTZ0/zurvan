import { PhoneIcon, SendIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE, CENTER_TELEGRAM } from "~/lib/contact";

/*===== Help Ask =====*/
/**
 * The page's last word, for the question that wasn't there: talk to the center directly. Only ways to reach it, no
 * free-evaluation button (the owner asked for none in this block): the phone is the main action and Telegram the
 * quieter one. A WhatsApp button joins them once the owner sends a verified link. A raised card with no dog, as the
 * one dog on this page is in the header.
 */
export function HelpAsk() {
  return (
    <section
      aria-labelledby="ask-title"
      className="rounded-4xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12"
    >
      <div className="max-w-xl">
        <h2 id="ask-title" className="font-display text-h2 font-black text-balance">
          جواب سوالت رو پیدا نکردی؟
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          مستقیم با ما حرف بزن؛ تلفن یا تلگرام، هر کدوم برات راحت‌تره.
        </p>
      </div>

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
          <span>تلگرام</span>
        </a>
      </div>
    </section>
  );
}
