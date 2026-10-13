import { cn } from "cn";
import { CheckIcon, LockIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import type { Rung } from "~/routes/admin_dog_detail/ladder";

/*===== Ladder Rung =====*/
/**
 * One course on the dog's road: a state icon at the start, the title, a line of words, and at most one button. The
 * words for a locked rung are the API's own reasons, each on its own line; they name the rung the dog must climb first.
 * Phones stack the button under the words (40px tall, full width) instead of squeezing it beside them.
 */
export function LadderRung({
  rung,
  disabled,
  saving,
  onMark,
}: {
  rung: Rung;
  /** Another rung is saving: every button waits, so two writes can't cross. */
  disabled: boolean;
  /** This rung is the one saving. */
  saving: boolean;
  onMark: (args: { rung: Rung; passed: boolean }) => void;
}) {
  const { state } = rung;
  const passed = state === "passed-enrollment" || state === "passed-admin";

  return (
    <li className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {/*------ State Icon ------*/}
        {/* One element for every state, so the disc fills with a colour transition when a mark lands. */}
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 motion-safe:transition-colors",
            passed && "border-primary bg-primary text-primary-foreground",
            state === "open" && "border-primary text-primary",
            state === "locked" && "border-border text-muted-foreground",
          )}
        >
          {passed && <CheckIcon className="size-4" strokeWidth={3} />}
          {state === "locked" && <LockIcon className="size-3.5" />}
        </span>

        {/*------ Words ------*/}
        <div className="min-w-0">
          <p className="text-sm font-bold text-pretty">{rung.title}</p>
          {state === "passed-enrollment" && (
            <p className="mt-0.5 text-sm text-muted-foreground">گذرانده · با ثبت‌نام</p>
          )}
          {state === "passed-admin" && <p className="mt-0.5 text-sm text-muted-foreground">گذرانده · ثبت دستی</p>}
          {state === "open" && <p className="mt-0.5 text-sm text-primary">می‌تواند بخرد</p>}
          {state === "locked" && rung.problems.length === 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">بعد از ارزیابی باز می‌شود</p>
          )}
          {state === "locked" &&
            rung.problems.map((problem) => (
              <p key={problem} className="mt-0.5 text-sm text-pretty text-muted-foreground">
                {problem}
              </p>
            ))}
        </div>
      </div>

      {/*------ Button ------*/}
      {state === "passed-admin" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="max-sm:w-full"
          disabled={disabled}
          onClick={() => onMark({ rung, passed: false })}
        >
          {saving && <Spinner aria-hidden />}
          برداشتن علامت
        </Button>
      )}
      {(state === "open" || state === "locked") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="max-sm:w-full"
          disabled={disabled}
          onClick={() => onMark({ rung, passed: true })}
        >
          {saving && <Spinner aria-hidden />}
          گذرانده علامت بزن
        </Button>
      )}
    </li>
  );
}
