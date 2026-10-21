import { cn } from "cn";

import { CopyButton } from "~/routes/admin_partners/components/copy-button";
import { shebaGroups } from "~/routes/admin_partners/partner-views";

/*===== Sheba Inset =====*/
/**
 * The number he types into his bank app, with «کپی شبا» under it. It is the one place on the slip with a different
 * texture: an inset pressed into the paper, the number in large tabular figures laid out in groups of four on a
 * four-column grid (as a bank card prints it), so it reads off and checks group by group. Latin digits on purpose: bank
 * apps and the clipboard expect them. The copied text is the compact `IR…` form.
 *
 * A Sheba is `IR` and 24 digits, so it always makes two rows (4 + 3 groups) and the inset never changes height.
 */
export function ShebaInset({ sheba, name, className }: { sheba: string; name: string; className?: string }) {
  const compact = sheba.replace(/\s+/g, "");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="rounded-xl bg-background/70 px-3.5 py-2.5 shadow-[inset_0_1px_3px_rgb(0_0_0/0.6)] ring-1 ring-foreground/10">
        <span className="sr-only">شبای {name}: </span>
        <bdi
          dir="ltr"
          className="grid grid-cols-[repeat(4,max-content)] gap-x-3 gap-y-0.5 text-[1.0625rem] leading-7 font-bold tracking-wide tabular-nums"
        >
          {shebaGroups(sheba).map((group, index) => (
            // The groups never reorder, so the index is a stable key.
            <span key={index} className="whitespace-nowrap">
              {group}
            </span>
          ))}
        </bdi>
      </p>
      <CopyButton text={compact} label="کپی شبا" className="h-11 w-full md:h-10" />
    </div>
  );
}
