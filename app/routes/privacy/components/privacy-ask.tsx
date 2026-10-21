import { ChalkBubble } from "~/components/chalk-bubble";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Privacy Ask =====*/
/**
 * The page's closing ask: a raised grained card. The main action is the help page, where most of the questions are
 * answered; the quieter one is the contact page. (It used to ask for the free evaluation too: the owner wants that ask
 * kept to the menu, the hero and the quick actions.)
 *
 * The thinking dog sits on the card's top edge at its end corner (the page's left), the mailbox where questions go
 * beside him, a bush either side and a pool of warm light, with his line in a bubble over his head. The card has no
 * overflow clipping, so he sits over its edge, and its top margin makes room for him and the sky. His sides are
 * physical: he is in the card's left corner and looks right, towards the mailbox.
 */
export function PrivacyAsk() {
  return (
    <section
      aria-labelledby="privacy-ask-title"
      className="relative mt-40 rounded-4xl border border-border bg-card paper-grain px-6 py-10 shadow-sm sm:px-10 lg:mt-48 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12"
    >
      {/*===== Dog on the Top Edge =====*/}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[calc(100%-0.2rem)] left-6 z-10 w-[4.5rem] sm:left-10 lg:left-14 lg:w-28"
      >
        <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_55%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute right-[92%] bottom-0 w-[64%] translate-y-[4%] -scale-x-100"
        />
        <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[190%] w-[56%] translate-y-[4%]" />
        <MascotCut name="mailbox" className="absolute bottom-0 left-[104%] w-[78%] translate-y-[3%]" />
        <div className="pv-hop relative">
          <MascotCut name="think" className="lively-tilt block w-full translate-y-[3%]" />
        </div>
      </div>
      {/* His tail is 36px in from the bubble's left edge, so the bubble starts 36px before his head's centre. */}
      <ChalkBubble
        tail="left"
        className="lively-reveal-pop absolute bottom-[calc(100%+7.4rem)] left-6 z-10 max-w-[calc(100%-1.5rem)] sm:left-10 lg:bottom-[calc(100%+11rem)] lg:left-[calc(3.5rem+56px-36px)]"
      >
        منم اولش کلی سؤال داشتم!
      </ChalkBubble>

      {/* The chalk sky over the card's empty stretch, beside the dog's bubble. */}
      <NightSky className="right-[8%] bottom-[calc(100%+1.5rem)] h-24 w-[34%] md:right-[10%] md:h-28 md:w-[38%] lg:bottom-[calc(100%+2rem)]" />

      {/*===== Words =====*/}
      <div className="max-w-xl">
        <h2 id="privacy-ask-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          سؤال دیگه‌ای داری؟
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">جواب خیلی از سؤال‌ها توی «سؤال‌های پرتکرار» هست.</p>
      </div>

      {/*===== Actions =====*/}
      <div className="mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
        <Link to="/help" className={buttonVariants({ variant: "solid", size: "lg", className: "w-full sm:w-auto" })}>
          سؤال‌های پرتکرار
        </Link>
        <Link
          to="/contact"
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
        >
          تماس با ما
        </Link>
      </div>
    </section>
  );
}
