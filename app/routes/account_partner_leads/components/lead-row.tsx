import { cn } from "cn";

import { toPersianDigits } from "~/lib/digits";
import type { PartnerPerson } from "~/orpc/partner/contract";
import { HighlightRing } from "~/routes/account_partner_leads/components/highlight-ring";
import { LeadRoad } from "~/routes/account_partner_leads/components/lead-road";
import { STAGE_STATUS } from "~/routes/account_partner_leads/stages";

/*===== Phone =====*/
/** `09123456789` as «۰۹۱۲ ۳۴۵ ۶۷۸۹»; anything that is not in the stored shape is shown as it is, in Persian digits. */
function formatPhone(phoneNumber: string): string {
  const grouped = /^09\d{9}$/.test(phoneNumber)
    ? `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`
    : phoneNumber;
  return toPersianDigits(grouped);
}

/*===== Lead Row =====*/
/**
 * One person of the partner's: who (the number he typed, and once registered the customer's name; or a link customer's
 * name), the road they are on, and where they stand in words. Never prices or dogs, and a lost person shows no name
 * (F12). From `lg` it is one line of three parts; on phones a card with the road full width under the identity.
 *
 * The visible content is hidden from screen readers in favour of one sentence, so a reader hears «{who}: {stage}»
 * instead of three stops.
 */
export function LeadRow({ person, highlighted }: { person: PartnerPerson; highlighted: boolean }) {
  const lost = person.stage === "lost";
  const number = person.phoneNumber ? formatPhone(person.phoneNumber) : null;
  const name = person.customerName;

  // Who the sentence names: the customer's name and the number he typed, whichever exist.
  const identity = [name, number].filter(Boolean).join("، ");

  return (
    <li className={cn("relative rounded-2xl border border-border bg-card p-4", lost && "opacity-70")}>
      <p className="sr-only">
        {identity}: {STAGE_STATUS[person.stage]}
      </p>

      <div
        aria-hidden
        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)_auto] lg:items-center lg:gap-x-6"
      >
        {/*------ Who ------*/}
        <div className="col-start-1 row-start-1 flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 text-sm font-extrabold text-balance break-words">
              {name ?? <bdi dir="ltr">{number}</bdi>}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-bold text-muted-foreground">
              {person.source === "link" ? "از لینک" : "شماره"}
            </span>
          </div>
          {name && number && (
            <bdi dir="ltr" className="w-fit text-xs text-muted-foreground tabular-nums">
              {number}
            </bdi>
          )}
        </div>

        {/*------ Road ------*/}
        <div className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <LeadRoad person={person} />
        </div>

        {/*------ Where They Stand ------*/}
        <div className="col-start-2 row-start-1 lg:col-start-3">
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-xs font-bold whitespace-nowrap",
              person.stage === "bought" && "bg-foreground text-background",
              person.stage === "registered" && "border border-foreground/40 text-foreground",
              (person.stage === "lead" || lost) && "border border-border text-muted-foreground",
            )}
          >
            {STAGE_STATUS[person.stage]}
          </span>
        </div>
      </div>

      {highlighted && <HighlightRing />}
    </li>
  );
}
