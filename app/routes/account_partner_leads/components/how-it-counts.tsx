import { ChevronDownIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

/*===== Constants =====*/
// Three rules a partner asks about: who wins a shared number, who wins a link, and what he sees of a customer (F7, F12).
const RULES = [
  "اگر چند همکار یک شماره را بنویسند، اولین ثبت می‌ماند.",
  "اگر مشتری با لینک یک همکار بیاید، لینک مقدم است.",
  "بعد از ثبت‌نام، اسم مشتری را می‌بینی؛ قیمت و سگش را نه.",
  "برای هر خریدار، پورسانتت و این‌که واریز شده یا نه را همین‌جا می‌بینی.",
];

/*===== How It Counts =====*/
/** The closed-by-default note under the form: «چطور حساب می‌شود؟». It opens to the three rules above. */
export function HowItCounts() {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group/trigger flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        چطور حساب می‌شود؟
        <ChevronDownIcon
          aria-hidden
          className="size-4 transition-transform motion-safe:group-data-[panel-open]/trigger:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex list-disc flex-col gap-2 ps-5 pb-2 text-sm text-pretty text-muted-foreground marker:text-muted-foreground/60">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
