import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { LEAD_STAGE_FILTERS, type LeadStageFilter } from "~/routes/account_partner_leads/search-params";
import { STAGE_FILTER_LABELS } from "~/routes/account_partner_leads/stages";

/*===== Stage Pills =====*/
/**
 * The list's stage filter: one pill per stage with its count, the chosen one in flat gold. Toggle buttons
 * (`aria-pressed`) in a fieldset named «مرحله», as the Admin's pills are; a pill with nobody keeps its zero on screen.
 * The gold crossfades from the old pill to the new one, and the new pill's count pops.
 *
 * Phones: one row that scrolls sideways and snaps to each pill, run out to the plate's edges so it doesn't look cut
 * short. From `sm` the row wraps instead.
 */
export function StagePills({
  counts,
  value,
  onChange,
}: {
  counts: Record<LeadStageFilter, number>;
  value: LeadStageFilter;
  onChange: (value: LeadStageFilter) => void;
}) {
  return (
    <fieldset className="-mx-5 flex min-w-0 snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-2 overflow-x-auto border-0 px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <legend className="sr-only">مرحله</legend>
      {LEAD_STAGE_FILTERS.map((stage) => {
        const selected = stage === value;
        return (
          <button
            key={stage}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(stage)}
            className={cn(
              "inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              "transition-[background-color,border-color,color] duration-300 ease-out motion-reduce:transition-none",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-foreground/15 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {STAGE_FILTER_LABELS[stage]}
            <span
              // Re-keyed when picked, so the count pops with the gold.
              key={selected ? "on" : "off"}
              className={cn(
                "text-xs tabular-nums",
                selected ? "answer-pop text-primary-foreground/80" : "text-foreground/60",
              )}
            >
              {formatNumberFa(counts[stage])}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
