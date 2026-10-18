import { PhoneIcon } from "lucide-react";

import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";
import { CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

const FOOTER_GROUPS = [
  {
    title: "دوره‌ها",
    // The free assessment has its gold pill in the header; the footer doesn't repeat it.
    links: [{ label: "همه‌ی دوره‌ها", to: "/courses" }],
  },
  {
    title: "ارتباط با زروان",
    links: [
      { label: "درباره‌ی طلا راستی", to: "/about" },
      { label: "تماس با ما", to: "/contact" },
      { label: "همکاری با زروان", to: "/join/partner" },
      ...CENTER_LINKS.map((link) => ({
        label: (
          <>
            {link.label}: <bdi>{link.handle}</bdi>
          </>
        ),
        to: link.href,
      })),
    ],
  },
  {
    title: "راهنما",
    links: [
      { label: "سؤال‌های پرتکرار", to: "/help" },
      { label: "حریم خصوصی", to: "/privacy" },
    ],
  },
] as const;

/*===== Site Footer =====*/
export function SiteFooter() {
  return (
    <footer className="relative isolate mt-section-md overflow-hidden surface-inverse bg-[color-mix(in_oklab,var(--inverse)_70%,black)]">
      <div className="site-container grid gap-10 py-section-sm lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] lg:gap-gutter">
        {/*------ Brand ------*/}
        <div className="flex max-w-sm flex-col gap-4">
          <Link to="/" className="self-start rounded-sm" aria-label="زروان، صفحه‌ی اصلی">
            <BrandLogo className="text-[1.875rem]" />
          </Link>
          <p className="text-sm font-bold text-foreground">مجموعه تربیتی و رفتارشناسی سگ زروان</p>
          <p className="text-sm text-pretty text-muted-foreground">
            از اولین تجربه‌های زندگی کنار سگت تا آموزش‌های تخصصی و حرفه‌ای، زروان همراهتونه؛ با برنامه‌ای که متناسب با
            نیاز و شرایط هر سگ طراحی می‌شه.
          </p>
          <p className="text-sm text-muted-foreground">
            {HEAD_TRAINER.name} · محدوده‌ی فعالیت: {CENTER_SERVICE_AREA}
          </p>
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className="flex items-center gap-2.5 self-start py-2 text-base font-bold text-foreground transition-colors hover:text-saffron"
          >
            <PhoneIcon strokeWidth={1.7} className="size-5 text-saffron" aria-hidden />
            {/* Phone numbers read left to right even in Persian text. */}
            <span dir="ltr">{CENTER_PHONE.display}</span>
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

      {/* Decorative stencil sits behind the content without adding height to the footer. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 site-container flex flex-col lg:flex-row-reverse">
        <p
          aria-hidden
          dir="ltr"
          className="mb-[0.16em] font-stencil text-[clamp(9rem,45vw,24rem)] leading-[0.8] font-black text-transparent opacity-40 select-none [-webkit-text-stroke:1px_var(--primary)]"
        >
          K9
        </p>
      </div>

      <div className="border-t">
        <p className="site-container py-5 text-xs text-muted-foreground">© ۱۴۰۵ زروان. همه‌ی حقوق محفوظ است.</p>
      </div>
    </footer>
  );
}
