import { cn } from "cn";
import { ShoppingBagIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import { COLUMN, FADED_ENDS, WARM_LIGHT } from "~/routes/account_cart/column";

/*===== Cart Hero =====*/
/**
 * The top of the Cart: a gold-outlined chip, «سبد من» and one plain line (what's in the cart, or that it's empty), and at
 * the end side the center's dog pushing his little cart along the path towards the words, a bush either side, a pool of
 * warm light, his bubble over his head. The cart's count is always in the plain line, never only in his bubble.
 *
 * Under a payment banner the hero steps aside: the words stay, the stage goes, and the banner below is the page's moment
 * (no second dog saying the same thing).
 *
 * The page's load moment when there is no banner: he rolls his cart in a few rem and stops (`ct-roll`), and his bubble
 * pops once he knows what to say (it is keyed by its words, so it pops again if they change).
 *
 * The title takes focus when the last «برداشتن» is pressed (`useCartRemoval`), so it is focusable but out of the tab order.
 */
export function CartHero({
  line,
  bubble,
  stage,
}: {
  /** The plain line under the title. */
  line: string;
  /** His words; null while the cart is being read, or under a banner. */
  bubble: string | null;
  /** False under a payment banner. */
  stage: boolean;
}) {
  return (
    <section aria-labelledby="cart-title" className="pt-8 lg:pt-section-sm">
      <div className={cn(COLUMN, "relative")}>
        <div
          className={cn(
            "grid items-end gap-x-3",
            stage && "grid-cols-[minmax(0,1fr)_10.5rem] sm:grid-cols-[minmax(0,1fr)_14rem] lg:grid-cols-12 lg:gap-x-12",
          )}
        >
          {/*===== Words =====*/}
          <div className={cn("lg:col-span-7", stage ? "pb-12 lg:pb-16" : "pb-2")}>
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
              <ShoppingBagIcon aria-hidden strokeWidth={2} className="size-4" />
              {m.account_cart_hero_chip()}
            </p>
            <h1 id="cart-title" tabIndex={-1} className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance outline-none")}>
              {m.account_cart_hero_title()}
            </h1>
            <p key={line} className="answer-in mt-3 max-w-lg text-lead text-pretty text-muted-foreground">
              {line}
            </p>
          </div>

          {/*===== Stage =====*/}
          {stage && <HeroStage bubble={bubble} />}
        </div>

        {/*------ Path ------*/}
        {stage && <GroundStrip className={cn("absolute inset-x-4 bottom-0 h-7 md:inset-x-8 lg:h-9", FADED_ENDS)} />}
      </div>
    </section>
  );
}

/*===== Hero Stage =====*/
/**
 * The picture, with physical sides (it is tied to the cut-out: he faces right, pushing his cart towards the words). His
 * head is about 55% in from his left side, so the bubble's tail (2.25rem in from the bubble's right edge) is set over it.
 * Phones: the dog at the stage's right, so the bubble has room to open leftwards above him without leaving the screen.
 */
function HeroStage({ bubble }: { bubble: string | null }) {
  return (
    <div aria-hidden className="relative h-[13rem] sm:h-[15rem] lg:col-span-5 lg:h-[18rem]">
      <div className={cn("absolute inset-0", WARM_LIGHT)} />
      <NightSky className="inset-x-[8%] top-2 hidden h-24 lg:block" />

      {/*------ The Dog and His Cart ------*/}
      <div className="absolute right-0 bottom-[0.9rem] w-32 sm:w-40 lg:right-[18%] lg:bottom-[1.2rem] lg:w-[15rem]">
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute right-[86%] bottom-0 w-[34%] translate-y-[6%] -scale-x-100"
        />
        <MascotCut name="plants" eager className="lively-sway absolute bottom-0 left-[88%] w-[30%] translate-y-[6%]" />
        <div className="ct-roll relative translate-y-[3%]">
          <div className="lively-pet">
            <MascotCut name="cart-push" eager className="lively-breathe block w-full" />
          </div>
        </div>

        {/*------ Bubble ------*/}
        {bubble && (
          <ChalkBubble
            key={bubble}
            tail="right"
            className="answer-pop absolute right-[calc(45%-2.25rem)] bottom-[calc(100%+0.4rem)] max-w-[9.5rem] text-pretty [--answer-delay:0.9s] [--pop-origin:calc(100%-2.25rem)_100%] sm:max-w-[12rem] lg:max-w-[15rem]"
          >
            {bubble}
          </ChalkBubble>
        )}
      </div>
    </div>
  );
}
