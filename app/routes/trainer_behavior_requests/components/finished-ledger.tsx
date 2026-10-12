import { ChevronLeftIcon } from "lucide-react";

import { BehaviorStatusBadge } from "~/components/behavior-status-badge";
import { Link } from "~/components/link";
import { formatJalaliDate } from "~/lib/jalali";
import { utcToTehranParts } from "~/lib/tehran-time";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";
import type { TrainerBehaviorRequestSummary } from "~/orpc/behavior-request/contract";
import { RequestMark } from "~/routes/trainer_behavior_requests/components/request-mark";

const COLUMNS = "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1fr)_7rem_8rem_1.5rem]";

/*===== Finished Ledger =====*/
/**
 * Paid, declined, withdrawn and expired requests, newest first: the dog, the problem, the customer, the day it was sent
 * and how it ended. The date is when the request was sent, the one date every row has.
 */
export function FinishedLedger({ requests }: { requests: readonly TrainerBehaviorRequestSummary[] }) {
  return (
    <section aria-labelledby="finished-title">
      <h2 id="finished-title" className="mb-3 text-lg font-extrabold">
        تمام‌شده
      </h2>

      {/*------ Column Heads ------*/}
      <div aria-hidden className={`hidden gap-x-5 border-b px-3 pb-2 text-sm text-muted-foreground lg:grid ${COLUMNS}`}>
        <span>سگ</span>
        <span>مشکل</span>
        <span>صاحب</span>
        <span>ارسال</span>
        <span>وضعیت</span>
      </div>

      <ul className="divide-y border-y">
        {requests.map((request) => (
          <li key={request.id}>
            <Link
              to={`/trainer/behavior-requests/${request.id}`}
              className={`flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 px-1 py-3 transition-colors outline-none hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3 lg:grid lg:gap-x-5 ${COLUMNS}`}
            >
              <span className="flex w-full min-w-0 items-center gap-3 lg:w-auto lg:flex-none">
                <RequestMark name={request.dog.name} photo={request.dog.photo} />
                <span className="truncate font-bold">{request.dog.name}</span>
              </span>
              <span className="min-w-0 truncate text-sm">
                {BEHAVIOR_PROBLEM_CATEGORY_LABELS[request.problemCategory]}
              </span>
              <span className="min-w-0 truncate text-sm text-muted-foreground">{request.customer.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatJalaliDate(utcToTehranParts(request.createdAt).date)}
              </span>
              <BehaviorStatusBadge status={request.status} className="justify-self-start" />
              <ChevronLeftIcon aria-hidden className="hidden size-5 text-muted-foreground lg:block" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
