import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { formatTimestamp } from "~/lib/locale-format";
import type { PartnerPerson } from "~/orpc/partner/contract";
import { m } from "~/paraglide/messages";

/*===== Types =====*/
type Stop = {
  label: string;
  reached: boolean;
  /** Shown under a reached stop; the dates are the whole timeline. */
  date: Date | null;
};

/*===== Stops =====*/
/**
 * The three stops of one person. A link customer has no number: they start on «لینک», and the day they registered is
 * the date under «ثبت‌نام» (the API's `createdAt` for a link customer is that day, so there is no earlier date).
 */
function stopsOf(person: PartnerPerson): Stop[] {
  const registered = person.stage === "registered" || person.stage === "bought";
  return [
    {
      label: person.source === "link" ? m.account_partner_leads_road_link() : m.account_partner_leads_road_number(),
      reached: true,
      date: person.source === "link" ? null : person.createdAt,
    },
    {
      label: m.account_partner_leads_road_signup(),
      reached: registered,
      date: person.registeredAt ?? (person.source === "link" ? person.createdAt : null),
    },
    { label: m.account_partner_leads_road_purchase(), reached: person.stage === "bought", date: person.boughtAt },
  ];
}

/*===== Lead Road =====*/
/**
 * A person's road: number (or link), sign-up, purchase, three stops in equal thirds so every row's road lines up with
 * the next and the gold reads down the list. Reached stops are gold discs with a check and their date; the line is gold
 * up to where the person got; the next stop is an empty ring, a stop past it a fainter one. A lost person's road is grey
 * after its first disc, a dashed trail that stops, with «به اسم تو ثبت نشد.» where the dates would be: no reason, no
 * name, nobody else (F12).
 *
 * It draws itself as its row arrives (page-motion.tsx): the first disc pops, each line grows in reading direction and
 * the disc it reaches pops after it. `delay` is the row's place in the stagger, in seconds.
 *
 * Decorative: the row carries one sentence for screen readers, so the road is `aria-hidden` there.
 */
export function LeadRoad({ person, delay }: { person: PartnerPerson; delay: number }) {
  const lost = person.stage === "lost";
  const stops = stopsOf(person);
  // The first stop that is not reached yet; later ones are fainter.
  const nextIndex = stops.findIndex((stop) => !stop.reached);

  return (
    <ol className="grid grid-cols-3" style={{ "--road-delay": `${delay}s` } as React.CSSProperties}>
      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const nextReached = stops[index + 1]?.reached ?? false;

        /*------ Lost: the road ends after the first disc ------*/
        if (lost && !isFirst) {
          return (
            <li key={stop.label} className="relative">
              {index === 1 && (
                <p className="pl-disc absolute inset-x-0 top-9 w-[200%] text-xs text-pretty text-muted-foreground [--disc-step:1]">
                  {m.account_partner_leads_road_lost()}
                </p>
              )}
            </li>
          );
        }

        return (
          <li key={stop.label} className="relative flex flex-col items-center gap-1 text-center">
            {/*------ Line to the next stop ------*/}
            {/* From this disc's centre to the next one's (a third of the road), drawn under the opaque discs. Gold when
                the next stop is reached; a dashed ink trail when it isn't; for a lost person a grey dash that fades out
                halfway, the road that stopped. */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "pl-line absolute start-1/2 top-[0.8125rem] h-0 w-full",
                  lost
                    ? "w-[70%] border-t-2 border-dashed border-muted-foreground/40 [mask-image:linear-gradient(to_right,transparent,black_60%)]"
                    : nextReached
                      ? "border-t-[3px] border-primary"
                      : "border-t-2 border-dashed border-foreground/25",
                )}
                style={{ "--disc-step": index } as React.CSSProperties}
              />
            )}

            {/*------ Disc ------*/}
            <span
              aria-hidden
              className={cn(
                "pl-disc relative grid size-7 place-items-center rounded-full",
                stop.reached && !lost && "bg-primary text-primary-foreground",
                stop.reached && lost && "bg-muted-foreground/45 text-card",
                !stop.reached && index === nextIndex && "border-2 border-foreground/55 bg-card",
                !stop.reached && index !== nextIndex && "border-2 border-foreground/20 bg-card",
              )}
              style={{ "--disc-step": index } as React.CSSProperties}
            >
              {stop.reached && <CheckIcon className="size-4" strokeWidth={3} />}
            </span>

            {/*------ Label and date ------*/}
            <span
              className={cn(
                "mt-0.5 text-xs font-bold",
                stop.reached && !lost ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {stop.label}
            </span>
            {stop.reached && stop.date && (
              <span className="text-[0.6875rem] leading-tight whitespace-nowrap text-muted-foreground tabular-nums ltr:whitespace-normal">
                {formatTimestamp(stop.date)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
