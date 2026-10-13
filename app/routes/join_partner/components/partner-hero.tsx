import { cn } from "cn";
import { PhoneIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { SpeechBubble } from "~/components/speech-bubble";
import { CENTER_PHONE } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Partner Hero =====*/
// The one photo is the puppy with its own leash, the same frame the home hero and the sign-in steps use (its crop is
// tuned to match). The dog sits in the photo's end half and the words take the dark start half, so there is no box.
/**
 * The partner page's first screen. The dog's bubble speaks to the shop owner, in the dog's voice, so the page sells the
 * partnership from the side of the dog walking in the shop's door. Phones: photo on top, bubble under it with its tail
 * up at the dog, the words below on black. Desktop: words at the start, the dog and its bubble at the end.
 *
 * @param commissionPercent The commission percent in force (the Admin's setting), read by the page's loader.
 */
export function PartnerHero({ commissionPercent }: { commissionPercent: number }) {
  return (
    <section aria-labelledby="partner-title" className="relative isolate overflow-hidden bg-jet">
      {/*===== Photo =====*/}
      <div className="relative aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
        <picture>
          <source media="(min-width: 64rem)" srcSet="/photo/home/hero-3-1536.webp" />
          <img
            src="/photo/home/hero-3-900.webp"
            alt="یک توله گلدن رتریور کنار در خانه دراز کشیده و قلاده‌اش را به دهان گرفته"
            width={1536}
            height={1024}
            className="size-full object-cover object-[4%_50%] lg:object-[0%_35%]"
          />
        </picture>

        {/* Phones: the photo melts into the black the words sit on. Desktop: the dark half deepens toward the words. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-jet to-transparent lg:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-linear-to-l from-jet from-25% via-jet/60 via-45% to-transparent to-65% lg:block"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-32 bg-linear-to-t from-jet lg:block" />
      </div>

      {/*===== Words =====*/}
      <div className="relative site-container lg:flex lg:min-h-[32rem] lg:items-center">
        <div className="relative -mt-20 pb-section-sm lg:mt-0 lg:w-[46%] lg:py-section-md">
          {/*------ Bubble ------*/}
          {/* Above the headline, its tail up at the dog's face on a phone and across at it on desktop. */}
          <div className="flex justify-end">
            <SpeechBubble tail="top-end" lgTail="bottom-end" drawIn className="max-w-[17rem] lg:max-w-[19rem]">
              یه سگ مثل من پیش تو میاد؟ بفرستش پیش {HEAD_TRAINER.firstName}.
            </SpeechBubble>
          </div>

          {/*------ Headline ------*/}
          <h1 id="partner-title" className="mt-8 font-display text-display font-black text-balance lg:mt-10">
            کلینیک، آرایشگاه سگ یا پت‌شاپ داری؟ با ما همراه شو.
          </h1>
          <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
            مشتری‌هات رو به آموزش K9 معرفی کن؛ از اولین خریدشون {formatNumberFa(commissionPercent)}٪ مال توئه.
          </p>

          {/*------ Action ------*/}
          <div className="mt-8">
            <a href={`tel:${CENTER_PHONE.tel}`} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              <PhoneIcon aria-hidden className="size-4" />
              <span>
                زنگ بزن: <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
