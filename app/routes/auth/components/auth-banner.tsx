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
 * Desktop-only brand panel beside the auth forms: a hero card (ivory by day, ink by night) that says what Zurvann
 * offers. Phones skip it, so it must not hold anything the forms depend on.
 */
export function AuthBanner({ className }: { className?: string }) {
  return (
    <aside
      aria-labelledby="auth-banner-title"
      className={cn("relative isolate flex flex-col overflow-hidden rounded-3xl surface-inverse p-12", className)}
    >
      {/* Brand motif as a single accent, as on the pets hero. */}
      <PawPrintIcon
        aria-hidden
        strokeWidth={1.2}
        className="absolute -end-24 -bottom-24 -z-10 size-96 -rotate-12 text-saffron/10"
      />

      {/*------ Logo ------*/}
      {/* The banner is deep firuzeh in both themes, so the logo is always shown light. */}
      <img
        src="/logo-stack.png"
        alt=""
        width={180}
        height={170}
        className="h-32 w-auto self-start opacity-90 brightness-0 invert"
      />

      {/*------ Pitch ------*/}
      <div className="my-auto flex max-w-xl flex-col py-10">
        <p className="text-sm font-bold text-saffron">خدمات ممتاز حیوانات خانگی</p>
        <h2 id="auth-banner-title" className="mt-3 max-w-md text-[2.75rem] leading-tight text-balance">
          هر چیزی که حیوانت نیاز دارد، یک‌جا
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          از دامپزشک و پت تاکسی تا مربی و پانسیون، همه با متخصصان تأییدشده‌ی زروان.
        </p>

        {/*------ Services ------*/}
        <ul className="mt-8 flex flex-wrap gap-2">
          {SERVICES.map(({ label, Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full bg-foreground/5 py-2 ps-3 pe-4 text-sm font-bold ring-1 ring-border"
            >
              <Icon strokeWidth={1.7} className="size-5 text-saffron" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/*------ Verification ------*/}
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BadgeCheckIcon strokeWidth={1.7} className="size-5 shrink-0 text-saffron" aria-hidden />
        فقط متخصصان تأییدشده‌ی زروان به حیوان شما خدمت می‌دهند.
      </p>
    </aside>
  );
}
