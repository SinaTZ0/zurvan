import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";
import type { TrainerBehaviorRequestSummary } from "~/orpc/behavior-request/contract";
import { describeAge } from "~/routes/trainer_behavior_requests/relative-age";
import { RequestMark } from "~/routes/trainer_behavior_requests/components/request-mark";

/*===== Waiting List =====*/
/**
 * Submitted and not answered: Arman's to-do. Oldest first, so the longest wait is at the top. Each card is one link to
 * the request; the whole card is the 44 px target on phones.
 *
 * @param now From the loader, so the age reads the same on the server and in the browser.
 */
export function WaitingList({ requests, now }: { requests: readonly TrainerBehaviorRequestSummary[]; now: Date }) {
  return (
    <section aria-labelledby="waiting-title">
      <h2 id="waiting-title" className="mb-3 text-lg font-extrabold">
        منتظر جواب ({formatNumberFa(requests.length)})
      </h2>
      <ul className="flex flex-col gap-3">
        {requests.map((request) => {
          const videos = request.videos.length;
          return (
            <li key={request.id}>
              <Link
                to={`/trainer/behavior-requests/${request.id}`}
                className="group flex min-h-11 flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-s-4 border-s-primary bg-card px-4 py-4 shadow-xs transition-colors outline-none hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 lg:px-5"
              >
                {/*------ Dog and Problem ------*/}
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <RequestMark name={request.dog.name} photo={request.dog.photo} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{request.dog.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {BEHAVIOR_PROBLEM_CATEGORY_LABELS[request.problemCategory]}
                    </span>
                  </span>
                </span>

                {/*------ Customer, Age and Videos ------*/}
                <span className="flex min-w-0 flex-col gap-0.5 text-sm max-sm:w-full">
                  <span className="font-bold">{request.customer.name}</span>
                  <span className="text-muted-foreground">
                    {describeAge({ sentAt: request.createdAt, now })}
                    {" · "}
                    {videos === 0 ? "بدون ویدیو" : `${formatNumberFa(videos)} ویدیو`}
                  </span>
                </span>

                <span
                  aria-hidden
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "min-h-11 shrink-0 max-sm:w-full sm:min-h-9",
                  })}
                >
                  ببین و جواب بده
                  <ChevronLeftIcon className="size-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
