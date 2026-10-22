import { PhoneIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_PHONE } from "~/lib/contact";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/join_partner/column";

/*===== Partner Ask =====*/
/**
 * The page's closing ask: a raised grained card whose only action is the call, because joining starts with a phone
 * call. The waving dog sits on the card's top edge at its end corner (the left in RTL), the mailbox beside him, bushes
 * and a pool of warm light, and his bubble pops once he scrolls into view. The section's top padding is his headroom.
 * His sides are physical: the bubble's tail is aimed at the picture, and his waving paw is on his right.
 */
export function PartnerAsk() {
  return (
    <section aria-labelledby="partner-ask-title" className={`${COLUMN} pt-44 md:pt-52`}>
      <div className="relative">
        {/*------ Sky over the headroom ------*/}
        <NightSky className="inset-x-0 bottom-full h-36 md:h-44" />

        {/*------ The Dog and the Mailbox on the Card's Edge ------*/}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[calc(100%-0.2rem)] left-4 z-10 flex items-end sm:left-10 lg:left-14"
        >
          <div className="relative w-24 translate-y-[3%] lg:w-28">
            <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.09),transparent)]" />
            <MascotCut name="plants" className="lively-sway-2 absolute right-[84%] bottom-0 w-[50%] -scale-x-100" />
            <MascotCut name="wave" className="lively-wiggle lively-pet relative block w-full" />
            <div className="jp-ask-pop absolute bottom-[calc(100%-0.5rem)] left-[calc(55%-36px)] z-10">
              <ChalkBubble tail="left" className="lively-float w-max max-w-[11rem] text-pretty lg:max-w-[14rem]">
                {m.join_partner_ask_bubble()}
              </ChalkBubble>
            </div>
          </div>
          {/* The mailbox at his end side, a bush in its grass. */}
          <div className="relative -ms-1 w-16 translate-y-[3%] lg:w-20">
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[70%] z-10 w-[64%]" />
            <MascotCut name="mailbox" className="relative block w-full" />
          </div>
        </div>

        {/*------ The Card ------*/}
        <div className="rounded-4xl border border-border bg-card paper-grain px-6 py-10 shadow-sm sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12">
          <div className="max-w-xl">
            <h2 id="partner-ask-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
              {m.join_partner_ask_title()}
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">{m.join_partner_ask_line()}</p>
          </div>
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className={buttonVariants({
              variant: "solid",
              size: "lg",
              className: "mt-8 w-full shrink-0 lg:mt-0 lg:w-auto lg:min-w-52",
            })}
          >
            <PhoneIcon aria-hidden className="size-4" />
            <span>
              {m.join_partner_call()} <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
            </span>
          </a>
        </div>
      </div>

      {/* The dog's bubble pops from its tail (bottom left, 2.25rem in) as the card scrolls into view, then floats
          (the shared float on the bubble inside). Driven by the scroll where the browser can; elsewhere it simply
          shows. Off for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @supports (animation-timeline: view()) {
            .jp-ask-pop {
              transform-origin: 2.25rem 100%;
              animation: lively-reveal-pop linear both;
              animation-timeline: view();
              animation-range: entry 10% entry 90%;
            }
          }
        }
      `}</style>
    </section>
  );
}
