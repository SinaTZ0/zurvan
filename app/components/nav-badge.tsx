import { formatNumberFa } from "~/lib/digits";

/*===== Nav Badge =====*/
/**
 * A small count beside a section's label (the cart's items). `label` is what a screen reader adds after the number. Nothing renders for 0: an
 * empty badge would read as something to do.
 */
export function NavBadge({ count, label = "در انتظار" }: { count?: number; label?: string }) {
  if (!count) return null;
  return (
    <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums">
      <span className="sr-only">، </span>
      {formatNumberFa(count)}
      <span className="sr-only"> {label}</span>
    </span>
  );
}
