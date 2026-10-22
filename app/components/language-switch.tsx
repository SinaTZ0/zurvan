import { useLocation } from "@tanstack/react-router";
import { Languages } from "lucide-react";

import { cn } from "cn";

import { hrefInLocale, isEnglish, isPersianOnlyPath } from "~/lib/i18n";
import { m } from "~/paraglide/messages";

/*===== Language Switch =====*/
// «English» on the Persian pages and «فارسی» on the English ones, each written in its own language and script, so a
// visitor who can't read the page still finds theirs. It opens the same page in the other language with a full page
// load (the document's language, direction and faces change). A page that only exists in Persian (`/admin`, `/rules`)
// has nowhere to go, so the switch isn't drawn there. Shared by the storefront's and the account's shells.

/** Where the switch leads, or null on a Persian-only page. */
function useLanguageTarget() {
  const location = useLocation({
    select: (current) => ({ pathname: current.pathname, publicHref: current.publicHref }),
  });
  if (isPersianOnlyPath(location.pathname)) return null;

  const locale = isEnglish() ? "fa" : "en";
  return { locale, href: hrefInLocale({ publicHref: location.publicHref, locale }) } as const;
}

/**
 * The switch as a link. `className` styles it the way its place needs (the header's nav link, a sheet row, the
 * footer's small print); `icon` adds the line icon the sheet's rows carry.
 */
export function LanguageSwitch({ className, icon = false }: { className?: string; icon?: boolean }) {
  const target = useLanguageTarget();
  if (!target) return null;

  return (
    <a
      href={target.href}
      hrefLang={target.locale}
      lang={target.locale}
      title={m.shared_language_switch_aria()}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {icon && <Languages aria-hidden className="size-5 text-primary" strokeWidth={1.8} />}
      {m.shared_language_switch_label()}
    </a>
  );
}
