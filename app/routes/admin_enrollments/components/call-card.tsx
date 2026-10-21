import { PhoneIcon } from "lucide-react";
import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";

/*===== Notch =====*/
// A half-round bite out of the plate where the tear meets its edge, as on the customer's slips: a disc of the page's
// paper over the edge, the outside half clipped by the plate's `overflow-hidden`.
const NOTCH = "pointer-events-none absolute size-5 rounded-full border border-border/60 bg-background paper-grain";

/*===== Phone =====*/
/** `09123456789` as «۰۹۱۲ ۳۴۵ ۶۷۸۹», easier to read off while dialling; any other shape is shown as it is. */
function formatPhone(phoneNumber: string): string {
  const grouped = /^09\d{9}$/.test(phoneNumber)
    ? `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`
    : phoneNumber;
  return toPersianDigits(grouped);
}

/*===== Call Card =====*/
/**
 * The stub of a customer's block: who to call, their number as a big gold-outlined `tel:` pill (dialling is what the
 * Admin does here, and a person who bought two courses is dialled once), and how much of theirs the view lists. Its
 * name is the block's heading.
 *
 * - Phones: a band on top of the block, the pill across its width (48px), the tear under it.
 * - `md` to `xl`: still a band, the name and the count on the start side and the pill at the end.
 * - From `xl`: the block's start column, the tear running down its end edge, notched at both ends.
 *
 * `CustomerContact`'s `call` variant is the shared, row-sized version; this one needs the name as a heading and a
 * bigger pill, so it is drawn here.
 */
export function CallCard({
  customer,
  lineCount,
  dogCount,
  headingId,
}: {
  customer: AdminEnrollment["customer"];
  lineCount: number;
  dogCount: number;
  headingId: string;
}) {
  return (
    <div className="relative flex flex-col gap-3 border-b-2 border-dashed border-foreground/15 bg-foreground/[0.025] p-4 sm:p-5 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-x-6 md:gap-y-1 xl:flex xl:h-full xl:flex-col xl:items-stretch xl:gap-4 xl:border-e-2 xl:border-b-0 xl:p-6">
      {/*------ Notches ------*/}
      {/* Below `xl` the tear runs across under the band (both bottom corners); from `xl` it runs down its end edge. */}
      <span
        aria-hidden
        className={`${NOTCH} -start-2.5 -bottom-2.5 xl:start-auto xl:-end-2.5 xl:-top-2.5 xl:bottom-auto`}
      />
      <span aria-hidden className={`${NOTCH} -end-2.5 -bottom-2.5`} />

      {/*------ Who ------*/}
      <h2 id={headingId} className={cn(DISPLAY_HEADING, "min-w-0 text-xl break-words md:col-start-1 md:row-start-1")}>
        {customer.name}
      </h2>

      {/*------ Call ------*/}
      {/* In the `md` band the pill takes the end column across both rows; elsewhere it follows the name. */}
      {customer.phoneNumber === null ? (
        <p className="text-sm text-muted-foreground md:col-start-2 md:row-span-2 md:row-start-1">شماره‌ای نداده</p>
      ) : (
        <a
          href={`tel:${customer.phoneNumber}`}
          aria-label={`زنگ بزن به ${customer.name}`}
          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-primary/70 px-5 text-lg font-bold transition-colors outline-none hover:border-primary hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 md:col-start-2 md:row-span-2 md:row-start-1 md:h-11 xl:h-12"
        >
          <PhoneIcon aria-hidden strokeWidth={1.8} className="size-5 text-primary" />
          <bdi dir="ltr" className="tracking-wide whitespace-nowrap tabular-nums">
            {formatPhone(customer.phoneNumber)}
          </bdi>
        </a>
      )}

      {/*------ How Much ------*/}
      <p className="text-xs text-muted-foreground md:col-start-1 md:row-start-2">
        {formatNumberFa(lineCount)} ثبت‌نام · {formatNumberFa(dogCount)} سگ
      </p>
    </div>
  );
}
