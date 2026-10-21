import { cn } from "cn";
import { SlidersHorizontalIcon } from "lucide-react";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Page Header =====*/
/**
 * The page's heading: a gold-outlined chip naming the room, the `h1`, and one line saying what can be changed here. The
 * line differs by role because a partner has a third card (the Sheba) that a customer doesn't.
 */
export function PageHeader({ isPartner }: { isPartner: boolean }) {
  return (
    <header>
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
        <SlidersHorizontalIcon aria-hidden strokeWidth={2} className="size-4" />
        تنظیمات
      </p>
      <h1 className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance")}>تنظیمات حساب</h1>
      <p className="mt-3 max-w-xl text-lead text-pretty text-muted-foreground">
        {isPartner ? "اسمت، رمزت و شبای واریز کمیسیونت رو همین‌جا درست کن." : "اسمت و رمزت رو همین‌جا درست کن."}
      </p>
    </header>
  );
}
