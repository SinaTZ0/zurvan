import { ChevronLeftIcon } from "lucide-react";

import { CustomerContact } from "~/components/customer-contact";
import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { AdminPartner } from "~/orpc/partner/contract";

/*===== Partner Row =====*/
/**
 * One partner in the roster. The name is a stretched link that opens the drawer (`href` keeps it a real link for a new
 * tab and before hydration); the phone link sits above it (`relative z-10`) so it stays tappable.
 *
 * The counts follow the road a person walks and are cumulative, as on the partner's own dashboard: every number he is
 * still counting (lost ones are not), people who signed up (bought ones included), people who bought. A partner who is owed shows the sum as the row's last word, since that is what he came to settle.
 */
export function PartnerRow({ partner, href, onOpen }: { partner: AdminPartner; href: string; onOpen: () => void }) {
  const { counts, commissions } = partner;

  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3 transition-colors [grid-template-areas:'name_end'_'who_who'_'counts_counts'] hover:border-primary/40 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_minmax(0,4fr)_auto] lg:[grid-template-areas:'name_who_counts_end']">
      {/*===== Name =====*/}
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 [grid-area:name]">
        <Link
          to={href}
          onClick={(event) => {
            // A plain click opens the drawer in place (a shallow URL change, no loader run); a new-tab click keeps
            // the browser's own behaviour.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpen();
          }}
          className="min-w-0 rounded-sm font-bold break-words outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          <bdi>{partner.name}</bdi>
        </Link>
        {!partner.isActive && (
          <span className="inline-flex h-6 items-center rounded-full border border-border px-2.5 text-xs font-bold text-muted-foreground">
            غیرفعال
          </span>
        )}
      </div>

      {/*===== Phone and Code =====*/}
      {/* The name is already the row's link: hide the contact's own copy of it, keeping the call link. */}
      <div className="relative z-10 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 [grid-area:who] [&_a]:min-h-10 lg:[&_a]:min-h-0">
        <CustomerContact
          name={partner.name}
          phoneNumber={partner.phoneNumber}
          className="[&>span:first-child]:hidden"
        />
        <span dir="ltr" className="text-xs text-muted-foreground">
          {partner.code}
        </span>
      </div>

      {/*===== Counts =====*/}
      <p className="text-sm text-muted-foreground [grid-area:counts]">
        {formatNumberFa(counts.lead + counts.registered + counts.bought)} شماره ·{" "}
        {formatNumberFa(counts.registered + counts.bought)} ثبت‌نام · {formatNumberFa(counts.bought)} خرید
      </p>

      {/*===== Owed and Open =====*/}
      <div className="flex items-center gap-3 [grid-area:end]">
        {commissions.unpaidAmount > 0 && (
          <p className="text-sm font-bold tabular-nums">
            <span className="sr-only">منتظر پرداخت: </span>
            {formatToman(commissions.unpaidAmount)}
          </p>
        )}
        <ChevronLeftIcon
          aria-hidden
          strokeWidth={1.7}
          className="hidden size-5 text-muted-foreground transition-colors group-hover:text-foreground lg:block"
        />
      </div>
    </li>
  );
}
