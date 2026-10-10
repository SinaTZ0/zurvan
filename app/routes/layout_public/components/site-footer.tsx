import { PhoneIcon } from "lucide-react";

import { Link } from "~/components/link";

// The pages behind these links come later in phase one; the structure is what matters for now.
const FOOTER_GROUPS = [
  {
    title: "دوره‌ها",
    links: [
      { label: "دوره‌های سگ", to: "/courses?species=dog" },
      { label: "دوره‌های گربه", to: "/courses?species=cat" },
      { label: "دوره‌های آنلاین", to: "/courses?format=online" },
      { label: "همه‌ی دوره‌ها", to: "/courses" },
    ],
  },
  {
    title: "همراه زروان",
    links: [
      { label: "مربی زروان شو", to: "/join/trainer" },
      { label: "همکاری فروشگاه‌ها و کلینیک‌ها", to: "/join/partner" },
    ],
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
    <footer className="mt-section-md border-t bg-sunken">
      <div className="site-container grid gap-10 py-section-sm lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] lg:gap-gutter">
        {/*------ Brand ------*/}
        <div className="flex max-w-sm flex-col gap-4">
          <img
            src="/logo-h.png"
            alt="زروان"
            width={316}
            height={106}
            loading="lazy"
            className="h-10 w-auto self-start brightness-0 dark:opacity-90 dark:invert"
          />
          <p className="text-sm text-pretty text-muted-foreground">
            دوره‌های آموزشی سگ و گربه با مربیان تأییدشده، در کلاس‌های حضوری و آنلاین.
          </p>
          <a
            href="tel:02191000000"
            className="flex items-center gap-2 self-start text-sm font-bold transition-colors hover:text-primary"
          >
            <PhoneIcon strokeWidth={1.7} className="size-4 text-primary" aria-hidden />
            {/* Phone numbers read left to right even in Persian text. */}
            <span dir="ltr">۰۲۱-۹۱۰۰۰۰۰۰</span>
          </a>
        </div>

        {/*------ Link Groups ------*/}
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-base">{group.title}</h2>
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

      <div className="site-container border-t py-6">
        <p className="text-xs text-muted-foreground">© ۱۴۰۵ زروان. همه‌ی حقوق محفوظ است.</p>
      </div>
    </footer>
  );
}
