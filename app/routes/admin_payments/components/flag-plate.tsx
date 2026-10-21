import { cn } from "cn";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";

import { TORN_EDGE, TORN_PIECE } from "../slip-marks";

/*===== Flag Plate =====*/
/**
 * The first thing the Admin sees when money arrived without a course: how many items, and what they cost together, on
 * a plate torn like the items it points at. It is not an alarm (no icon, no fill): «ببین» opens the flagged view.
 *
 * The page decides when it shows (something is flagged, and the view isn't already `flagged`). When it stops showing
 * because the last flagged item was resolved, it keeps its last numbers and fades and folds away (`pm-leave`) instead of
 * vanishing; switching to the flagged view just hides it.
 */
export function FlagPlate({
  visible,
  totals,
  onShow,
}: {
  visible: boolean;
  /** Over the whole list, not the filtered one: the flag counts every flagged item. */
  totals: { count: number; total: number };
  onShow: () => void;
}) {
  /*------ Leaving ------*/
  // React's "adjust state on a prop change" pattern: compare with the last render's props, not in an effect, so the
  // leaving plate is in the very render where the flag goes away.
  const [shown, setShown] = useState(totals);
  const [wasVisible, setWasVisible] = useState(visible);
  const [leaving, setLeaving] = useState(false);

  if (visible && (totals.count !== shown.count || totals.total !== shown.total)) setShown(totals);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    setLeaving(!visible && totals.count === 0);
  }

  if (!visible && !leaving) return null;

  return (
    // The grid row folds from 1fr to 0fr while leaving; the inner box clips what is folded away.
    <div
      inert={leaving}
      className={cn("grid grid-rows-[1fr]", leaving && "pm-leave")}
      onAnimationEnd={(event) => event.target === event.currentTarget && setLeaving(false)}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-t-3xl paper-grain px-5 pt-4 pb-5 sm:px-6",
            TORN_PIECE,
            TORN_EDGE,
          )}
        >
          <p className="text-sm font-bold text-pretty">
            {formatNumberFa(shown.count)} مورد پولش گرفته شده ولی ثبت‌نام نشده
            {/* Phones: the total takes its own line rather than starting one with the dot. */}
            <span className="text-muted-foreground max-sm:hidden"> · </span>
            <span className="whitespace-nowrap max-sm:mt-0.5 max-sm:block">{formatToman(shown.total)}</span>
          </p>
          <Button variant="outline" size="sm" className="max-sm:h-11 max-sm:px-5" onClick={onShow}>
            ببین
          </Button>
        </div>
      </div>
    </div>
  );
}
