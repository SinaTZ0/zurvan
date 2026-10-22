import { cn } from "cn";
import { useState } from "react";
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon, RotateCcwIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { describePrerequisites, formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { AdminCourse } from "~/orpc/course/contract";
import { describeShelfFacts } from "~/routes/admin_courses/shelf-facts";
import { PopNumber } from "~/routes/admin_courses/components/pop-number";
import { INK_OUTLINE, SHELF_COLUMNS, SHELF_PADDING } from "~/routes/admin_courses/surfaces";

/*===== Types =====*/
export type MoveDirection = "up" | "down";

/*===== Course Row =====*/
/**
 * One rung of the shelf, inside the plate: the position in Estedad with the two arrows beside it (the order is what
 * customers see, so it is the thing he can touch), the cover as a small print, the course and its facts, the «بعد از:»
 * line that names the rung before it, the price, who bought it, and the two buttons. The tracks are `SHELF_COLUMNS`.
 *
 * - **Archived:** a dashed outline is drawn inside the row, the course dims and the «بایگانی‌شده» chip is stamped
 *   beside its title; it keeps its place, and «برگرداندن» takes the archive button's place (the same node, so focus
 *   comes back to it when the dialog closes). The buttons never dim.
 * - **Moving:** `moveLocked` holds every arrow while a move writes. Those arrows stay focusable (`aria-disabled`), so a
 *   keyboard press doesn't drop focus to the page; an arrow that can't move at all (the first's ↑, the last's ↓) is
 *   plainly disabled.
 * - **Lifted:** the row he just moved is drawn on the plate's paper above the row it passes, for the slide.
 */
export function CourseRow({
  course,
  position,
  isFirst,
  isLast,
  moveLocked,
  statusLocked,
  restoring,
  lifted,
  rowRef,
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
  moveLocked: boolean;
  /** A status change is in flight: every archive and restore button waits. */
  statusLocked: boolean;
  /** This row is the one being restored (its button shows the spinner). */
  restoring: boolean;
  lifted: boolean;
  rowRef: (node: HTMLLIElement | null) => void;
  onMove: (direction: MoveDirection) => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const archived = course.status === "archived";

  /*------ Changed Since Mount ------*/
  // Only a status that changed under him is stamped: an archived course that loads with the page simply shows its chip.
  // React's "adjust state while rendering" pattern, so the stamp starts in the same paint as the new status.
  const [seenStatus, setSeenStatus] = useState(course.status);
  const [statusChanged, setStatusChanged] = useState(false);
  if (course.status !== seenStatus) {
    setSeenStatus(course.status);
    setStatusChanged(true);
  }

  const prerequisites = describePrerequisites(course);
  // Dimmed parts fade, so archiving and restoring are seen; the buttons and the chip stay bright.
  const dim = cn("ac-fade", archived && "opacity-45");

  return (
    <li
      ref={rowRef}
      data-course={course.slug}
      className={cn(
        "relative items-center py-3 md:py-2 xl:py-1",
        SHELF_COLUMNS,
        SHELF_PADDING,
        lifted && "z-10 rounded-2xl bg-sunken paper-grain shadow-[0_14px_30px_-14px_rgb(0_0_0/0.95)]",
      )}
    >
      {/*===== Archived Outline =====*/}
      {/* Drawn inside the row (the plate's hairlines stay), the same dashed ink as the slips' tear. */}
      <span
        aria-hidden
        className={cn(
          "ac-fade pointer-events-none absolute inset-x-1.5 inset-y-1 rounded-2xl border border-dashed border-foreground/30",
          archived ? "opacity-100" : "opacity-0",
        )}
      />

      {/*===== Position =====*/}
      {/* Phones: the number over the two arrows, down the row's start edge. From `md`: the number beside them. */}
      <div className="flex flex-col items-center self-start [grid-area:pos] md:flex-row md:gap-1 md:self-center">
        <p className={cn("flex h-9 items-center md:h-auto md:w-9 md:justify-center", dim)}>
          <span className="sr-only">ردیف </span>
          <PopNumber
            value={position}
            className="font-display text-2xl leading-none font-extrabold text-foreground tabular-nums"
          />
        </p>
        <div className="flex flex-col">
          <MoveButton
            direction="up"
            title={course.title}
            atEdge={isFirst}
            locked={moveLocked}
            onMove={() => onMove("up")}
          />
          <MoveButton
            direction="down"
            title={course.title}
            atEdge={isLast}
            locked={moveLocked}
            onMove={() => onMove("down")}
          />
        </div>
      </div>

      {/*===== Cover =====*/}
      <img
        src={course.cover.src}
        alt=""
        width={course.cover.width}
        height={course.cover.height}
        loading="lazy"
        className={cn(
          "aspect-video w-full self-start rounded-lg object-cover ring-1 ring-foreground/15 [grid-area:cover] md:self-center",
          dim,
        )}
      />

      {/*===== The Course =====*/}
      {/* Phones: the title beside the cover and the facts under both (`contents`); from `md`, one block in its track. */}
      <div className="contents md:block md:min-w-0 md:self-center md:[grid-area:text]">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 self-end [grid-area:head] md:self-auto">
          <p className={cn("min-w-0 text-base leading-6 font-bold text-balance", dim)}>
            {course.title}{" "}
            <bdi dir="ltr" className="text-xs font-normal text-muted-foreground">
              {course.latinName}
            </bdi>
          </p>
          {archived && <ArchivedChip stamp={statusChanged} />}
        </div>

        <div className="mt-2 min-w-0 [grid-area:facts] md:mt-0.5">
          <p className={cn("text-xs leading-5 text-pretty text-muted-foreground", dim)}>{describeShelfFacts(course)}</p>
          {prerequisites && (
            <p className={cn("mt-0.5 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground", dim)}>
              <StepIcon />
              <span className="min-w-0">
                بعد از: <span className="text-foreground/85">{prerequisites}</span>
              </span>
            </p>
          )}
        </div>
      </div>

      {/*===== Price and Buyers =====*/}
      {/* Phones: one line under the title; from `md`, over the buttons at the end; from `xl`, two tracks of their own. */}
      <div className="flex flex-wrap items-baseline gap-x-3 self-start [grid-area:money] md:flex-col md:items-end md:gap-0.5 md:self-end xl:contents">
        <p className={cn("text-sm font-bold whitespace-nowrap tabular-nums xl:self-center xl:[grid-area:price]", dim)}>
          {course.price === null ? (
            <span className="font-normal text-muted-foreground">بعد از ارزیابی</span>
          ) : (
            formatToman(course.price)
          )}
        </p>
        <p
          className={cn(
            "text-xs whitespace-nowrap text-muted-foreground tabular-nums xl:self-center xl:[grid-area:enr]",
            dim,
          )}
        >
          {course.enrollmentCount > 0
            ? `${formatNumberFa(course.activeEnrollmentCount)} فعال از ${formatNumberFa(course.enrollmentCount)}`
            : "خریدار نداره"}
        </p>
      </div>

      {/*===== Actions =====*/}
      <div className="mt-3 grid grid-cols-2 gap-2 [grid-area:acts] md:mt-1.5 md:flex md:justify-end xl:mt-0 xl:self-center">
        <Link
          to="/admin/courses/$slug/edit"
          params={{ slug: course.slug }}
          className={buttonVariants({ variant: "outline", size: "sm", className: cn(INK_OUTLINE, "h-11 md:h-10") })}
        >
          ویرایش
        </Link>
        {archived ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(INK_OUTLINE, "h-11 md:h-10")}
            disabled={statusLocked}
            onClick={onRestore}
          >
            {restoring ? <Spinner aria-hidden /> : <RotateCcwIcon aria-hidden />}
            برگرداندن
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 text-muted-foreground hover:text-foreground md:h-10"
            disabled={statusLocked}
            onClick={onArchive}
          >
            <ArchiveIcon aria-hidden />
            بایگانی
          </Button>
        )}
      </div>
    </li>
  );
}

