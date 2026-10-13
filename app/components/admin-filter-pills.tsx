import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";

/*===== Types =====*/
export type AdminFilterOption<Value extends string> = {
  value: Value;
  label: string;
  /** Shown beside the label. Left out when the page can't count it. */
  count?: number;
};

/*===== Admin Filter Pills =====*/
/**
 * The status filter of an Admin list: one row of pills with a count each, the chosen one in flat gold. It holds no
 * state and doesn't call nuqs: the page passes the value and a callback, so the pills stay reusable. On phones the row
 * scrolls sideways instead of wrapping into a second line.
 */
export function AdminFilterPills<Value extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  /** The group's name for screen readers, e.g. «وضعیت». */
  label: string;
  options: readonly AdminFilterOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "-mx-4 flex min-w-0 gap-2 overflow-x-auto border-0 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0",
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn("text-xs tabular-nums", selected ? "text-primary-foreground/80" : "text-foreground/60")}
              >
                {formatNumberFa(option.count)}
              </span>
            )}
          </button>
        );
      })}
    </fieldset>
  );
}
