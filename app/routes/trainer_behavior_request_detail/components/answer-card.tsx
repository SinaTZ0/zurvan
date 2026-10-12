import { useState } from "react";

import { PlanSlip } from "~/components/plan-slip";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { planDaysLeft, formatPlanDeadline } from "~/lib/behavior-format";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { TrainerBehaviorRequest } from "~/orpc/behavior-request/contract";
import { DeclineForm } from "~/routes/trainer_behavior_request_detail/components/decline-form";
import { PlanForm } from "~/routes/trainer_behavior_request_detail/components/plan-form";

/*===== Answer Card =====*/
// What the card shows for each mode. `slip` is a proposed plan at rest; `plan` and `decline` are the two forms.
type AnswerMode = "slip" | "plan" | "decline";

/**
 * The end column: the trainer's answer. While it's his turn, two tabs («برنامه بده», «رد کن») on a submitted request, or
 * the sent plan with «ویرایش برنامه» and «رد کردن» on a proposed one. Once the request is settled, only what happened is
 * shown. The page keys this card by status, so a change of status (after an answer or a reload) starts it fresh.
 *
 * @param now The moment the page was rendered; the days left and the deadline are counted from it.
 */
export function AnswerCard({ behaviorRequest, now }: { behaviorRequest: TrainerBehaviorRequest; now: Date }) {
  const { status, canAnswer } = behaviorRequest;
  const [mode, setMode] = useState<AnswerMode>(status === "proposed" ? "slip" : "plan");
  const backToSlip = () => setMode("slip");

  return (
    <section
      id="answer"
      aria-labelledby="answer-title"
      className="scroll-mt-8 rounded-2xl border bg-card p-5 shadow-sm lg:p-7"
    >
      <h2 id="answer-title" className="mb-6 text-xl font-extrabold">
        جواب تو
      </h2>

      {!canAnswer ? (
        <Settled behaviorRequest={behaviorRequest} />
      ) : status === "submitted" ? (
        <Tabs value={mode === "decline" ? "decline" : "plan"} onValueChange={(value) => setMode(value as AnswerMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan">برنامه بده</TabsTrigger>
            <TabsTrigger value="decline">رد کن</TabsTrigger>
          </TabsList>
          <TabsContent value="plan" className="pt-6">
            <PlanForm requestId={behaviorRequest.id} now={now} plan={null} onSent={backToSlip} />
          </TabsContent>
          <TabsContent value="decline" className="pt-6">
            <DeclineForm requestId={behaviorRequest.id} />
          </TabsContent>
        </Tabs>
      ) : mode === "plan" ? (
        <PlanForm
          requestId={behaviorRequest.id}
          now={now}
          plan={behaviorRequest.plan}
          onSent={backToSlip}
          onCancel={backToSlip}
        />
      ) : mode === "decline" ? (
        <DeclineForm requestId={behaviorRequest.id} onCancel={backToSlip} />
      ) : (
        <ProposedPlan
          behaviorRequest={behaviorRequest}
          now={now}
          onEdit={() => setMode("plan")}
          onDecline={() => setMode("decline")}
        />
      )}
    </section>
  );
}

/*===== Proposed =====*/
/** The sent plan on its slip, with the two things the trainer can still do to it. */
function ProposedPlan({
  behaviorRequest,
  now,
  onEdit,
  onDecline,
}: {
  behaviorRequest: TrainerBehaviorRequest;
  now: Date;
  onEdit: () => void;
  onDecline: () => void;
}) {
  const { plan } = behaviorRequest;
  if (!plan) return null;

  return (
    <div className="flex flex-col gap-6">
      <PlanSlip
        plan={{ sessions: plan.sessions, price: plan.price, note: plan.note }}
        daysLeft={planDaysLeft({ expiresAt: plan.expiresAt, now })}
        deadline={formatPlanDeadline(plan.expiresAt)}
        signer={HEAD_TRAINER.firstName}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onEdit}>
          ویرایش برنامه
        </Button>
        <Button type="button" variant="ghost" className="text-destructive" onClick={onDecline}>
          رد کردن
        </Button>
      </div>
    </div>
  );
}

/*===== Settled =====*/
// Nothing is left to do: the paid plan points at its enrollment, the rest say what happened and why.
function Settled({ behaviorRequest }: { behaviorRequest: TrainerBehaviorRequest }) {
  const { status, plan, declineReason, enrollmentId } = behaviorRequest;

  if (status === "paid" && plan) {
    return (
      <div className="flex flex-col gap-6">
        <PlanSlip
          plan={{ sessions: plan.sessions, price: plan.price, note: plan.note }}
          daysLeft={null}
          signer={HEAD_TRAINER.firstName}
          strip={false}
        />
        <p className="font-extrabold text-success">پرداخت شد</p>
        {enrollmentId && (
          <Link
            to={`/trainer/enrollments/${enrollmentId}`}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            زمان‌بندی جلسه‌ها
          </Link>
        )}
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-extrabold">این درخواست را رد کردی.</p>
        {declineReason && (
          <p className="border-s-2 border-primary/40 ps-4 text-pretty whitespace-pre-line">{declineReason}</p>
        )}
      </div>
    );
  }

  if (status === "expired" && plan) {
    return (
      <p className="font-extrabold text-muted-foreground">
        مهلت پرداخت این برنامه {formatPlanDeadline(plan.expiresAt)} تمام شد.
      </p>
    );
  }

  if (status === "withdrawn") {
    return <p className="font-extrabold text-muted-foreground">صاحب سگ این درخواست را پس گرفت. جوابی لازم نیست.</p>;
  }

  return <p className="text-muted-foreground">جوابی لازم نیست.</p>;
}
