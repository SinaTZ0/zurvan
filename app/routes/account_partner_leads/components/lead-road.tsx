import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { formatJalaliTimestamp } from "~/lib/jalali";
import type { PartnerPerson } from "~/orpc/partner/contract";

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
      label: person.source === "link" ? "لینک" : "شماره",
      reached: true,
      date: person.source === "link" ? null : person.createdAt,
    },
    {
      label: "ثبت‌نام",
      reached: registered,
      date: person.registeredAt ?? (person.source === "link" ? person.createdAt : null),
    },
    { label: "خرید", reached: person.stage === "bought", date: person.boughtAt },
  ];
}

/*===== Lead Road =====*/
/**
 * A person's chalk road in miniature (the one `/help` uses): number, sign-up, purchase, joined by a line. Reached
 * stops are gold discs with a check and their date; the next stop is an empty ring; the line is gold up to where the
 * person has got. A lost person's road is grey and stops after the first disc in a dashed trail, and the sentence
 * «به اسم تو ثبت نشد.» sits where the dates would be: no reason, no name, nobody else (F12).
 *
 * Decorative: the row carries one sentence for screen readers, so the road is `aria-hidden` there.
 */
export function LeadRoad({ person }: { person: PartnerPerson }) {
  const lost = person.stage === "lost";
  const stops = stopsOf(person);
  // The first stop that is not reached yet; later ones are fainter.
  const nextIndex = stops.findIndex((stop) => !stop.reached);

  return (
    <ol className="grid grid-cols-3">
      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;

        /*------ Lost: the road ends after the first disc ------*/
        if (lost && !isFirst) {
          return (
            <li key={stop.label} className="relative">
              {index === 1 && (
                <p className="absolute inset-x-0 top-8 w-[200%] text-xs text-pretty text-muted-foreground">
                  به اسم تو ثبت نشد.
                </p>
              )}
            </li>
          );
        }

        return (
          <li key={stop.label} className="relative flex flex-col items-center gap-1 text-center">
            {/*------ Line to the next stop ------*/}
            {/* Drawn from this disc's centre toward the end side; the opaque discs hide the ends. Gold when the next
                stop is reached, dashed otherwise (and for the whole trail of a lost person). */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute start-1/2 top-3 border-t-2",
                  lost ? "w-[130%] border-dashed border-muted-foreground/40" : "w-full",
                  !lost && stops[index + 1]?.reached && "border-primary",
                  !lost && !stops[index + 1]?.reached && "border-dashed border-border",
                )}
              />
            )}

            {/*------ Disc ------*/}
            <span
              aria-hidden
              className={cn(
                "relative grid size-6 place-items-center rounded-full",
                stop.reached && !lost && "bg-primary text-primary-foreground",
                stop.reached && lost && "bg-muted-foreground/40 text-card",
                !stop.reached && index === nextIndex && "border-2 border-muted-foreground/70 bg-card",
                !stop.reached && index !== nextIndex && "border-2 border-border bg-card",
              )}
            >
              {stop.reached && <CheckIcon className="size-3.5" strokeWidth={3} />}
            </span>

            {/*------ Label and date ------*/}
            <span className={cn("text-xs font-bold", stop.reached ? "text-foreground" : "text-muted-foreground")}>
              {stop.label}
            </span>
            {stop.reached && stop.date && (
              <span className="text-xs text-muted-foreground tabular-nums">{formatJalaliTimestamp(stop.date)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
