import { type LucideIcon, ShieldCheckIcon, UndoDotIcon, WalletIcon } from "lucide-react";

import { Link } from "~/components/link";

type TrustNote = {
  title: string;
  body: string;
  Icon: LucideIcon;
  link?: { label: string; to: string };
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
  },
  {
    title: "پرداخت امن، با کیف پول",
    body: "پرداخت از درگاه بانکی انجام می‌شود. موجودی کیف پولت اول خرج می‌شود و بازپرداخت‌ها همان‌جا می‌نشیند.",
    Icon: WalletIcon,
  },
];

/*===== Trust Notes =====*/
/** What's protected before anyone pays. Polite and concrete, the tone for anything about money and safety. */
export function TrustNotes() {
  return (
    <section aria-labelledby="trust-title" className="site-container pt-section-md">
      <h2 id="trust-title" className="sr-only">
        اطمینان از خرید
      </h2>
      <ul className="grid gap-4 md:grid-cols-3 md:gap-gutter">
        {NOTES.map(({ title, body, Icon, link }) => (
          <li key={title} className="flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon strokeWidth={1.7} className="size-6" aria-hidden />
            </span>
            <h3 className="text-h4">{title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{body}</p>
            {link && (
              <Link to={link.to} className="mt-auto self-start text-sm font-bold text-primary hover:underline">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
