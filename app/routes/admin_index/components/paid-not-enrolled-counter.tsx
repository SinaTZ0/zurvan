import { Link } from "~/components/link";
import { formatToman } from "~/lib/course-format";

import { PopNumber } from "./pop-number";
import { TileChevron } from "./tile-chevron";

/*===== Torn Edge =====*/
// The bottom edge torn into teeth: a CSS mask keeps the tile's body and cuts a row of downward points under it. The
// same torn piece as Payments' flagged slip, so the two pages speak the same language. The tile's dashed outline runs
// round the other three sides; the teeth carry the tile's tinted fill.
const TOOTH = "0.5rem";
const TORN_EDGE: React.CSSProperties = {
  WebkitMask: `linear-gradient(#000 0 0) top / 100% calc(100% - ${TOOTH}) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / calc(2 * ${TOOTH}) ${TOOTH} repeat-x`,
  mask: `linear-gradient(#000 0 0) top / 100% calc(100% - ${TOOTH}) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / calc(2 * ${TOOTH}) ${TOOTH} repeat-x`,
};

/*===== Paid, Not Enrolled Counter =====*/
/**
 * F5's flag: items whose money was taken but that got no enrollment. Above zero it is the torn piece (a dashed
 * destructive outline over a tinted fill, its bottom edge torn), with the count in gold because it is work waiting and
 * the amount actually taken for those items (a deposit's share, not the full price). It reads as the part that didn't
 * go through, never as a debt: if money goes back, he records the refund on Payments. At zero it is one calm line and
 * no link, since the flagged list would be empty.
 */
export function PaidNotEnrolledCounter({ count, amount }: { count: number; amount: number }) {
  if (count === 0) {
    return <p className="flex min-h-10 items-center text-sm text-muted-foreground">همه‌ی خریدها ثبت‌نام شدن</p>;
  }

  return (
    <Link
      to="/admin/payments?view=flagged"
      style={TORN_EDGE}
      className="group flex items-center gap-4 rounded-t-2xl border border-b-0 border-dashed border-destructive/60 bg-destructive/[0.08] p-4 pb-6 transition-colors hover:border-destructive hover:bg-destructive/[0.12] focus-visible:border-destructive"
    >
      <span className="w-14 shrink-0 text-center font-display text-3xl leading-none font-black text-primary sm:w-16">
        <PopNumber value={count} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-pretty">پولش گرفته شده ولی ثبت‌نام نشده</span>
        <span className="mt-0.5 block text-sm font-bold whitespace-nowrap tabular-nums">
          <PopNumber value={amount}>{formatToman(amount)}</PopNumber>
        </span>
        <span className="mt-1 block text-sm text-pretty text-muted-foreground">
          اگه قراره پس بدی، بازپرداخت رو توی پرداخت‌ها ثبت کن.
        </span>
      </span>
      <TileChevron />
    </Link>
  );
}
