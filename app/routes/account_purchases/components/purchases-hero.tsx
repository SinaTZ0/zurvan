import { cn } from "cn";
import { ReceiptTextIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

import { COLUMN } from "../column";

/*===== Types =====*/
export type Tally = { payments: number; courses: number; training: number };

/*===== Purchases Hero =====*/
/**
 * The top of «خریدها»: the center's dog keeps the receipts in his book. The words at the start: a chip, the h1, one line
 * and a tally plate of three plain gold numbers (paid payments, courses bought, courses in training; no money sum). The
 * stage at the end (on phones a band on top): the dimmed archive box of slips, the `ledger` dog lying in front of it
 * with his paw on the open book, a bush either side, a path, a night sky and a pool of warm light.
 *
 * The stage's pieces use physical sides: they are tied to the pictures (the dog faces right, towards the words) and the
 * bubble's tail (a physical side, 2.25rem in from the bubble's right edge) is aimed at his head.
 *
 * The page's load moment (page-motion.tsx): his paw turns a page (`ap-page`), the bubble pops at 0.4s, the tally's numbers
 * rise in one after another.
 */
export function PurchasesHero({ tally }: { tally: Tally }) {
  const empty = tally.payments === 0 && tally.courses === 0;

  return (
    <section aria-labelledby="purchases-title" className="pt-4 pb-10 lg:pt-section-sm lg:pb-12">
      <div className={cn(COLUMN, "grid gap-y-6 lg:grid-cols-12 lg:gap-x-12")}>
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1 lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:py-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
            <ReceiptTextIcon aria-hidden strokeWidth={2} className="size-4" />
            {m.account_purchases_hero_chip()}
          </p>
          <h1 id="purchases-title" className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance")}>
            {m.account_purchases_hero_title()}
          </h1>
          <p className="mt-3 max-w-xl text-lead text-pretty text-muted-foreground">{m.account_purchases_hero_line()}</p>
          <TallyPlate tally={tally} />
        </div>

        {/*===== Stage =====*/}
        <HeroStage empty={empty} />
      </div>
    </section>
  );
}

/*===== Tally Plate =====*/
/**
 * Three gold numbers on a grained plate, a `dl` with each number over its label. A zero is a calm «—» (with its word for
 * screen readers), so an empty account doesn't read as a row of failures. Hairlines are each cell's start border, the
 * first one's pulled out of the clip.
 */
function TallyPlate({ tally }: { tally: Tally }) {
  const cells = [
    { label: m.account_purchases_tally_payments(), value: tally.payments },
    { label: m.account_purchases_tally_courses(), value: tally.courses },
    { label: m.account_purchases_tally_training(), value: tally.training },
  ];

  return (
    <div className="mt-7 w-full overflow-hidden rounded-3xl border border-border bg-card paper-grain shadow-sm sm:w-fit">
      <dl className="-ms-px grid grid-cols-3">
        {cells.map(({ label, value }, index) => (
          <div
            key={label}
            className="flex flex-col-reverse items-center gap-1 border-s border-border px-3 py-4 sm:px-7"
          >
            <dt className="text-center text-xs leading-snug font-bold text-balance text-muted-foreground sm:text-sm">
              {label}
            </dt>
            <dd
              className={cn(
                `ap-rise ap-rise-${index + 1} font-display text-4xl leading-none font-black`,
                value === 0 ? "text-muted-foreground/60" : "text-primary",
              )}
            >
              {value === 0 ? (
                <>
                  <span aria-hidden>—</span>
                  <span className="sr-only">{m.account_purchases_tally_zero_sr()}</span>
                </>
              ) : (
                formatNumber(value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/*===== Hero Stage =====*/
/**
 * The picture: a fixed box of pieces standing on the path at the stage's bottom, so a taller words column only adds
 * sky. `--dog-w` is the dog's width and `--ground` how high the path lifts the pieces; the bubble is placed from them,
 * so it sits over his head whatever the screen. Phones: an 11.5rem band; from `lg`, as tall as the words.
 */
function HeroStage({ empty }: { empty: boolean }) {
  return (
    <div
      aria-hidden
      className="relative order-1 h-[11.5rem] [--dog-w:8.5rem] [--ground:0.9rem] lg:order-2 lg:col-span-5 lg:h-auto lg:min-h-[24rem] lg:[--dog-w:17rem] lg:[--ground:1.2rem]"
    >
      {/* A pool of warm light where he lies. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_55%_80%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Sky ------*/}
      <NightSky className="inset-x-[6%] top-1 h-16 lg:top-4 lg:h-28" />

      {/*------ Path ------*/}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

      {/*------ Pieces ------*/}
      {/* The archive box at the far (left) end, the dog in front of it towards the words. */}
      <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[20rem] lg:w-[29rem]">
        <MascotCut
          name="plants"
          eager
          className="lively-sway absolute bottom-0 -left-[1.25rem] w-[3.5rem] translate-y-[6%] lg:-left-[1.75rem] lg:w-[5.25rem]"
        />
        <MascotCut
          name="archive"
          eager
          className="absolute bottom-0 left-[1rem] w-[7.5rem] translate-y-[6%] lg:left-[0.75rem] lg:w-[14rem]"
        />
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute -right-[1.25rem] bottom-0 w-[3rem] translate-y-[6%] -scale-x-100 lg:-right-[1.75rem] lg:w-[4.5rem]"
        />

        {/*------ The Dog ------*/}
        {/* The page-turn is on the wrapper, the idle breath on the picture, so one doesn't cancel the other. */}
        <div className="ap-page absolute right-[0.5rem] bottom-0 w-(--dog-w) translate-y-[4%] lg:right-[0.75rem]">
          <div className="lively-pet">
            <MascotCut name="ledger" eager className="lively-breathe block w-full" />
          </div>
        </div>

        {/*------ Bubble ------*/}
        {/* His head is about 25% of his width in from his right side and 8% down his height (352/391 of his width):
            the tail's centre (2.25rem in from the bubble's right edge) lands over it. */}
        <ChalkBubble
          tail="right"
          className="ap-pop absolute right-[calc(0.5rem+var(--dog-w)*0.25-2.25rem)] bottom-[calc(var(--dog-w)*0.86+0.6rem)] max-w-[15rem] text-pretty lg:right-[calc(0.75rem+var(--dog-w)*0.25-2.25rem)] lg:max-w-[16rem]"
        >
          {empty ? m.account_purchases_hero_bubble_empty() : m.account_purchases_hero_bubble()}
        </ChalkBubble>
      </div>
    </div>
  );
}
