import { InPersianNote } from "~/components/in-persian-note";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { m } from "~/paraglide/messages";

// The sentence is one message with the link in a `{rules}` slot, since the link sits at its start in Persian and in its
// middle in English. A character no translation contains marks the slot, and the sentence is split around it.
const LINK_SLOT = "\u0000";

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
  const [before = "", after = ""] = m.shared_rules_tick({ rules: LINK_SLOT }).split(LINK_SLOT);

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
          {before}
          {/* The rules are Persian only (`isPersianOnlyPath`), so the English link says so. */}
          <a
            href="/rules"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {m.shared_rules_tick_link()}
            <InPersianNote />
          </a>
          {after}
        </span>
      </Label>
    </div>
  );
}
