import { PhoneIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Help Ask =====*/
/**
 * The page's last word, for the question that wasn't there: call the center, or start with the free evaluation (the
 * main exit; the phone is the quieter one). A raised card with no dog, as the one dog on this page is in the header.
 */
export function HelpAsk() {
  return (
    <section
      aria-labelledby="ask-title"
      className="rounded-4xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12"
    >
      <div className="max-w-xl">
        <h2 id="ask-title" className="font-display text-h2 font-black text-balance">
          جوابتو پیدا نکردی؟
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          با مرکز تماس بگیر و بپرس. یا اگه هنوز سگتو به {HEAD_TRAINER.firstName} نشون ندادی، از ارزیابی رایگان شروع کن.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
        <Link
          to="/assessment"
          className={buttonVariants({ variant: "solid", size: "lg", className: "w-full sm:w-auto lg:min-w-52" })}
        >
          ارزیابی رایگان بگیر
        </Link>
        <a
          href={`tel:${CENTER_PHONE.tel}`}
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
        >
          <PhoneIcon aria-hidden />
          <span dir="ltr">{CENTER_PHONE.display}</span>
        </a>
      </div>
    </section>
  );
}
