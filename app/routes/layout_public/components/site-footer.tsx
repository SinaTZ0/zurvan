import { ArrowUpLeft, MapPin, Phone, UserRound } from "lucide-react";

import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";
import { toPersianDigits } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { SITE_RULES } from "~/lib/site-rules";
import { BrandEmblem } from "~/components/brand-emblem";
import { SOCIAL_ICONS } from "~/components/social-icons";

/*===== Footer =====*/
// The storefront's facts, laid out as a full-width band: the brand with its social links, three
// link groups, and how to reach the center, over a copyright line. Gold only marks the contact icons, as everywhere
// on this page. On the home page the closing scene's dog stands on the band's top edge.
const FOOTER_GROUPS = [
  { title: "دوره‌ها", links: [{ label: "همه‌ی دوره‌ها", to: "/courses" }] },
  {
    title: "ارتباط با زروان",
    links: [
      { label: `درباره‌ی ${HEAD_TRAINER.name}`, to: "/about" },
      { label: "تماس با ما", to: "/contact" },
      { label: "همکاری با زروان", to: "/join/partner" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { label: "سؤال‌های پرتکرار", to: "/help" },
      { label: "لاگ‌بوک سگ‌ها", to: "/logbook" },
      // Only once the owner has approved the wording.
      ...(SITE_RULES ? [{ label: "قوانین", to: "/rules" }] : []),
    ],
  },
];

const FOOTER_FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const FOOTER_LINK = `rounded text-foreground/70 transition-colors hover:text-foreground ${FOOTER_FOCUS}`;

/** The storefront footer on every public page; below `lg` it leaves room at the bottom for the floating tab bar. */
export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-card paper-grain text-sm text-foreground/85">
      {/* Below lg the bottom padding clears the floating tab bar. */}
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-32 md:px-8 md:pt-24 lg:pb-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-[1.9fr_repeat(3,minmax(0,1fr))_1.3fr] lg:gap-x-10">
          {/*------ Brand ------*/}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className={`inline-flex items-center gap-3 rounded ${FOOTER_FOCUS}`}>
              <BrandEmblem className="size-14" />
              <span className="flex flex-col leading-tight">
                <span className="font-display text-3xl font-black text-foreground">زروان</span>
                <span className="mt-0.5 text-xs text-foreground/65">{CENTER_DESCRIPTOR}</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-pretty text-foreground/70">
              {HEAD_TRAINER.name} از سال {toPersianDigits(String(HEAD_TRAINER.since))} سگ‌ها رو آموزش می‌ده:
              فرمان‌پذیری، اصلاح رفتار، کارهای تخصصی و آمادگی مسابقه.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {CENTER_LINKS.map((item) => {
                const Icon = SOCIAL_ICONS[item.href];
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`flex items-center gap-2 rounded-xl border border-foreground/15 px-3 py-1.5 text-foreground/85 transition-colors hover:border-foreground/35 hover:text-foreground ${FOOTER_FOCUS}`}
                    >
                      <Icon className="size-[1.125rem] text-primary" />
                      {item.label}
                      <ArrowUpLeft aria-hidden className="size-3.5 text-foreground/50" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/*------ Link groups ------*/}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-display text-base font-bold text-foreground">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={FOOTER_LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/*------ Reach the center ------*/}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h2 className="font-display text-base font-bold text-foreground">تماس با زروان</h2>
            <ul className="mt-4 flex flex-col gap-3.5">
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
                <a
                  href={`tel:${CENTER_PHONE.tel}`}
                  dir="ltr"
                  className={`rounded font-bold text-foreground tabular-nums hover:underline ${FOOTER_FOCUS}`}
                >
                  {CENTER_PHONE.display}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
                فعالیت در {CENTER_SERVICE_AREA}
              </li>
              <li className="flex items-center gap-2.5">
                <UserRound aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
                مربی: {HEAD_TRAINER.name}
              </li>
            </ul>
          </div>
        </div>

        {/*------ Bottom bar ------*/}
        <div className="mt-12 flex flex-col gap-3 border-t border-foreground/10 pt-6 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© ۱۴۰۵ زروان. همه‌ی حقوق محفوظ است.</p>
          <Link to="/privacy" className={`self-start ${FOOTER_LINK} text-foreground/60`}>
            حریم خصوصی
          </Link>
        </div>
      </div>
    </footer>
  );
}
