import { cn } from "cn";

import { Link } from "~/components/link";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

import { PopNumber } from "./pop-number";
import { ShareBar } from "./share-bar";
import { TileChevron } from "./tile-chevron";

/*===== Swatches =====*/
// Each number's key to its segment of the strip under it.
const SWATCHES = {
  active: "bg-foreground",
  completed: "bg-foreground/50",
  cancelled: "border-[1.5px] border-dashed border-foreground/60",
} as const;

/*===== Enrollments Plate =====*/
/**
 * «ثبت‌نام‌ها»: in training, finished and cancelled, three ivory numbers side by side, each the link to its filter on
 * Enrollments, over one proportional strip, so the share reads without arithmetic. Never lit: none of these waits for
 * him (the endings are done on the Enrollments page).
 */
export function EnrollmentsPlate({ enrollments }: { enrollments: DashboardOverview["enrollments"] }) {
  const { active, completed, cancelled } = enrollments;
  const total = active + completed + cancelled;

  const figures = [
    { key: "active", label: "در حال آموزش", value: active, to: "/admin/enrollments?status=active" },
    { key: "completed", label: "تمام شده", value: completed, to: "/admin/enrollments?status=completed" },
    { key: "cancelled", label: "لغو شده", value: cancelled, to: "/admin/enrollments?status=cancelled" },
  ] as const;

  return (
    <div className="flex h-full flex-col">
      <div className={cn(ADMIN_PLATE, "flex flex-1 flex-col justify-between gap-5 p-3 sm:p-4")}>
        {/*===== Numbers =====*/}
        <ul className="grid grid-cols-3">
          {figures.map((figure) => (
            <li key={figure.key} className="min-w-0 border-s border-foreground/10 first:border-s-0">
              <Link
                to={figure.to}
                className="group flex h-full flex-col gap-1.5 rounded-2xl px-2 py-2 transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] sm:px-4"
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "font-display text-3xl leading-none font-black sm:text-4xl xl:text-5xl",
                      // A zero steps back: nothing there to look at.
                      figure.value === 0 && "text-muted-foreground",
                    )}
                  >
                    <PopNumber value={figure.value} />
                  </span>
                  <TileChevron className="size-4" />
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", SWATCHES[figure.key])} />
                  {figure.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/*===== Strip =====*/}
        <div className="px-2 pb-3 sm:px-4 sm:pb-4">
          <ShareBar active={active} completed={completed} total={total} scale={total} variant="strip" />
        </div>
      </div>

      {/*===== Total =====*/}
      {/* Under the plate, like the money's footnote beside it, so the two plates end on one line from `xl`. */}
      <p className="mt-3 px-1 text-xs text-pretty text-muted-foreground">
        {total === 0 ? "هنوز کسی ثبت‌نام نشده." : `روی هم ${formatNumberFa(total)} ثبت‌نام از اول.`}
      </p>
    </div>
  );
}
