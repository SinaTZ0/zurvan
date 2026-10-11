import { useMutation } from "@tanstack/react-query";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { calculateEnrollmentRefund } from "~/lib/business-rules";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { MAX_PLANNED_SESSIONS } from "~/orpc/enrollment/constants";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { client } from "~/orpc/client";

/*===== Refund Preview =====*/
/**
 * What the owner would get back if they cancelled now with `plannedSessions` planned, from the same function the
 * cancelling uses. It is the customer's rule (the policy's share), because the trainer asking "what does this plan
 * cost the owner?" is asking about the owner's choice; cancelling it himself gives the whole share.
 */
function refundIfOwnerCancels({
  enrollment,
  plannedSessions,
  now,
}: {
  enrollment: TrainerEnrollment;
  plannedSessions: number;
  now: Date;
}) {
  const { refundBasis } = enrollment;
  const nextScheduled = enrollment.sessions.find((session) => session.status === "scheduled");

  return calculateEnrollmentRefund({
    kind: enrollment.kind,
    // What is still in the order item: an enrollment refunded before has less left to give back.
    paidAmount: refundBasis.paidAmount - refundBasis.refundedAmount,
    plannedSessions,
    usedSessions: enrollment.usedSessions,
    policyPercent: refundBasis.policyPercent,
    cancelledBy: "customer",
    nextSessionStartsAt: nextScheduled?.startsAt ?? null,
    now,
  }).amount;
}

/*===== Planned Sessions =====*/
/**
 * «تعداد جلسه‌ها» with − and +: the plan the refund is counted against. Changes are held as a draft, with the refund
 * effect written live under the stepper, and saved with «ذخیره». A test is always one session, so it has no stepper.
 *
 * @param now Passed from the loader so the server and the browser render the same line.
 */
export function PlannedSessions({ enrollment, now }: { enrollment: TrainerEnrollment; now: Date }) {
  const { plannedSessions, usedSessions, canSchedule, kind } = enrollment;
  const revalidator = useRevalidator();
  const [draft, setDraft] = useState(plannedSessions);
  const [alert, setAlert] = useState<string | null>(null);

  // A plan can't shrink below what was used, nor below one.
  const min = Math.max(usedSessions, 1);
  const changed = draft !== plannedSessions;

  const save = useMutation({
    mutationFn: () => client.enrollment.trainer.setPlannedSessions({ id: enrollment.id, plannedSessions: draft }),
    onSuccess: async () => {
      setAlert(null);
      toast.add({ title: "تعداد جلسه‌ها عوض شد.", type: "success" });
      await revalidator.revalidate();
    },
    onError: (error) => setAlert(describeApiFailure({ error, fallback: "ذخیره نشد. دوباره امتحان کن." }).message),
  });

  if (kind === "test" || !canSchedule) return null;

  const current = refundIfOwnerCancels({ enrollment, plannedSessions, now });
  const next = refundIfOwnerCancels({ enrollment, plannedSessions: draft, now });

  return (
    <section aria-labelledby="planned-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 id="planned-title" className="font-extrabold">
          تعداد جلسه‌ها
        </h3>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="یکی کمتر"
            disabled={draft <= min}
            onClick={() => setDraft((count) => Math.max(count - 1, min))}
          >
            <MinusIcon aria-hidden />
          </Button>
          <output aria-live="polite" className="w-10 text-center text-xl font-extrabold tabular-nums">
            {formatNumberFa(draft)}
          </output>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="یکی بیشتر"
            disabled={draft >= MAX_PLANNED_SESSIONS}
            onClick={() => setDraft((count) => Math.min(count + 1, MAX_PLANNED_SESSIONS))}
          >
            <PlusIcon aria-hidden />
          </Button>
        </div>
      </div>

      {/*------ Refund Effect ------*/}
      <p aria-live="polite" className="border-s-2 border-primary/50 ps-3 text-sm text-pretty">
        {changed ? (
          <>
            با {formatNumberFa(draft)} جلسه، اگر صاحب سگ الان لغو کند، {formatToman(next)} برمی‌گردد
            {next === current ? "؛ مثل الان." : ` (الان ${formatToman(current)}).`}
          </>
        ) : (
          <>اگر صاحب سگ الان لغو کند، {formatToman(current)} برمی‌گردد.</>
        )}
      </p>

      <FormAlert message={alert ?? undefined} />

      {changed && (
        <div className="flex gap-2">
          <Button type="button" disabled={save.isPending} onClick={() => save.mutate()} variant="secondary">
            {save.isPending && <Spinner data-icon="inline-start" />}
            ذخیره
          </Button>
          <Button type="button" variant="ghost" onClick={() => setDraft(plannedSessions)}>
            بیخیال
          </Button>
        </div>
      )}
    </section>
  );
}
