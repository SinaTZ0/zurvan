import { cn } from "cn";
import { CheckIcon, LockIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ADMIN_HAIRLINE } from "~/lib/admin-plate";
import { useHasChanged } from "~/routes/admin_dog_detail/hooks/use-has-changed";
import type { Rung, RungState } from "~/routes/admin_dog_detail/ladder";
import { INK_OUTLINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Marks =====*/
// The mark on the rail says where the dog stands at a glance: a passed rung is final and needs nothing, so it is ivory,
// not gold; the open ring is the only gold on the ladder (where the dog can go next); a locked rung is an ink lock.
const MARKS: Record<RungState, string> = {
  "passed-enrollment": "border-foreground bg-foreground text-background",
  "passed-admin": "border-foreground bg-foreground text-background",
  open: "border-primary bg-sunken",
  locked: "border-foreground/20 bg-sunken text-muted-foreground",
};

/*===== Ladder Rung =====*/
/**
 * One course on the dog's ladder. Its mark sits on the plate's ink rail (a segment per rung, starting at the first
 * mark and ending at the last); the rung itself is the ink hairline that runs from the rail to the end of the row.
 * Then the title, one line of words, and at most one button: «گذرونده، علامت بزن» (an ink outline) on a rung not passed,
 * «برداشتن علامت» (ghost) on one he marked by hand.
 *
 * A locked rung is dimmed, with the API's own reasons, each on its own line; they name the rung the dog must climb
 * first. A rung locked only because the dog isn't evaluated says just «بعد از ارزیابی» (the evaluation card says why).
 *
 * The button sits on the title's line, so a rung stays two lines tall on a phone too. When the state changes after a
 * mark, the new mark is pressed in (`dd-stamp`).
 */
export function LadderRung({
  rung,
  first,
  last,
  disabled,
  saving,
  onMark,
}: {
  rung: Rung;
  first: boolean;
  last: boolean;
  /** Another rung is saving: every button waits, so two writes can't cross. */
  disabled: boolean;
  /** This rung is the one saving. */
  saving: boolean;
  onMark: (args: { rung: Rung; passed: boolean }) => void;
}) {
  const { state } = rung;
  const passed = state === "passed-enrollment" || state === "passed-admin";
  const locked = state === "locked";
  const stamped = useHasChanged(passed);

  return (
    <li className="flex gap-3 sm:gap-4">
      {/*------ Rail and Mark ------*/}
      {/* The mark is centred on the title's line: 2rem down the row on phones (py-3 + half of the 40px title line that
          the button sets), 1.5rem from `sm` (py-3.5 + half a text line). The rail starts and ends there. */}
      <div aria-hidden className="relative flex w-7 shrink-0 justify-center pt-[1.125rem] sm:pt-2.5">
        {!(first && last) && (
          <span
            className={cn(
              "absolute inset-x-0 mx-auto w-px bg-foreground/15",
              first ? "top-8 bottom-0 sm:top-6" : last ? "top-0 h-8 sm:h-6" : "inset-y-0",
            )}
          />
        )}
        <span
          key={String(passed)}
          className={cn(
            "relative grid size-7 place-items-center rounded-full border-2",
            MARKS[state],
            stamped && "dd-stamp",
          )}
        >
          {passed && <CheckIcon className="size-4" strokeWidth={3.2} />}
          {locked && <LockIcon className="size-3.5" strokeWidth={2} />}
        </span>
      </div>

      {/*------ The Rung ------*/}
      {/* A grid: the title and the button on the first line, the words under them. Phones let the words run under the
          button too; from `sm` the button sits at the end across both lines. */}
      <div
        className={cn(
          "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-3 sm:gap-x-4 sm:py-3.5",
          !first && "border-t",
          ADMIN_HAIRLINE,
        )}
      >
        <p
          className={cn(
            "flex min-h-10 items-center text-sm font-bold text-pretty sm:min-h-0",
            locked && "text-foreground/60",
          )}
        >
          {rung.title}
        </p>

        {state === "passed-admin" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-3 text-muted-foreground hover:text-foreground sm:row-span-2"
            disabled={disabled}
            onClick={() => onMark({ rung, passed: false })}
          >
            {saving && <Spinner aria-hidden />}
            برداشتن علامت
          </Button>
        )}
        {(state === "open" || locked) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(INK_OUTLINE, "px-3 sm:row-span-2 sm:px-3.5")}
            disabled={disabled}
            onClick={() => onMark({ rung, passed: true })}
          >
            {saving && <Spinner aria-hidden />}
            گذرونده، علامت بزن
          </Button>
        )}

        <div className="col-span-2 col-start-1 min-w-0 sm:col-span-1 sm:col-start-1">
          <RungWords rung={rung} />
        </div>
      </div>
    </li>
  );
}

/*===== Rung Words =====*/
/** The one line under a rung's title: how it was passed, that it is open, or why it is locked. */
function RungWords({ rung }: { rung: Rung }) {
  const line = "text-sm text-pretty text-muted-foreground";

  switch (rung.state) {
    case "passed-enrollment":
      return <p className={line}>با ثبت‌نام گذرونده</p>;
    case "passed-admin":
      return <p className={line}>با علامت دستی گذرونده</p>;
    case "open":
      return <p className="text-sm text-foreground/85">بازه؛ می‌تونه بخره</p>;
    case "locked":
      return rung.problems.length === 0 ? (
        <p className={line}>بعد از ارزیابی باز می‌شه</p>
      ) : (
        <>
          {rung.problems.map((problem) => (
            <p key={problem} className={line}>
              {problem}
            </p>
          ))}
        </>
      );
  }
}