/*===== Move Button =====*/
/** One arrow, a 40px target. Locked while a move writes (still focusable), disabled for good at the shelf's end. */
function MoveButton({
  direction,
  title,
  atEdge,
  locked,
  onMove,
}: {
  direction: MoveDirection;
  title: string;
  atEdge: boolean;
  locked: boolean;
  onMove: () => void;
}) {
  const Icon = direction === "up" ? ChevronUpIcon : ChevronDownIcon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      data-move={direction}
      aria-label={direction === "up" ? `${title} یه ردیف بالاتر` : `${title} یه ردیف پایین‌تر`}
      disabled={atEdge || locked}
      focusableWhenDisabled={!atEdge}
      onClick={onMove}
      className="size-10 text-muted-foreground hover:text-foreground disabled:opacity-30 motion-reduce:transition-none data-disabled:opacity-30"
    >
      <Icon aria-hidden className="size-5" />
    </Button>
  );
}

/*===== Archived Chip =====*/
/**
 * «بایگانی‌شده» as a rubber stamp in ink, not an error's red: archiving is reversible. It is stamped when it appears
 * (`ac-stamp`); on load it is simply there, since a chip that mounts with the page has no change to answer.
 */
function ArchivedChip({ stamp }: { stamp: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border-[3px] border-double border-foreground/45 px-1.5 text-xs leading-5 font-black whitespace-nowrap text-foreground/85",
        stamp && "ac-stamp",
      )}
    >
      بایگانی‌شده
    </span>
  );
}

/*===== Step Icon =====*/
/** Three steps up toward the end, the way the shelf climbs: the rung named after it comes first. */
function StepIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-4 shrink-0"
    >
      <path d="M14.5 13.5h-4v-4h-4v-4h-4" />
    </svg>
  );
}
