import { cn } from "cn";

import { CopyButton } from "~/routes/admin_partners/components/copy-button";
import { shebaGroups } from "~/routes/admin_partners/partner-views";

/*===== Sheba Inset =====*/
/**
 * The number he types into his bank app, with its copy button. It is the one place on the page with a different
 * texture: a sunken inset in the body face with tabular figures, so it reads as the thing to copy. Each group of four
 * is `whitespace-nowrap`, so the number wraps between groups and never inside one. Latin digits on purpose: bank apps
 * and the clipboard expect them. The copied text is the compact `IR…` form.
 *
 * Stacked on phones (the button full width under the number), side by side from `sm`.
 */
export function ShebaInset({
  sheba,
  name,
  insetClassName = "bg-muted/40",
}: {
  sheba: string;
  name: string;
  /** The inset's fill: it must read as sunken against whatever it sits on (a card, or the drawer's own surface). */
  insetClassName?: string;
}) {
  const compact = sheba.replace(/\s+/g, "");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className={cn("min-w-0 rounded-lg px-3 py-2", insetClassName)}>
        <span className="sr-only">شبای {name}: </span>
        <bdi dir="ltr" className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm font-bold tracking-wide tabular-nums">
          {shebaGroups(sheba).map((group, index) => (
            // The groups never reorder, so the index is a stable key.
            <span key={index} className="whitespace-nowrap">
              {group}
            </span>
          ))}
        </bdi>
      </p>
      <CopyButton text={compact} label="کپی شبا" className="max-sm:w-full sm:shrink-0" />
    </div>
  );
}
