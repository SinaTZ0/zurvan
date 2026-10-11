import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { addDaysIso, saturdayOnOrBefore, weekRangeLabel } from "~/routes/trainer_schedule/week";

/*===== Schedule Header =====*/
/**
 * The page's title, the week's range with its stepper, and the page's one main action. The week lives in the URL
 * (`?week=` with the Saturday), so a reload or a shared link shows the same week; «این هفته» drops the parameter.
 */
export function ScheduleHeader({
  weekStart,
  today,
  onOpenTimes,
}: {
  weekStart: string;
  /** `YYYY-MM-DD` in Tehran. */
  today: string;
  onOpenTimes: () => void;
}) {
  const isThisWeek = weekStart === saturdayOnOrBefore(today);
  const weekLink = (days: number) => ({ search: `?week=${addDaysIso({ date: weekStart, days })}` });

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl leading-tight font-extrabold lg:text-4xl">برنامه‌ی من</h1>

        {/*------ Week Stepper ------*/}
        <nav aria-label="هفته" className="flex flex-wrap items-center gap-2">
          <Link
            to={weekLink(-7)}
            preventScrollReset
            aria-label="هفته‌ی قبل"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronRightIcon aria-hidden />
          </Link>
          <Link
            to={{ search: "" }}
            preventScrollReset
            aria-current={isThisWeek ? "page" : undefined}
            className={buttonVariants({ variant: isThisWeek ? "secondary" : "outline", size: "sm" })}
          >
            این هفته
          </Link>
          <Link
            to={weekLink(7)}
            preventScrollReset
            aria-label="هفته‌ی بعد"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChevronLeftIcon aria-hidden />
          </Link>
          <p className="ms-2 font-bold">{weekRangeLabel(weekStart)}</p>
        </nav>
      </div>

      {/*------ Main Action ------*/}
      <Button type="button" onClick={onOpenTimes} className="w-full lg:w-auto">
        <PlusIcon aria-hidden data-icon="inline-start" />
        وقت باز کن
      </Button>
    </header>
  );
}
