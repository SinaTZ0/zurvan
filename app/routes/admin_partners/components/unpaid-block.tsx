import { CustomerContact } from "~/components/customer-contact";
import { formatToman } from "~/lib/course-format";
import type { AdminCommission } from "~/orpc/commission/contract";
import { CommissionLine } from "~/routes/admin_partners/components/commission-line";
import { ShebaInset } from "~/routes/admin_partners/components/sheba-inset";
import type { UnpaidBlockData } from "~/routes/admin_partners/partner-views";

/*===== Unpaid Block =====*/
/**
 * One partner who is owed, laid out in the order he works: look at where to send, send it, press the button.
 *
 * - **Head:** the partner to call at the start, the Sheba (inset, with its copy button) in the middle, the sum due at
 *   the end. On phones the same pieces stack in that order, the call button across the full width.
 * - **Lines:** one per commission, each with its own «پرداخت شد». There is no "pay all": each press writes one payment
 *   and sends one SMS.
 *
 * A partner with no Sheba yet can't be paid, so the middle says so and the call button stands where the number would be.
 */
export function UnpaidBlock({
  block,
  onPay,
}: {
  block: UnpaidBlockData;
  onPay: (commission: AdminCommission) => void;
}) {
  const { partner, name, lines, total } = block;
  const phoneNumber = partner?.phoneNumber ?? null;
  const sheba = partner?.shebaNumber ?? null;

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card">
      {/*===== Head =====*/}
      <div className="grid gap-4 border-b border-border p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] lg:items-center lg:gap-6">
        {/*------ Who to Pay ------*/}
        {/* The shared contact truncates a name to one line; a long name must wrap here (the brief), so the name is drawn
            by this block and the contact's own copy of it is hidden, keeping its call link. */}
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm font-bold text-balance break-words">
            <bdi>{name}</bdi>
          </p>
          {/* Phones: a full-width call button. */}
          <CustomerContact
            name={name}
            phoneNumber={phoneNumber}
            variant="call"
            className="lg:hidden [&_a]:h-11 [&_a]:w-full [&>span:first-child]:hidden"
          />
          {/* Desktop: a small number link; with no Sheba the call button stands in the middle instead. */}
          {sheba && (
            <CustomerContact
              name={name}
              phoneNumber={phoneNumber}
              className="hidden lg:flex [&>span:first-child]:hidden"
            />
          )}
        </div>

        {/*------ Where to Send ------*/}
        {sheba ? (
          <ShebaInset sheba={sheba} name={name} />
        ) : (
          <div className="flex min-w-0 flex-col gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-sm text-pretty text-muted-foreground">
              هنوز شبا ننوشته؛ به او زنگ بزن یا بگو از تنظیمات حساب بنویسد.
            </p>
            {/* The name is already at the start; here only the button matters. */}
            <CustomerContact
              name={name}
              phoneNumber={phoneNumber}
              variant="call"
              className="hidden lg:flex [&>span:first-child]:hidden"
            />
          </div>
        )}

        {/*------ Sum Due ------*/}
        <div className="lg:text-end">
          <p className="text-xs text-muted-foreground">جمع پرداخت</p>
          <p className="text-lg font-extrabold tabular-nums">{formatToman(total)}</p>
        </div>
      </div>

      {/*===== Lines =====*/}
      <ul className="divide-y divide-border px-4">
        {lines.map((commission) => (
          <CommissionLine key={commission.id} commission={commission} onPay={() => onPay(commission)} />
        ))}
      </ul>
    </li>
  );
}
