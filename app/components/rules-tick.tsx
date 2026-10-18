import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

/*===== Rules Tick =====*/
/**
 * «قوانین سایت را خواندم و می‌پذیرم»: the tick that goes with publishing the site rules (F13). It exists only while rules
 * are published (`SITE_RULES`), so callers render it only then. The link opens the rules in a new tab, so reading them
 * doesn't lose the form.
 */
export function RulesTick({
  id,
  checked,
  onCheckedChange,
  invalid = false,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  invalid?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        aria-invalid={invalid}
        onCheckedChange={(next) => onCheckedChange(next)}
        className="mt-1"
      />
      <Label htmlFor={id} className="text-sm leading-relaxed font-medium text-pretty">
        <span>
          <a
            href="/rules"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            قوانین سایت
          </a>{" "}
          را خواندم و می‌پذیرم.
        </span>
      </Label>
    </div>
  );
}
