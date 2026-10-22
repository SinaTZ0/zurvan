import { cn } from "cn";
import { GiftIcon } from "lucide-react";

import { DISPLAY_HEADING } from "~/lib/display-heading";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { m } from "~/paraglide/messages";
import { HeaderRoad, type RoadStep } from "~/routes/assessment/components/header-road";

/*===== Page Header =====*/
/**
 * The top of the start column: a gold chip saying it is free, the h1, one line, and the road of four stops that says
 * where the customer is. After sending, the heading turns into «درخواستت رسید» (keyed, so it rises in) and the road's
 * gold walks on to the call.
 */
export function PageHeader({ step, walkedFrom, sent }: { step: RoadStep; walkedFrom: RoadStep | null; sent: boolean }) {
  const trainer = HEAD_TRAINER.firstName;

  return (
    <header className="pb-8 lg:pb-12">
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/45 px-3.5 py-1 text-sm font-bold text-primary">
        <GiftIcon aria-hidden strokeWidth={2} className="size-4" />
        {m.assessment_header_free_chip()}
      </p>

      <div key={sent ? "sent" : "ask"} className={cn(sent && "answer-in")}>
        <h1 className={cn(DISPLAY_HEADING, "mt-4 text-h1 text-balance")}>
          {sent ? m.assessment_header_title_sent() : m.assessment_header_title()}
        </h1>
        <p className="mt-3 max-w-xl text-lead text-pretty text-muted-foreground">
          {sent
            ? m.assessment_header_lead_sent({ trainer })
            : m.assessment_header_lead({ trainer })}
        </p>
      </div>

      <div className="mt-7">
        <HeaderRoad step={step} walkedFrom={walkedFrom} />
      </div>
    </header>
  );
}
