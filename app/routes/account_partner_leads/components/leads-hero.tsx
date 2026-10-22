import { cn } from "cn";
import { UsersRoundIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";
import { COLUMN } from "~/routes/account_partner_leads/column";

/*===== Types =====*/
/** The hero's three counts: numbers still waiting, people who registered (not bought yet), buyers. */
export type Tally = { lead: number; registered: number; bought: number };

/*===== Leads Hero =====*/
/**
 * The top of «شماره‌ها و مشتری‌ها»: the center's dog takes the call. The words at the start: a chip, the h1, the one rule
 * that matters (a number written here counts if that person signs up with it) and a tally plate of three plain gold
 * counts. The stage at the end (on phones a band on top): the dimmed mailbox, the `phone` dog sitting in front of it
 * with the old receiver at his ear, a bush either side, a path, a night sky and a pool of warm light.
 *
 * The stage's pieces use physical sides: they are tied to the pictures (the dog faces right, towards the words) and the
 * bubble's tail (a physical side, 2.25rem in from the bubble's right edge) is aimed at his head.
 *
 * The page's load moment (page-motion.tsx): he lifts the receiver (`pl-lift`), the bubble pops at 0.4s, the tally's
 * counts rise in one after another.
 */
export function LeadsHero({ tally }: { tally: Tally }) {
  return (
    <section aria-labelledby="partner-leads-title" className="pt-4 pb-8 lg:pt-section-sm lg:pb-10">
      <div className={cn(COLUMN, "grid gap-y-6 lg:grid-cols-12 lg:gap-x-12")}>
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1 lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:py-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
            <UsersRoundIcon aria-hidden strokeWidth={2} className="size-4" />
            {m.account_partner_leads_hero_chip()}
          </p>
          <h1 id="partner-leads-title" className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance")}>
            {m.account_partner_leads_hero_title()}
          </h1>
          <p className="mt-3 max-w-xl text-lead text-pretty text-muted-foreground">
            {m.account_partner_leads_hero_lead()}
          </p>
          <TallyPlate tally={tally} />
        </div>

        {/*===== Stage =====*/}
        <HeroStage />
      </div>
    </section>
  );
}

/*===== Tally Plate =====*/
/**
 * Three gold counts on a grained plate, a `dl` with each count over its label. A zero is a calm «—» (with its word for
 * screen readers), so a new partner's page doesn't read as a row of failures. Hairlines are each cell's start border,
 * the first one's pulled out of the clip.
 */
function TallyPlate({ tally }: { tally: Tally }) {
  const cells = [
    { label: m.account_partner_leads_tally_lead(), value: tally.lead },
    { label: m.account_partner_leads_tally_registered(), value: tally.registered },
    { label: m.account_partner_leads_tally_bought(), value: tally.bought },
  ];

  return (
    <div className="mt-7 w-full overflow-hidden rounded-3xl border border-border bg-card paper-grain shadow-sm sm:w-fit">
      <dl className="-ms-px grid grid-cols-3">
        {cells.map(({ label, value }, index) => (
          <div
            key={label}
            className="flex flex-col-reverse items-center gap-1 border-s border-border px-3 py-4 sm:px-8"
          >
            <dt className="text-center text-xs leading-snug font-bold text-balance text-muted-foreground sm:text-sm">
              {label}
            </dt>
            <dd
              className={cn(
                `pl-rise pl-rise-${index + 1} font-display text-4xl leading-none font-black`,
                value === 0 ? "text-muted-foreground/60" : "text-primary",
              )}
            >
              {value === 0 ? (
                <>
                  <span aria-hidden>—</span>
                  <span className="sr-only">{m.account_partner_leads_zero_sr()}</span>
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
 * so it sits over his head whatever the screen. Phones: a 12.5rem band; from `lg`, as tall as the words.
 */
function HeroStage() {
  return (
    <div
      aria-hidden
      className="relative order-1 h-[12.5rem] [--dog-w:7.5rem] [--ground:0.9rem] lg:order-2 lg:col-span-5 lg:h-auto lg:min-h-[23rem] lg:[--dog-w:12.5rem] lg:[--ground:1.2rem]"
    >
      {/* A pool of warm light where he sits. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_55%_at_55%_80%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Sky ------*/}
      <NightSky className="inset-x-[6%] top-1 h-14 lg:top-4 lg:h-24" />

      {/*------ Path ------*/}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

      {/*------ Pieces ------*/}
      {/* The mailbox at the far (left) end, the dog in front of it towards the words. */}
      <div className="absolute inset-x-0 bottom-(--ground) mx-auto h-full w-[18rem] lg:w-[26rem]">
        <MascotCut
          name="plants"
          eager
          className="lively-sway absolute bottom-0 -left-[1rem] w-[3.25rem] translate-y-[6%] lg:-left-[1.5rem] lg:w-[5rem]"
        />
        <MascotCut
          name="mailbox"
          eager
          className="absolute bottom-0 left-[1.5rem] w-[6.5rem] translate-y-[5%] lg:left-[2.5rem] lg:w-[10.5rem]"
        />
        <MascotCut
          name="plants"
          eager
          className="lively-sway-2 absolute -right-[1rem] bottom-0 w-[3rem] translate-y-[6%] -scale-x-100 lg:-right-[1.5rem] lg:w-[4.5rem]"
        />

        {/*------ The Dog on the Phone ------*/}
        {/* The receiver lift is on the wrapper, the idle tilt on the picture, so one doesn't cancel the other. */}
        <div className="pl-lift absolute right-[2.25rem] bottom-0 w-(--dog-w) translate-y-[3%] lg:right-[3rem]">
          <div className="lively-pet">
            <MascotCut name="phone" eager className="lively-tilt block w-full" />
          </div>
        </div>

        {/*------ Bubble ------*/}
        {/* His head is about 38% of his width in from his right side, at the top of his 294/256 height: the tail's
            centre (2.25rem in from the bubble's right edge) lands over it. */}
        <ChalkBubble
          tail="right"
          className="pl-pop absolute right-[calc(2.25rem+var(--dog-w)*0.38-2.25rem)] bottom-[calc(var(--dog-w)*1.1+0.7rem)] max-w-[12rem] text-pretty lg:right-[calc(3rem+var(--dog-w)*0.38-2.25rem)] lg:max-w-[15rem]"
        >
          {m.account_partner_leads_hero_bubble()}
        </ChalkBubble>
      </div>
    </div>
  );
}
