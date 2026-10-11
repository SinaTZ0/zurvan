import { cn } from "cn";
import {
  BadgeCheckIcon,
  HeartIcon,
  HouseIcon,
  ListChecksIcon,
  PawPrintIcon,
  ShieldIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { BrandLogo } from "~/components/brand-logo";
import { HEAD_TRAINER } from "~/lib/head-trainer";

// The catalog's families, as the owner names them on the course cards.
const DISCIPLINES = [
  { label: "سگ خونگی", Icon: HouseIcon },
  { label: "سگ اجتماعی", Icon: UsersIcon },
  { label: "فرمان‌پذیری", Icon: ListChecksIcon },
  { label: "سگ همدم", Icon: HeartIcon },
  { label: "سگ‌های کار", Icon: ShieldIcon },
  { label: "سگ‌های ورزشی", Icon: TrophyIcon },
] as const;

/*===== Auth Banner =====*/
/**
 * Desktop-only brand panel beside the auth forms: a charcoal hero card that says who K9 Training is, the trainer, and
 * what he teaches. Phones skip it, so it must not hold anything the forms depend on.
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
      <BrandLogo className="self-start text-[2.75rem]" />

      {/*------ Pitch ------*/}
      <div className="my-auto flex max-w-xl flex-col py-10">
        <h2
          id="auth-banner-title"
          className="max-w-md font-display text-[2.75rem] leading-tight font-bold text-balance"
        >
          آموزش خصوصی سگ با {HEAD_TRAINER.name}
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          ارزیابی اول رایگان است. بعد از آن، جلسه‌ها و پیشرفت سگت را همین‌جا دنبال می‌کنی و دوره‌ی بعدی را مستقیم رزرو
          می‌کنی.
        </p>

        {/*------ Disciplines ------*/}
        <ul className="mt-8 flex flex-wrap gap-2">
          {DISCIPLINES.map(({ label, Icon }) => (
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
        همه‌ی جلسه‌ها را خود {HEAD_TRAINER.firstName} برگزار می‌کند، گاهی با کمک دستیارش.
      </p>
    </aside>
  );
}
