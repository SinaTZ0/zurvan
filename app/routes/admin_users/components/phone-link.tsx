import { cn } from "cn";
import { PhoneIcon } from "lucide-react";

import { toPersianDigits } from "~/lib/digits";

/*===== Phone Link =====*/
/**
 * A person's number as a compact `tel:` link for a roll row: muted ink, the digits in Persian and left to right. Its
 * hover is ivory, never gold (this page has no gold but the selected pills). The caller sets the tap area.
 */
export function PhoneLink({
  phoneNumber,
  label,
  className,
}: {
  phoneNumber: string | null;
  /** Who is called, for the link's accessible name. */
  label: string;
  className?: string;
}) {
  if (phoneNumber === null) return <span className="text-xs text-muted-foreground">بدون شماره</span>;

  return (
    <a
      href={`tel:${phoneNumber}`}
      aria-label={`زنگ به ${label}، ${toPersianDigits(phoneNumber)}`}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-sm text-xs text-muted-foreground underline-offset-4 transition-colors outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <PhoneIcon aria-hidden strokeWidth={1.7} className="size-3.5 shrink-0" />
      <bdi dir="ltr" className="tabular-nums">
        {toPersianDigits(phoneNumber)}
      </bdi>
    </a>
  );
}
