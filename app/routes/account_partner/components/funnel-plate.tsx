import { cn } from "cn";
import { ChevronLeftIcon, PhoneIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { buttonVariants } from "~/components/ui/button";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";
import type { PartnerFunnel } from "~/routes/account_partner/funnel";
import { EdgeDog } from "~/routes/account_partner/components/edge-dog";
import { PlateHead } from "~/routes/account_partner/components/plate-head";
import { useInView } from "~/routes/account_partner/hooks/use-in-view";
import { PLATE } from "~/routes/account_partner/plate";

/*===== Constants =====*/
const LEADS_PATH = "/account/partner/leads";

// The part of the road a person has walked is gold, the part ahead faint ink. A pattern's stroke colour is fixed where
// the pattern is defined, so each colour has its own pattern (`FunnelChalk`).
const SEGMENT_FILL = {
  walked: "[fill:url(#pd-trail-gold)] opacity-80",
  ahead: "[fill:url(#pd-trail-ink)] opacity-40",
} as const;

/*===== Funnel Plate =====*/
/**
 * «مشتری‌هایی که آوردی»: the funnel as a road of three stops (شماره → ثبت‌نام → خرید) on a chalk line that ends at the
 * gold flag. A stop someone reached is a gold disc with its count in display numerals; a stop with nobody is a faint
 * ring with a calm «—». The whole plate is the link to the full list on Leads, «همه‌شون» at its foot. With nobody yet
 * the road stays (all rings) and a line and a gold «ثبت شماره» link say how to start; the plate is then not a link, so
 * the two links never nest.
 *
 * The `look-back` dog sits on the plate's top edge by the dimmed signpost, turned back to look at who came; he speaks
 * only once the plate comes into view. Motion (page-motion.tsx, started by `useInView`): he rises from behind the edge,
 * then the road draws itself in reading direction and the stops pop in one after another, the flag last.
 */
export function FunnelPlate({ funnel }: { funnel: PartnerFunnel }) {
  const { ref, seen } = useInView<HTMLElement>();
  const isEmpty = funnel.numbers === 0;

  const road = <FunnelRoad funnel={funnel} />;

  return (
    <section ref={ref} aria-labelledby="partner-funnel-title">
      <PlateHead
        id="partner-funnel-title"
        title={m.account_partner_funnel_title()}
        figureClassName="ml-[3.75rem] sm:ml-[5rem]"
        figure={
          <EdgeDog
            name="look-back"
            idle="lively-tilt"
            className="w-[4.75rem] sm:w-[6rem]"
            scenery={{ name: "signpost", width: "112%", className: "right-[70%]" }}
          >
            {seen && (
              <ChalkBubble
                tail="end"
                className="pd-say absolute bottom-[86%] max-w-none whitespace-nowrap ltr:right-[calc(38%-2.25rem)] rtl:left-[calc(62%-2.25rem)]"
              >
                {m.account_partner_funnel_bubble()}
              </ChalkBubble>
            )}
          </EdgeDog>
        }
      />

      {isEmpty ? (
        /*===== Nobody Yet =====*/
        <div className={PLATE}>
          {road}
          <div className="mt-7 flex flex-col gap-4 border-t border-dashed border-foreground/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-pretty text-muted-foreground">{m.account_partner_funnel_empty()}</p>
            <Link
              to={LEADS_PATH}
              className={buttonVariants({ variant: "solid", className: "w-full shrink-0 sm:w-auto sm:px-6" })}
            >
              <PhoneIcon aria-hidden className="size-4" />
              {m.account_partner_funnel_add_number()}
            </Link>
          </div>
        </div>
      ) : (
        /*===== The Plate as a Link =====*/
        <Link
          to={LEADS_PATH}
          className={cn(
            PLATE,
            "group block pb-4 transition-[border-color] outline-none hover:border-primary/45 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:pb-5",
          )}
        >
          {road}
          <span className="mt-6 flex items-center justify-center gap-1 border-t border-dashed border-foreground/15 pt-4 text-sm font-bold text-primary">
            {m.account_partner_funnel_see_all()}
            <ChevronLeftIcon
              aria-hidden
              className="size-4 transition-transform group-hover:-translate-x-0.5 ltr:-scale-x-100 ltr:group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      )}
    </section>
  );
}

/*===== Funnel Road =====*/
/**
 * Three stops across the plate in reading direction, the flag planted past the last one at the far end. Each stop's
 * item holds the segment that leaves it, from its disc's centre to the next disc's centre (the items are equal columns,
 * so that is one item's width); the last one runs on to the flag's pole. A segment is gold when someone reached the
 * stop it leads to.
 */
function FunnelRoad({ funnel }: { funnel: PartnerFunnel }) {
  const stops = [
    { label: m.account_partner_funnel_stop_number(), value: funnel.numbers },
    { label: m.account_partner_funnel_stop_signup(), value: funnel.registered },
    { label: m.account_partner_funnel_stop_purchase(), value: funnel.bought },
  ];

  return (
    <>
      <FunnelChalk />
      <ol
        aria-label={m.account_partner_funnel_road_label()}
        className="pd-road relative grid grid-cols-3 pe-12 sm:pe-16"
      >
        {stops.map((stop, index) => {
          const last = index === stops.length - 1;
          const next = stops[index + 1];
          const walked = next ? next.value > 0 : stop.value > 0;

          return (
            <li key={stop.label} className="relative flex flex-col items-center gap-2.5">
              {/*------ Segment ------*/}
              {/* An svg keeps its own 150px height whatever its insets, so both sizes are set. From this disc's centre
                  (half the item in) one item's width to the next; the last one through the end padding to the flag's
                  pole, which stands 76% across the picture from its left edge (36px at `w-12`, 48px at `w-16`). */}
              <svg
                aria-hidden
                className={cn(
                  `pd-seg pd-seg-${index} absolute start-1/2 top-[calc(2rem-8px)] h-4 sm:top-[calc(2.5rem-8px)]`,
                  last ? "w-[calc(50%+3rem-36px)] sm:w-[calc(50%+4rem-48px)]" : "w-full",
                  walked ? SEGMENT_FILL.walked : SEGMENT_FILL.ahead,
                )}
              >
                <rect width="100%" height="100%" filter="url(#pd-trail-chalk)" />
              </svg>

              {/*------ Disc ------*/}
              <span className={`pd-stop pd-stop-${index} relative z-10`}>
                <StopDisc value={stop.value} />
              </span>

              {/*------ Label ------*/}
              <span
                className={cn(
                  "text-sm font-bold sm:text-base",
                  stop.value > 0 ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {stop.label}
              </span>
            </li>
          );
        })}

        {/*------ Finish Flag ------*/}
        {/* At the road's far end (the left in RTL), standing on the line: its foot a little below the line's centre. */}
        <MascotCut
          name="flag"
          className="pd-flag lively-sway-2 absolute end-0 top-[calc(2rem+8px)] w-12 -translate-y-full sm:top-[calc(2.5rem+10px)] sm:w-16"
        />
      </ol>
    </>
  );
}

/*===== Stop Disc =====*/
/**
 * A stop: a gold disc with the count in display numerals when someone reached it, else a hand-drawn chalk ring on the
 * plate's colour (it hides the line passing under it) with a faint «—» and the word for screen readers.
 */
function StopDisc({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-[1.75rem] leading-none font-black text-primary-foreground shadow-[0_8px_22px_-10px_rgb(255_194_26/0.6)] sm:size-20 sm:text-[2.1rem]">
        {formatNumber(value)}
      </span>
    );
  }

  return (
    <span className="relative grid size-16 place-items-center rounded-full bg-sunken sm:size-20">
      <svg aria-hidden viewBox="0 0 64 64" fill="none" className="absolute inset-0 text-foreground/30">
        <path
          d="M33 4C49 4 60 16 60 32S48 60 32 60 4 47 4 32 16 4 29 5.5"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          filter="url(#pd-trail-chalk)"
        />
      </svg>
      <span aria-hidden className="relative font-display text-2xl font-black text-muted-foreground/50">
        —
      </span>
      <span className="sr-only">{m.account_partner_zero_sr()}</span>
    </span>
  );
}

/*===== Funnel Chalk =====*/
/**
 * The chalk the road is drawn in, under `pd-` ids (the Dashboard's road chalk, copied: a filter that roughens lines,
 * a dashed wavering line as a tiled pattern in px so it never stretches, in gold and in ink). The svg is sized to
 * nothing but not `display: none`, which would stop Chrome painting what uses it.
 */
function FunnelChalk() {
  return (
    <svg aria-hidden className="absolute size-0">
      <defs>
        <filter id="pd-trail-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.5} />
        </filter>
        {(["gold", "ink"] as const).map((tone) => (
          <pattern key={tone} id={`pd-trail-${tone}`} width="64" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
              fill="none"
              style={{ stroke: tone === "gold" ? "var(--primary)" : "var(--foreground)" }}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </pattern>
        ))}
      </defs>
    </svg>
  );
}
