import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { PlanNotches } from "~/components/plan-slip";
import { formatToman } from "~/lib/course-format";
import { describePlanDaysLeft, planDaysLeft } from "~/lib/behavior-format";
import { formatNumberFa } from "~/lib/digits";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";
import type { TrainerBehaviorRequestSummary } from "~/orpc/behavior-request/contract";
import { RequestMark } from "~/routes/trainer_behavior_requests/components/request-mark";

const COLUMNS = "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_1.5rem]";

/*===== Plan Ledger =====*/
/**
 * The plans Arman has sent and the customer hasn't paid yet, soonest deadline first: the dog, the problem, the plan's
 * sessions and price, and the days left as small notches. Each row opens the request.
 *
 * @param now From the loader, so the days left match what the server will accept.
 */
export function PlanLedger({ requests, now }: { requests: readonly TrainerBehaviorRequestSummary[]; now: Date }) {
  return (
    <section aria-labelledby="plans-title">
      <h2 id="plans-title" className="mb-3 text-lg font-extrabold">
        برنامه‌های فرستاده‌شده
      </h2>

      {/*------ Column Heads ------*/}
      <div aria-hidden className={`hidden gap-x-5 border-b px-3 pb-2 text-sm text-muted-foreground lg:grid ${COLUMNS}`}>
        <span>سگ</span>
        <span>مشکل</span>
        <span>برنامه</span>
        <span>فرصت پرداخت</span>
      </div>

      <ul className="divide-y border-b lg:border-b-0">
        {requests.map((request) => {
          const plan = request.plan;
          const daysLeft = plan ? planDaysLeft({ expiresAt: plan.expiresAt, now }) : 0;
          return (
            <li key={request.id}>
              <Link
                to={`/trainer/behavior-requests/${request.id}`}
                className={`flex min-h-11 flex-wrap items-center gap-x-5 gap-y-3 px-1 py-3 transition-colors outline-none hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3 lg:grid ${COLUMNS}`}
              >
                {/*------ Dog ------*/}
                <span className="flex w-full min-w-0 items-center gap-3 lg:w-auto lg:flex-none">
                  <RequestMark name={request.dog.name} photo={request.dog.photo} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{request.dog.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{request.customer.name}</span>
                  </span>
                </span>

                {/*------ Problem ------*/}
                <span className="text-sm text-pretty max-lg:text-muted-foreground">
                  {BEHAVIOR_PROBLEM_CATEGORY_LABELS[request.problemCategory]}
                </span>

                {/*------ Sessions and Price ------*/}
                {plan && (
                  <span className="text-sm font-bold tabular-nums">
                    {formatNumberFa(plan.sessions)} جلسه · {formatToman(plan.price)}
                  </span>
                )}

                {/*------ Days Left ------*/}
                {plan && (
                  <span className="flex items-center gap-3 text-sm">
                    <PlanNotches daysLeft={daysLeft} small />
                    <span className="font-bold text-primary">{describePlanDaysLeft(daysLeft)}</span>
                  </span>
                )}

                <ChevronLeftIcon aria-hidden className="hidden size-5 text-muted-foreground lg:block" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
