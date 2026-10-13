import { cn } from "cn";
import { Link2Icon, PhoneIncomingIcon, QrCodeIcon, type LucideIcon } from "lucide-react";

/*===== Ways In =====*/
// The three ways a customer reaches a partner, as app-spec F7 defines them. The Partner Dashboard and Leads pages
// (`/account/partner`) show them once the Admin has created the account; these cells describe what the partner gets.
const WAYS: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: Link2Icon,
    title: "لینک مخصوص تو",
    detail: "هر مشتری که با لینکت بیاد، به حساب تو ثبت می‌شه.",
  },
  { icon: QrCodeIcon, title: "QR برای پیشخوان", detail: "همون لینک به شکل QR، برای مغازه‌ی تو." },
  {
    icon: PhoneIncomingIcon,
    title: "شماره‌ی مشتری",
    detail: "شماره‌ی مشتری رو قبل از ثبت‌نامش توی داشبوردت وارد کن؛ اگه با اون شماره ثبت‌نام کنه، مال توئه.",
  },
];

/*===== Ways In Strip =====*/
/** Three cells under the hero, divided by hairlines: columns on desktop, stacked rows with the icon at the start on phones. */
export function WaysIn() {
  return (
    <section aria-label="سه راه برای معرفی مشتری" className="border-y border-border bg-sunken">
      <ul className="site-container grid lg:grid-cols-3">
        {WAYS.map(({ icon: Icon, title, detail }, index) => (
          <li
            key={title}
            // Hairlines between cells only: the top of each row on phones, the start edge of each column but the first.
            className={cn(
              "flex items-start gap-4 py-6 lg:flex-col lg:gap-4 lg:py-8",
              index > 0 && "max-lg:border-t max-lg:border-border lg:border-s lg:border-border lg:ps-8",
              index === 0 && "lg:pe-8",
            )}
          >
            <Icon aria-hidden strokeWidth={1.5} className="size-9 shrink-0 text-primary" />
            <div>
              <p className="font-extrabold">{title}</p>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="site-container pb-6 text-sm text-muted-foreground lg:pb-8">
        اگه چند همکار یه شماره رو وارد کنن، اولی می‌مونه.
      </p>
    </section>
  );
}
