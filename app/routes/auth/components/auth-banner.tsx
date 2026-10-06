import { cn } from "cn";
import {
  BadgeCheckIcon,
  CarIcon,
  DogIcon,
  FootprintsIcon,
  HouseIcon,
  PawPrintIcon,
  StethoscopeIcon,
} from "lucide-react";

const SERVICES = [
  { label: "دامپزشکی", Icon: StethoscopeIcon },
  { label: "پت تاکسی", Icon: CarIcon },
  { label: "مربی", Icon: DogIcon },
  { label: "پت واکر", Icon: FootprintsIcon },
  { label: "پانسیون", Icon: HouseIcon },
] as const;

/*===== Auth Banner =====*/
/**
 * Desktop-only brand panel beside the auth forms: a dark green hero card that says what Zurvan
 * offers. Phones skip it, so it must not hold anything the forms depend on.
 */
export function AuthBanner({ className }: { className?: string }) {
  return (
    <aside
      aria-labelledby="auth-banner-title"
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-3xl bg-hero p-12 text-hero-foreground dark:ring-1 dark:ring-gold/20",
        className,
      )}
    >
      {/* Brand motif as a single accent, as on the pets hero. */}
      <PawPrintIcon
        aria-hidden
        strokeWidth={1.2}
        className="absolute -end-24 -bottom-24 -z-10 size-96 -rotate-12 text-gold/10"
      />

      {/*------ Logo ------*/}
      {/* The logo is dark green artwork, so it's turned light on the green card. */}
      <img
        src="/logo-stack.png"
        alt=""
        width={180}
        height={170}
        className="h-32 w-auto self-start opacity-90 brightness-0 invert"
      />

      {/*------ Pitch ------*/}
      <div className="my-auto flex max-w-xl flex-col py-10">
        <p className="text-sm font-bold text-gold">خدمات ممتاز حیوانات خانگی</p>
        <h2 id="auth-banner-title" className="mt-3 max-w-md text-[2.75rem] leading-tight text-balance">
          هر چیزی که حیوانت نیاز دارد، یک‌جا
        </h2>
        <p className="mt-4 max-w-md text-hero-foreground/80">
          از دامپزشک و پت تاکسی تا مربی و پانسیون، همه با متخصصان تأییدشده‌ی زروان.
        </p>

        {/*------ Services ------*/}
        <ul className="mt-8 flex flex-wrap gap-2">
          {SERVICES.map(({ label, Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full bg-white/5 py-2 ps-3 pe-4 text-sm font-bold ring-1 ring-gold/25"
            >
              <Icon strokeWidth={1.7} className="size-5 text-gold" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/*------ Verification ------*/}
      <p className="flex items-center gap-2 text-sm text-hero-foreground/80">
        <BadgeCheckIcon strokeWidth={1.7} className="size-5 shrink-0 text-gold" aria-hidden />
        فقط متخصصان تأییدشده‌ی زروان به حیوان شما خدمت می‌دهند.
      </p>
    </aside>
  );
}
