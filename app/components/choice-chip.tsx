import { CheckIcon } from "lucide-react";

/*===== Choice Chip =====*/
/**
 * One toggle of a «pick any» list (a weekday, a time of day) as a pill. A native checkbox underneath, so Space, the
 * form and screen readers work as usual; selected is told by the gold border and the tick, not by colour alone.
 */
export function ChoiceChip({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
}) {
  return (
    <label className="relative">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-input/60 bg-sunken px-4 text-sm font-bold text-muted-foreground transition-colors select-none peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/50 hover:text-foreground motion-safe:transition-[transform,border-color,background-color,color] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0">
        {checked && <CheckIcon aria-hidden className="size-4 text-primary" strokeWidth={3} />}
        {label}
      </span>
    </label>
  );
}
