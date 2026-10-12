import { cn } from "cn";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";

import { BehaviorStatusBadge } from "~/components/behavior-status-badge";
import { Link } from "~/components/link";
import { PlanSlip } from "~/components/plan-slip";
import { FormAlert } from "~/components/form-alert";
import { Stamp } from "~/components/stamp";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { describeApiFailure } from "~/lib/api-error";
import { formatPlanDeadline } from "~/lib/behavior-format";
import { formatToman } from "~/lib/course-format";
import { formatSlotDay } from "~/lib/tehran-time";
import { BEHAVIOR_PROBLEM_CATEGORY_LABELS } from "~/orpc/behavior-request/constants";
import { client } from "~/orpc/client";
import { RequestDogMark } from "~/routes/account_behavior_requests/components/request-dog-mark";
import { RequestVideos } from "~/routes/account_behavior_requests/components/request-videos";
import { WithdrawRequest } from "~/routes/account_behavior_requests/components/withdraw-request";
import { type BehaviorRequestView, signerName } from "~/routes/account_behavior_requests/behavior-request-view";

/*===== Request Card =====*/
/**
 * One request still being worked on: the dog, the problem, what she wrote and the videos, then what comes next. A
 * submitted request waits for Arman; a proposed one shows his plan slip and the one money action.
 *
 * `stamped` marks the request just sent; its card carries the stamp.
 */
export function RequestCard({ request, stamped }: { request: BehaviorRequestView; stamped: boolean }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  // The pay button's refusal, shown in this card. Kept here so a failed payment doesn't clear the rest of the page.
  const [alert, setAlert] = useState<string | null>(null);
  const { plan, daysLeft } = request;
  // A plan can still be listed as proposed after its week is up; the server would refuse it, so show it as spent.
  const spent = request.status === "proposed" && !request.canPay;

  const checkout = useMutation({
    mutationFn: () => client.behaviorRequest.checkout({ id: request.id }),
    onSuccess: ({ orderId }) => navigate(`/account/checkout/${orderId}`),
    onError: async (error) => {
      setAlert(describeApiFailure({ error, fallback: "پرداخت شروع نشد. دوباره امتحان کن." }).message);
      // The plan may have run out while the page was open: reload so the card shows that instead.
      await revalidator.revalidate();
    },
  });

  return (
    <li className="relative">
      {stamped && <Stamp lines={["فرستاده", "شد"]} />}
      <article
        aria-labelledby={`request-${request.id}`}
        className="flex flex-col gap-5 rounded-xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6"
      >
        {/*------ Header ------*/}
        {/* The stamp lands on the card's end corner; room is left there so it never covers the problem badge. */}
        <header className={cn("flex flex-wrap items-start gap-4", stamped && "pe-20 sm:pe-24")}>
          <RequestDogMark dog={request.dog} />
          <div className="min-w-0 flex-1">
            <Link
              to={`/account/dogs/${request.dog.id}`}
              id={`request-${request.id}`}
              className="rounded-sm text-lg font-bold underline-offset-4 hover:underline"
            >
              {request.dog.name}
            </Link>
            <p className="text-sm text-muted-foreground">فرستاده‌شده {formatSlotDay(request.createdAt)}</p>
          </div>
          {/* The problem as a flat-gold badge: it's what the card is about. */}
          <span className="inline-flex h-7 items-center rounded-full bg-primary px-3 text-sm font-bold whitespace-nowrap text-primary-foreground">
            {BEHAVIOR_PROBLEM_CATEGORY_LABELS[request.problemCategory]}
          </span>
          {stamped && <p className="sr-only">تازه فرستاده شد</p>}
        </header>

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          {/*------ What the customer wrote, and the videos ------*/}
          <details className="group min-w-0">
            <summary className="w-fit cursor-pointer rounded-sm font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
              توضیح تو
            </summary>
            <div className="mt-3 flex flex-col gap-4">
              <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{request.description}</p>
              {request.videos.length > 0 && <RequestVideos videos={request.videos} dogName={request.dog.name} />}
              <p className="text-sm text-muted-foreground">فقط آرمان و مربی سگت ویدیوها را می‌بینند.</p>
            </div>
          </details>

          {/*------ Status ------*/}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <BehaviorStatusBadge status={request.status} />
            </div>

            {request.status === "submitted" && (
              <p className="text-pretty text-muted-foreground">
                آرمان هنوز ویدیوها را ندیده. معمولاً ظرف یکی دو روز جواب می‌دهد.
              </p>
            )}

            {request.status === "proposed" && plan && (
              <>
                <PlanSlip
                  plan={{ sessions: plan.sessions, price: plan.price, note: plan.note }}
                  daysLeft={spent ? 0 : daysLeft}
                  deadline={formatPlanDeadline(plan.expiresAt)}
                  signer={signerName(request.trainer)}
                  muted={spent}
                />
                {spent ? (
                  <p className="text-pretty text-muted-foreground">
                    فرصت تمام شد؛ اگر هنوز می‌خواهی، درخواست تازه بفرست.{" "}
                    <Link
                      to="/behavior-modification"
                      className="rounded-sm font-bold text-primary underline-offset-4 hover:underline"
                    >
                      درخواست تازه
                    </Link>
                  </p>
                ) : (
                  request.canPay && (
                    <Button
                      type="button"
                      size="lg"
                      className="w-full sm:w-auto"
                      disabled={checkout.isPending}
                      onClick={() => {
                        setAlert(null);
                        checkout.mutate();
                      }}
                    >
                      {checkout.isPending && <Spinner data-icon="inline-start" />}
                      پرداخت {formatToman(plan.price)}
                    </Button>
                  )
                )}
                <FormAlert message={alert ?? undefined} />
              </>
            )}

            {request.canWithdraw && (
              <div className="mt-auto flex sm:justify-end">
                <WithdrawRequest request={request} />
              </div>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
