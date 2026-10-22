import { cn } from "cn";

import { isEnglish } from "~/lib/i18n";
import { m } from "~/paraglide/messages";

/*===== In Persian Note =====*/
/**
 * The small «in Persian» chip on an English page's link to a page that has no English (the site rules and the Admin's
 * panel since Phase 4: `isPersianOnlyPath`, docs/i18n/english-version-plan.md, decision 4). It sits inside the link,
 * after its words, so the visitor knows before the click. Nothing on the Persian pages.
 *
 * `hidden` keeps the note for screen readers only, where a tab or an icon has no room for it.
 */
export function InPersianNote({ hidden = false, className }: { hidden?: boolean; className?: string }) {
  if (!isEnglish()) return null;
  if (hidden) return <span className="sr-only"> ({m.shared_in_persian()})</span>;

  return (
    <span
      className={cn(
        "ms-2 inline-block rounded-full border border-current/35 px-1.5 py-px align-middle text-[0.68em] leading-tight font-semibold whitespace-nowrap opacity-80",
        className,
      )}
    >
      {m.shared_in_persian()}
    </span>
  );
}

/** An `aria-label` for such a link: «Sign in (in Persian)» on the English pages, the label alone on the Persian ones. */
export function withInPersian(label: string): string {
  return isEnglish() ? `${label} (${m.shared_in_persian()})` : label;
}
