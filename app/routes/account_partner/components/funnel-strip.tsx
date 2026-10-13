import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";

/*===== Funnel =====*/
/** Who the partner's link and numbers brought, by how far they got (F7). Lost people are left out before this runs. */
export type PartnerFunnel = {
  /** Everyone not lost: the numbers entered and the customers the link brought. */
  numbers: number;
  /** Signed up, including those who went on to buy. */
  registered: number;
  bought: number;
};

/*===== Funnel Strip =====*/
/**
 * The three counts in one strip that links to the full list of people. With nobody yet, the counts stay at zero and a
 * sentence says how to start, so the strip is never an empty card.
 */
export function FunnelStrip({ funnel }: { funnel: PartnerFunnel }) {
  const isEmpty = funnel.numbers === 0;

  const cells = [
    { label: "شماره‌ی ثبت‌شده", value: funnel.numbers },
    { label: "ثبت‌نام‌شده", value: funnel.registered },
    { label: "خریدار", value: funnel.bought },
  ];

  return (
    <section aria-labelledby="partner-funnel-title" className="flex flex-col gap-4">
      <h2 id="partner-funnel-title" className="font-display text-2xl font-black">
        مشتری‌هایی که آوردی
      </h2>

      <Link
        to="/account/partner/leads"
        className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:border-ring"
      >
        <dl className="grid grid-cols-3 gap-3">
          {cells.map((cell) => (
            <div key={cell.label} className="min-w-0 text-center">
              <dt className="text-xs text-balance text-muted-foreground sm:text-sm">{cell.label}</dt>
              <dd className="mt-1 font-display text-3xl font-black tabular-nums">{formatNumberFa(cell.value)}</dd>
            </div>
          ))}
        </dl>
        <span className="flex items-center justify-center gap-1 border-t border-border pt-4 text-sm font-bold text-primary">
          همه‌شان
          <ChevronLeftIcon aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
        </span>
      </Link>

      {isEmpty && (
        <p className="text-pretty text-muted-foreground">
          هنوز کسی نیامده؛ شماره‌ی مشتری‌هایی که می‌شناسی را هم می‌توانی ثبت کنی.
        </p>
      )}
    </section>
  );
}
