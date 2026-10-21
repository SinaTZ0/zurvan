import { PhoneIcon } from "lucide-react";
import { cn } from "cn";

import { toPersianDigits } from "~/lib/digits";

/*===== Customer Contact =====*/
/**
 * The customer to call, for every Admin list: their name and their number as a `tel:` link. The Admin phones people
 * all day (app-spec F3, F5, F6), so the number is always one tap away and never a plain string.
 *
 * - `inline`: name over a small number link, for a row.
 * - `call`: the number is a gold-outlined pill in bigger tabular digits, for the head of a block or a drawer. Dialling
 *   is his main job there, so it is the one gold outline in the block.
 *
 * The name is always the first child, so a row that shows the name elsewhere can hide it
 * (`[&>span:first-child]:hidden`).
 */
export function CustomerContact({
  name,
  phoneNumber,
  variant = "inline",
  className,
  callClassName,
}: {
  name: string;
  /** Stored as `09xxxxxxxxx`; null for an account with no number. */
  phoneNumber: string | null;
  variant?: "inline" | "call";
  className?: string;
  /** Extra classes for the `call` pill itself, e.g. `h-12 w-full justify-center` for a phone's full-width button. */
  callClassName?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", variant === "call" && "gap-2", className)}>
      <span className="truncate text-sm font-bold">{name}</span>
      {phoneNumber === null ? (
        <span className="text-xs text-muted-foreground">بدون شماره</span>
      ) : variant === "call" ? (
        <a
          href={`tel:${phoneNumber}`}
          aria-label={`زنگ به ${name}، ${toPersianDigits(phoneNumber)}`}
          className={cn(
            "inline-flex h-11 w-fit items-center gap-2.5 rounded-full border border-primary/70 ps-3.5 pe-4 text-foreground transition-colors outline-none hover:border-primary hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50",
            callClassName,
          )}
        >
          <PhoneIcon aria-hidden strokeWidth={1.8} className="size-4 shrink-0 text-primary" />
          <bdi dir="ltr" className="text-base font-bold tracking-wide tabular-nums">
            {toPersianDigits(phoneNumber)}
          </bdi>
        </a>
      ) : (
        <a
          href={`tel:${phoneNumber}`}
          aria-label={`زنگ به ${name}، ${toPersianDigits(phoneNumber)}`}
          className="inline-flex min-h-6 w-fit items-center gap-1.5 rounded-sm text-xs text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PhoneIcon aria-hidden strokeWidth={1.7} className="size-3.5" />
          <bdi dir="ltr" className="tabular-nums">
            {toPersianDigits(phoneNumber)}
          </bdi>
        </a>
      )}
    </div>
  );
}
