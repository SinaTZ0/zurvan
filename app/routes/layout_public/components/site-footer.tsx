import { PhoneIcon } from "lucide-react";

import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";

// The pages behind these links come later in phase one; the structure is what matters for now.
const FOOTER_GROUPS = [
  {
    title: "دوره‌ها",
    links: [
      { label: "همه‌ی دوره‌ها", to: "/courses" },
      { label: "کلاس‌های پیش رو", to: "/#upcoming-runs" },
      { label: "دوره‌های آنلاین", to: "/courses?format=online" },
    ],
  },
  {
    title: "همراه زروان",
    links: [{ label: "همکاری فروشگاه‌ها و کلینیک‌ها", to: "/join/partner" }],
  },
  {
    title: "راهنما",
    links: [
      { label: "قوانین لغو و بازپرداخت", to: "/help/refunds" },
      { label: "سؤال‌های پرتکرار", to: "/help" },
      { label: "حریم خصوصی", to: "/privacy" },
    ],
  },
] as const;

/*===== Site Footer =====*/
export function SiteFooter() {
  return (
    <footer className="mt-section-md surface-inverse bg-[color-mix(in_oklab,var(--inverse)_70%,black)]">
      <div className="site-container grid gap-10 py-section-sm lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] lg:gap-gutter">
        {/*------ Brand ------*/}
        <div className="flex max-w-sm flex-col gap-4">
          <Link to="/" className="self-start rounded-sm" aria-label="زروان، صفحه‌ی اصلی">
            <BrandLogo className="text-[1.875rem]" />
          </Link>
          <p className="text-sm text-pretty text-muted-foreground">
            دوره‌های آموزشی سگ با مربیان تأییدشده، در کلاس‌های حضوری و آنلاین.
          </p>
          <a
            href="tel:02191000000"
            className="flex items-center gap-2.5 self-start py-2 text-base font-bold text-foreground transition-colors hover:text-saffron"
          >
            <PhoneIcon strokeWidth={1.7} className="size-5 text-saffron" aria-hidden />
            {/* Phone numbers read left to right even in Persian text. */}
            <span dir="ltr">۰۲۱-۹۱۰۰۰۰۰۰</span>
          </a>
        </div>

        {/*------ Link Groups ------*/}
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-base text-foreground">{group.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/*===== Name =====*/}
      {/* The name as big as the page allows, standing on the bottom rule with its tails cut off, beside where it comes
          from. A name with a story is easier to remember than one that is only repeated. */}
      <div className="site-container -mt-6 flex flex-col gap-6 overflow-hidden lg:-mt-16 lg:flex-row-reverse lg:items-end lg:justify-between">
        <p className="max-w-xs text-sm leading-[1.9] text-pretty text-muted-foreground lg:mb-10">
          زروان در اسطوره‌های ایرانی خدای زمان است. آموزش حیوان هم با زمان و حوصله جواب می‌دهد، و اسم ما از همین‌جا
          آمده.
        </p>
        <p
          aria-hidden
          className="-mb-[0.32em] text-[clamp(7rem,40vw,28rem)] leading-[0.9] font-black text-inverse-foreground/[0.08] select-none"
        >
          زروان
        </p>
      </div>

      <div className="border-t">
        <p className="site-container py-5 text-xs text-muted-foreground">© ۱۴۰۵ زروان. همه‌ی حقوق محفوظ است.</p>
      </div>
    </footer>
  );
}
