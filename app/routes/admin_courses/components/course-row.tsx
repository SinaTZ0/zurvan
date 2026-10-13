import { cn } from "cn";
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon, RotateCcwIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { describeAge, describePlace, describePrerequisites, describeSessions, formatToman } from "~/lib/course-format";
import { FAMILY_TABS } from "~/lib/course-families";
import { formatNumberFa } from "~/lib/digits";
import type { AdminCourse } from "~/orpc/course/contract";

/*===== Course Row =====*/
/**
 * One rung of the shelf: the position number between two arrows (the order is what customers see, so it is the thing he
 * can touch), the cover, the facts, the price and the two actions. An archived course stays on its rung, dashed and
 * dimmed, with its «برگرداندن» button still in reach.
 */
export function CourseRow({
  course,
  position,
  isFirst,
  isLast,
  isMoving,
  isUpdating,
  onMove,
  onArchive,
  onRestore,
}: {
  course: AdminCourse;
  /** 1-based, as shown. */
  position: number;
  isFirst: boolean;
  isLast: boolean;
  /** A move is in flight: every arrow waits. */
  isMoving: boolean;
  /** This row's status change is in flight. */
  isUpdating: boolean;
  onMove: (direction: "up" | "down") => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const archived = course.status === "archived";
  const family = FAMILY_TABS.find((tab) => tab.family === course.family)?.label;
  const prerequisites = describePrerequisites(course);

  return (
    <li
      className={cn(
        "rounded-2xl border border-border bg-card px-3 py-3 sm:px-4",
        archived && "border-dashed bg-transparent",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 lg:flex-nowrap">
        {/*------ Position ------*/}
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="بالاتر"
              disabled={isFirst || isMoving}
              onClick={() => onMove("up")}
              className="size-10"
            >
              <ChevronUpIcon aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="پایین‌تر"
              disabled={isLast || isMoving}
              onClick={() => onMove("down")}
              className="size-10"
            >
              <ChevronDownIcon aria-hidden />
            </Button>
          </div>
          <span className="w-7 text-center text-sm font-extrabold tabular-nums">{formatNumberFa(position)}</span>
        </div>

        {/*------ Cover, Facts, Price (dimmed when archived; the buttons stay bright) ------*/}
        <div className={cn("flex min-w-0 flex-1 items-center gap-3", archived && "opacity-60")}>
          <img
            src={course.cover.src}
            alt=""
            width={960}
            height={540}
            loading="lazy"
            className="aspect-video w-16 shrink-0 rounded-lg object-cover lg:w-24"
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <p className="min-w-0 truncate font-extrabold">{course.title}</p>
              <span dir="ltr" className="min-w-0 truncate text-muted-foreground">
                {course.latinName}
              </span>
              {archived && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  بایگانی‌شده
                </span>
              )}
            </div>

            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              {family && <span>{family}</span>}
              <span>{describeAge(course)}</span>
              <span>{describeSessions(course)}</span>
              <span>{describePlace(course)}</span>
            </p>

            {prerequisites && <p className="mt-0.5 truncate text-sm text-muted-foreground">بعد از: {prerequisites}</p>}
          </div>
        </div>

        {/*------ Price and Actions ------*/}
        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
          <div className={cn("text-start lg:text-end", archived && "opacity-60")}>
            {course.price === null ? (
              <p className="text-sm text-muted-foreground">بعد از ارزیابی</p>
            ) : (
              <p className="font-extrabold tabular-nums">{formatToman(course.price)}</p>
            )}
            {course.enrollmentCount > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatNumberFa(course.activeEnrollmentCount)} فعال از {formatNumberFa(course.enrollmentCount)} ثبت‌نام
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/admin/courses/${course.slug}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              ویرایش
            </Link>
            {archived ? (
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={onRestore}>
                <RotateCcwIcon aria-hidden />
                برگرداندن
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={onArchive}>
                <ArchiveIcon aria-hidden />
                بایگانی
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
