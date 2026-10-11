import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { SessionCard } from "~/components/session-card";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { calculateEnrollmentRefund } from "~/lib/business-rules";
import { formatToman } from "~/lib/course-format";
import { ENROLLMENT_REASON_MAX_LENGTH } from "~/orpc/enrollment/constants";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { client } from "~/orpc/client";

/*===== Cancel Enrollment =====*/
/**
 * Ends a live course for good. The trainer's cancelling gives back the whole share of the unheld sessions (spec 3.4),
 * written in the dialog before he confirms, with the unheld boxes highlighted on the small card. The reason is
 * required because the owner reads it.
 */
export function CancelEnrollment({ enrollment, now }: { enrollment: TrainerEnrollment; now: Date }) {
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [alert, setAlert] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const { refundBasis } = enrollment;
  const refund = calculateEnrollmentRefund({
    kind: enrollment.kind,
    paidAmount: refundBasis.paidAmount - refundBasis.refundedAmount,
    plannedSessions: enrollment.plannedSessions,
    usedSessions: enrollment.usedSessions,
    policyPercent: refundBasis.policyPercent,
    cancelledBy: "staff",
    nextSessionStartsAt: enrollment.sessions.find((session) => session.status === "scheduled")?.startsAt ?? null,
    now,
  });

  const cancel = useMutation({
    mutationFn: () => client.order.cancelEnrollment({ enrollmentId: enrollment.id, reason }),
    onSuccess: async (result) => {
      setOpen(false);
      toast.add({
        title: `آموزش لغو شد و ${formatToman(result.refund.amount)} به کیف پول صاحب سگ برگشت.`,
        type: "success",
      });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const failure = describeApiFailure({ error, fallback: "لغو نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setReasonError(failure.fields.reason ?? null);
      // NOT_CANCELLABLE: it ended while this was open. Show the page as it is now.
      if (failure.message && !failure.fields.reason) await revalidator.revalidate();
    },
  });

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setAlert(null);
    setReasonError(null);
    if (!reason.trim()) {
      setReasonError("دلیل لغو را بنویس.");
      return;
    }
    cancel.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAlert(null);
          setReasonError(null);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="ghost" className="w-fit text-destructive" />}>
        لغو این آموزش
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-4rem)] gap-5 overflow-y-auto sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">آموزش {enrollment.dog.name} لغو شود؟</DialogTitle>
            <DialogDescription>
              دلیلت را صاحب سگ می‌بیند. جلسه‌های زمان‌بندی‌شده لغو می‌شوند و پیامک می‌گیرد.
            </DialogDescription>
          </DialogHeader>

          <SessionCard
            plannedSessions={enrollment.plannedSessions}
            sessions={enrollment.sessions}
            size="strip"
            highlightUnheld
          />
          <p className="border-s-2 border-primary/50 ps-3 text-sm text-pretty">
            {refund.amount > 0
              ? `سهم جلسه‌های برگزارنشده، ${formatToman(refund.amount)}، به کیف پول صاحب سگ برمی‌گردد.`
              : "چیزی به کیف پول صاحب سگ برنمی‌گردد."}
          </p>

          <FormAlert message={alert ?? undefined} />
          <Field data-invalid={!!reasonError}>
            <FieldLabel htmlFor="cancel-enrollment-reason">دلیل لغو</FieldLabel>
            <Textarea
              id="cancel-enrollment-reason"
              value={reason}
              maxLength={ENROLLMENT_REASON_MAX_LENGTH}
              aria-invalid={!!reasonError}
              onChange={(event) => setReason(event.target.value)}
            />
            <FieldError>{reasonError}</FieldError>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              برگرد
            </Button>
            <Button type="submit" variant="destructive" disabled={cancel.isPending}>
              {cancel.isPending && <Spinner data-icon="inline-start" />}
              لغو کن و پول را برگردان
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
