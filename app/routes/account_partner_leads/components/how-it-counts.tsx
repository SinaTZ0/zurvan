import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";

import { m } from "~/paraglide/messages";

/*===== Rules =====*/
// What a partner asks about: who wins a shared number, who wins a link, what he sees of a customer, and where his
// commission shows (F7, F12). Read while rendering, so they follow the page's language.
function rules(): string[] {
  return [
    m.account_partner_leads_how_rule_shared(),
    m.account_partner_leads_how_rule_link(),
    m.account_partner_leads_how_rule_name(),
    m.account_partner_leads_how_rule_commission(),
  ];
}

/*===== How It Counts =====*/
/**
 * The folded note under the form, «چطور حساب می‌شه؟», closed by default. It opens as one motion: the panel stays mounted
 * and its grid row grows from 0fr to 1fr while the lines lift and fade in, and the chevron turns. Closed, the panel is
 * `inert` and hidden once the fold has run, so nothing in it is reachable or read out.
 */
export function HowItCounts() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-3xl border border-dashed border-foreground/20">
      {/*------ Trigger ------*/}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-3xl px-5 text-start text-sm font-bold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:text-foreground"
      >
        {m.account_partner_leads_how_trigger()}
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 transition-transform duration-300 group-aria-expanded:rotate-180 motion-reduce:transition-none"
        />
      </button>

      {/*------ Panel ------*/}
      <div id={panelId} className="pl-fold" data-open={open} inert={!open}>
        <div className="min-h-0 overflow-hidden">
          <ul className="flex flex-col gap-3 px-5 pt-1 pb-5 text-sm text-pretty text-muted-foreground">
            {rules().map((rule, index) => (
              <li
                key={rule}
                className="pl-fold-line flex items-start gap-2.5"
                style={{ "--line-delay": `${index * 50}ms` } as React.CSSProperties}
              >
                <ChalkTick />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/*===== Chalk Tick =====*/
/** A small hand-drawn gold tick before each rule. */
function ChalkTick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      className="mt-0.5 size-4 shrink-0 text-primary"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 10.5c1.4 1.1 2.6 2.4 3.6 4 1.9-4.2 4.6-7.6 9.1-10.6" />
    </svg>
  );
}
