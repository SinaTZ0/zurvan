import { BehaviorStatusBadge } from "~/components/behavior-status-badge";
import { Link } from "~/components/link";
import { PlanSlip } from "~/components/plan-slip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { buttonVariants } from "~/components/ui/button";
import { formatPlanDeadline } from "~/lib/behavior-format";
import { formatSlotDay } from "~/lib/tehran-time";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";
import { RequestDogMark } from "~/routes/account_behavior_requests/components/request-dog-mark";
import { type BehaviorRequestView, signerName } from "~/routes/account_behavior_requests/behavior-request-view";

/*===== Request Ledger =====*/
/**
 * Everything that is over, newest first, as a ruled ledger: date, dog, problem and status on one line. Each row opens in
 * place to how it ended, so nothing needs its own page.
 */
export function RequestLedger({ requests }: { requests: BehaviorRequestView[] }) {
  return (
    <Accordion className="divide-y border-y">
      {requests.map((request) => (
        <LedgerRow key={request.id} request={request} />
      ))}
    </Accordion>
  );
}

/*===== Row Line =====*/
function RowLine({ request }: { request: BehaviorRequestView }) {
  return (
    <>
      <span className="w-28 shrink-0 text-sm font-bold text-muted-foreground max-sm:w-full sm:w-32">
        {formatSlotDay(request.createdAt)}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <RequestDogMark dog={request.dog} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{request.dog.name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {BEHAVIOR_PROBLEM_CATEGORY_LABELS[request.problemCategory]}
          </span>
        </span>
      </span>
      <BehaviorStatusBadge status={request.status} />
    </>
  );
}

/*===== Ledger Row =====*/
/** A row opens to what happened: the paid plan, the declined reason, the spent plan, or a withdrawal. */
function LedgerRow({ request }: { request: BehaviorRequestView }) {
  return (
    <AccordionItem value={request.id} className="border-b-0">
      <AccordionTrigger className="items-center gap-4 rounded-none px-1 py-3 text-base font-normal hover:bg-primary/5 hover:no-underline max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1 max-sm:pe-8 sm:px-3 [&_[data-slot=accordion-trigger-icon]]:max-sm:absolute [&_[data-slot=accordion-trigger-icon]]:max-sm:end-2 [&_[data-slot=accordion-trigger-icon]]:max-sm:top-5 [&_[data-slot=accordion-trigger-icon]]:sm:ms-2">
        <RowLine request={request} />
      </AccordionTrigger>
      <AccordionContent className="px-1 pb-5 sm:px-3 sm:ps-[9.75rem]">
        <RowDetail request={request} />
      </AccordionContent>
    </AccordionItem>
  );
}

/*===== Row Detail =====*/
function RowDetail({ request }: { request: BehaviorRequestView }) {
  const { plan } = request;

  if (request.status === "paid" && plan) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <PlanSlip
          compact
          strip={false}
          plan={{ sessions: plan.sessions, price: plan.price, note: plan.note }}
          daysLeft={null}
          signer={signerName(request.trainer)}
        />
        {request.enrollmentId && (
          <Link
            to={`/account/training/${request.enrollmentId}`}
            className="w-fit rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            برو به آموزش
          </Link>
        )}
      </div>
    );
  }

  if (request.status === "declined") {
    return (
      <div className="flex flex-col gap-4 pt-2">
        {request.declineReason && (
          <figure>
            <blockquote className="border-s-2 border-primary/50 ps-4 leading-relaxed text-pretty whitespace-pre-line">
              {request.declineReason}
            </blockquote>
            <figcaption className="mt-2 ps-4 text-sm text-muted-foreground">— {signerName(request.trainer)}</figcaption>
          </figure>
        )}
        <NewRequestLink />
      </div>
    );
  }

  if (request.status === "expired" && plan) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <PlanSlip
          compact
          muted
          plan={{ sessions: plan.sessions, price: plan.price, note: plan.note }}
          daysLeft={0}
          deadline={formatPlanDeadline(plan.expiresAt)}
          signer={signerName(request.trainer)}
        />
        <div>
          <NewRequestLink />
        </div>
      </div>
    );
  }

  if (request.status === "withdrawn") {
    return <p className="pt-2 text-muted-foreground">این درخواست را پس گرفتی.</p>;
  }

  return null;
}

/*===== New Request Link =====*/
function NewRequestLink() {
  return (
    <Link
      to="/behavior-modification"
      className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit text-primary hover:text-primary" })}
    >
      درخواست تازه
    </Link>
  );
}
