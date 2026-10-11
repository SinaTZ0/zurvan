import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { SessionCard } from "~/components/session-card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { formatToman } from "~/lib/course-format";
import { enrollmentTitle } from "~/lib/enrollment-format";
import { ENROLLMENT_REASON_MAX_LENGTH } from "~/orpc/enrollment/constants";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";
import { client } from "~/orpc/client";
import { describeRefund } from "~/routes/account_enrollment_detail/refund-words";

/*===== Cancel Enrollment =====*/
/**
 * «لغو این آموزش»: a quiet destructive button whose dialog says exactly what comes back and why, shows the session
 * card with the boxes the refund is counted on lit, and takes an optional reason for the trainer. The amount is the
 * API's `refundPreview`, which the cancelling recomputes, so the sentence and the wallet agree.
 */
export function CancelEnrollment({
  enrollment,
  preview,
}: {
  enrollment: CustomerEnrollment;
  preview: NonNullable<CustomerEnrollment["refundPreview"]>;
}) {
  const revalidator = useRevalidator();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<string | undefined>();

  const cancel = useMutation({
    mutationFn: () => client.order.cancelEnrollment({ enrollmentId: enrollment.id, reason: reason.trim() || null }),
    onSuccess: async ({ refund }) => {
      setOpen(false);
      toast.add({
        title: refund.amount > 0 ? `آموزش لغو شد؛ ${formatToman(refund.amount)} به کیف پولت برگشت` : "آموزش لغو شد",
        type: "success",
      });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      setFailure(describeApiFailure({ error, fallback: "لغو نشد. دوباره امتحان کن." }).message ?? undefined);
      // A refusal means the page was stale (cancelled elsewhere, or the trainer ended it): refresh underneath.
      await revalidator.revalidate();
    },
  });

  // The lit boxes are the unheld sessions the refund is counted on; when nothing comes back there is nothing to point at.
  const countsSessions = preview.amount > 0 && preview.rule !== "staff";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Don't let a click outside close the dialog while the request is in flight.
        if (cancel.isPending) return;
        setOpen(next);
        if (next) {
          setReason("");
          setFailure(undefined);
        }
      }}
    >
      <AlertDialogTrigger render={<Button type="button" variant="ghost" className="text-destructive" />}>
        لغو این آموزش
      </AlertDialogTrigger>
      <AlertDialogContent className="data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {enrollmentTitle(enrollment)} برای {enrollment.dog.name} لغو شود؟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground">
            {describeRefund({ enrollment, rule: preview.rule, amount: preview.amount })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/*------ The Card ------*/}
        <div className="flex flex-col gap-2 rounded-xl bg-sunken p-3">
          <SessionCard
            plannedSessions={enrollment.plannedSessions}
            sessions={enrollment.sessions}
            size="strip"
            highlightUnheld={countsSessions}
          />
          {countsSessions && (
            <p className="text-xs text-pretty text-muted-foreground">
              خانه‌های روشن، جلسه‌هایی است که سهمشان برمی‌گردد.
            </p>
          )}
        </div>

        {/*------ Reason ------*/}
        <div className="flex flex-col gap-2">
          <Label htmlFor={reasonId}>دلیل (اختیاری)</Label>
          <Textarea
            id={reasonId}
            value={reason}
            maxLength={ENROLLMENT_REASON_MAX_LENGTH}
            onChange={(event) => setReason(event.target.value)}
            placeholder="اگر می‌خواهی، برای مربی بنویس."
            className="min-h-20"
          />
        </div>

        <FormAlert message={failure} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancel.isPending}>نه، بماند</AlertDialogCancel>
          {/* Not `AlertDialogAction`: that closes the dialog on click, and it should stay open until the API answers. */}
          <Button type="button" variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            {cancel.isPending && <Spinner data-icon="inline-start" />}
            {preview.amount > 0 ? "لغو کن و پول را برگردان" : "لغو کن"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
