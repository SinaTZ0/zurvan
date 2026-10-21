import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import type { SiteRules } from "~/lib/site-rules";

/*===== Rules Header =====*/
/**
 * The page's top: the title, the date the version took effect and one line on what the rules are for, with the rules
 * pinned up on the notice board and the dog pointing up at them.
 *
 * Wide: words at the start, the stage at the end. Phones: the stage on top, the words under.
 *
 * The stage's pieces use physical sides: he faces right and the bubble's tail (a physical side) is aimed at his head,
 * so both are tied to the picture and not to the reading direction. The board stands behind him towards the stage's
 * far side, and his raised paw reaches the height of its sheets.
 *
 * The page's load moment (`rl-*` in `RulesArticle`'s style): the bubble pops from its tail, the board settles with a
 * small rock. Off for reduced motion, which shows the finished stage.
 */
export function RulesHeader({ title, effectiveFrom }: Pick<SiteRules, "title" | "effectiveFrom">) {
  return (
    <section
      aria-labelledby="rules-title"
      className="site-container grid items-center gap-y-6 pt-section-sm pb-section-sm lg:grid-cols-12 lg:gap-x-12"
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-7">
        <h1
          id="rules-title"
          className="font-display text-h1 leading-[1.2] font-extrabold tracking-tight text-balance text-primary"
        >
          {title}
        </h1>
        <p className="mt-4 inline-block rounded-full border border-border bg-card paper-grain px-4 py-1 text-sm font-bold text-muted-foreground">
          از تاریخ {effectiveFrom}
        </p>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          اینا قانونای استفاده از سایت و خرید دوره‌ست؛ موقع ثبت‌نام و قبل از پرداخت تیکشون رو می‌زنی.
        </p>
      </div>

      {/*===== Stage =====*/}
      <div className="relative order-1 h-[14.5rem] lg:order-2 lg:col-span-5 lg:h-[22rem]">
        {/* A pool of warm light where he stands. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_58%_72%,rgb(255_194_26/0.08),transparent)]"
        />

        {/*------ Sky ------*/}
        <NightSky className="top-0 right-[3%] h-14 w-[26%] lg:top-2 lg:right-[4%] lg:h-24 lg:w-[30%]" />

        {/*------ Board, Bushes and Path ------*/}
        <div aria-hidden>
          <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
          <div className="rl-board absolute bottom-[0.9rem] left-[-2%] w-[62%] translate-y-[6%] lg:bottom-[1.2rem] lg:left-0 lg:w-[70%]">
            <MascotCut name="board" eager className="block w-full" />
          </div>
          <MascotCut
            name="plants"
            eager
            className="lively-sway absolute bottom-[0.9rem] left-[-5%] w-[15%] translate-y-[6%] lg:bottom-[1.2rem] lg:left-[-4%] lg:w-[14%]"
          />
          <MascotCut
            name="plants"
            eager
            className="lively-sway-2 absolute right-[-3%] bottom-[0.9rem] w-[16%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[15%]"
          />
        </div>

        {/*------ Dog Pointing Up ------*/}
        {/* His head is about the middle of his picture, so `left` + a half-width shift puts his head on the given share. */}
        <MascotCut
          name="point-up"
          eager
          className="lively-breathe absolute bottom-[0.9rem] left-[66%] h-[7.2rem] w-auto -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:left-[62%] lg:h-[12.5rem]"
        />

        {/*------ Bubble ------*/}
        {/* The tail is 36px in from the bubble's right edge, so the edge sits 36px past his head's middle. It floats
            above his raised paw, so the paw never runs into it. */}
        <ChalkBubble
          tail="right"
          className="rl-pop absolute right-[calc(34%-36px)] bottom-[calc(0.9rem+8.1rem)] lg:right-[calc(38%-36px)] lg:bottom-[calc(1.2rem+13.4rem)]"
        >
          قانونای اینجا رو با هم بخونیم!
        </ChalkBubble>
      </div>
    </section>
  );
}
