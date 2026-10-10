import { type LucideIcon, ShieldCheckIcon, UndoDotIcon, WalletIcon } from "lucide-react";

import { Link } from "~/components/link";

type TrustNote = {
  title: string;
  body: string;
  Icon: LucideIcon;
  link?: { label: string; to: string };
  /** The refund note is saffron-tinted so money reads differently from safety. */
  tone?: "saffron";
};

const NOTES: TrustNote[] = [
  {
    title: "فقط مربیان تأییدشده",
    body: "مدارک، سابقه و هویت هر مربی پیش از اولین کلاس بررسی می‌شود. امتیازها را فقط کسانی می‌دهند که کلاس را گذرانده‌اند.",
    Icon: ShieldCheckIcon,
  },
  {
    title: "بازپرداخت روشن",
    body: "اگر کلاس به حد نصاب نرسد یا لغو شود، کل مبلغ برمی‌گردد. بعد از قطعی شدن، طبق سیاست لغو همان دوره که پیش از پرداخت می‌بینی.",
    Icon: UndoDotIcon,
    link: { label: "قوانین لغو و بازپرداخت", to: "/help/refunds" },
    tone: "saffron",
  },
  {
    title: "پرداخت امن، با کیف پول",
    body: "پرداخت از درگاه بانکی انجام می‌شود. موجودی کیف پولت اول خرج می‌شود و بازپرداخت‌ها همان‌جا می‌نشیند.",
    Icon: WalletIcon,
  },
];

/*===== Trust Notes =====*/
/**
 * What's protected before anyone pays. Polite and concrete, the tone for anything about money and safety. One bordered
 * panel split by dividers rather than three separate cards, so it reads as a single promise right under the hero.
 */
export function TrustNotes() {
  return (
    <section aria-labelledby="trust-title" className="site-container pt-6">
      <h2 id="trust-title" className="sr-only">
        اطمینان از خرید
      </h2>
      <ul className="grid divide-y overflow-hidden rounded-3xl border bg-card md:grid-cols-3 md:divide-x md:divide-y-0">
        {NOTES.map(({ title, body, Icon, link, tone }) => (
          <li key={title} className="flex items-start gap-4 p-6 md:px-7">
            <span
              className={
                tone === "saffron"
                  ? "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-saffron/15 text-saffron-text"
                  : "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              }
            >
              <Icon strokeWidth={1.7} className="size-6" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-h4">{title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {body}
                {link && (
                  <>
                    {" "}
                    <Link to={link.to} className="font-bold whitespace-nowrap text-primary hover:underline">
                      {link.label}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
