import { cn } from "cn";
import { CheckIcon } from "lucide-react";

/*===== Pick Chip =====*/
/**
 * One toggle of a «pick any» list (a weekday, a time of day) as a pill on the plate, in the Dog Form's pill look: a
 * native checkbox underneath, so Space, the form and screen readers work as usual. Picked is told by the gold border,
 * the tint and the tick, which pops in (not by colour alone). `inputRef` lets the form focus the group's first chip
 * when the group has an error.
 */
export function PickChip({
  label,
  checked,
  onChange,
  name,
  invalid,
  inputRef,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  invalid: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="relative">
      <input
        ref={inputRef}
        type="checkbox"
        name={name}
        checked={checked}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex h-11 cursor-pointer items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-bold text-muted-foreground select-none",
          invalid ? "border-destructive/60" : "border-foreground/20",
          "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/50 hover:text-foreground",
          "transition-colors motion-safe:transition-[translate,border-color,background-color,color] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
        )}
      >
        {/* The tick pops in from its centre when picked (the shared `answer-pop`, on mount). */}
        {checked && (
          <CheckIcon aria-hidden className="answer-pop size-4 text-primary [--pop-origin:50%_50%]" strokeWidth={3} />
        )}
        {label}
      </span>
    </label>
  );
}
