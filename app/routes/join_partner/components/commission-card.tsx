import { DEFAULT_PARTNER_COMMISSION_PERCENT } from "~/lib/business-rules";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Commission Card =====*/
/**
 * The commission rules, as a raised card at the end of the page's middle row. The percent is the business rule's
 * constant, so changing it there changes it here. Payment happens outside the app: the card says so, and the app only
 * records whether it has been paid.
 */
export function CommissionCard() {
  return (
    <section
      aria-labelledby="commission-title"
      className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 id="commission-title" className="font-display text-h2 font-black text-balance">
        کمیسیون چطوریه؟
      </h2>
      <ul className="mt-6 grid gap-4">
        <CommissionItem>
          {formatNumberFa(DEFAULT_PARTNER_COMMISSION_PERCENT)}٪ از مجموع دوره‌هایی که مشتری توی اولین خریدش می‌خره.
        </CommissionItem>
        <CommissionItem>فقط اولین خرید؛ از خریدهای بعدی همون مشتری چیزی نمی‌رسه.</CommissionItem>
        <CommissionItem>
          {HEAD_TRAINER.firstName} کمیسیون رو بیرون از سایت با واریز بانکی به شبات می‌ده و توی سایت «پرداخت شد» می‌زنه.
          تو هر کمیسیون رو پرداخت‌شده یا پرداخت‌نشده می‌بینی.
        </CommissionItem>
        <CommissionItem>اگه بعدش آموزش لغو بشه، کمیسیون برای تو می‌مونه.</CommissionItem>
      </ul>
    </section>
  );
}

/** One line of the list, with a gold dot at its start. */
function CommissionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
      <span className="text-pretty">{children}</span>
    </li>
  );
}
