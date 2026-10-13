import { PhoneIcon } from "lucide-react";
import { cn } from "cn";

import { buttonVariants } from "~/components/ui/button";
import { toPersianDigits } from "~/lib/digits";

/*===== Customer Contact =====*/
/**
 * The customer to call, for every Admin list: their name and their number as a `tel:` link. The Admin phones people
 * all day (app-spec F3, F5, F6), so the number is always one tap away and never a plain string.
 *
 * - `inline`: name over a small number link, for a row.
 * - `call`: the number is a full call button, for the head of a block or a drawer.
 */
export function CustomerContact({
  name,
  phoneNumber,
  variant = "inline",
  className,
}: {
  name: string;
  /** Stored as `09xxxxxxxxx`; null for an account with no number. */
  phoneNumber: string | null;
  variant?: "inline" | "call";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", variant === "call" && "gap-2", className)}>
      <span className="truncate text-sm font-bold">{name}</span>
      {phoneNumber === null ? (
        <span className="text-xs text-muted-foreground">بدون شماره</span>
      ) : variant === "call" ? (
        <a
          href={`tel:${phoneNumber}`}
          aria-label={`تماس با ${name}`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}
        >
          <PhoneIcon aria-hidden strokeWidth={1.7} />
          <bdi dir="ltr" className="tabular-nums">
            {toPersianDigits(phoneNumber)}
          </bdi>
        </a>
      ) : (
        <a
          href={`tel:${phoneNumber}`}
          aria-label={`تماس با ${name}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-sm text-xs text-muted-foreground transition-colors hover:text-primary"
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
