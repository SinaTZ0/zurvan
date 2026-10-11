import { ORPCError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useRevalidator } from "react-router";

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
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import { ASSESSMENT_REASON_MAX_LENGTH } from "~/orpc/assessment/constants";
import type { Assessment } from "~/orpc/assessment/contract";
import { client } from "~/orpc/client";
import { errorDataSchema } from "~/orpc/errors";

/** The API's own Persian message when it refuses (the time has started, or it was already cancelled). */
function refusalMessage(error: Error): string | null {
  if (!(error instanceof ORPCError) || error.code !== "NOT_CANCELLABLE") return null;

  const parsed = errorDataSchema.safeParse(error.data);
  return parsed.success ? (parsed.data.errors[0] ?? null) : null;
}

/*===== Cancel Assessment =====*/
/**
 * «لغو این ارزیابی»: a quiet destructive button that opens a confirmation naming the dog and the time, with an optional
 * reason for the trainer. Cancelling frees the slot for others, so the dialog says so.
 */
export function CancelAssessment({ assessment }: { assessment: Assessment }) {
  const revalidator = useRevalidator();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);

  const cancel = useMutation({
    mutationFn: () => client.assessment.cancel({ id: assessment.id, reason: reason.trim() || null }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: "ارزیابی لغو شد", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const message = refusalMessage(error);
      // A refusal means the page was stale (it started, or was cancelled elsewhere): say why and refresh underneath.
      if (message) {
        setRefusal(message);
        await revalidator.revalidate();
      } else {
        toast.add({ title: "لغو نشد. دوباره امتحان کن.", type: "error" });
      }
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Don't let a click outside close the dialog while the request is in flight.
        if (cancel.isPending) return;
        setOpen(next);
        if (next) {
          setReason("");
          setRefusal(null);
        }
      }}
    >
      <AlertDialogTrigger render={<Button type="button" variant="ghost" className="text-destructive" />}>
        لغو این ارزیابی
        <span className="sr-only"> برای {assessment.dog.name}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ارزیابی {assessment.dog.name} لغو شود؟</AlertDialogTitle>
          <AlertDialogDescription>
            وقت {formatSlotDay(assessment.startsAt)}، ساعت {formatSlotTime(assessment.startsAt)} آزاد می‌شود و بعد
            می‌توانی یک وقت دیگر رزرو کنی.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/*------ Reason ------*/}
        <div className="flex flex-col gap-2">
          <Label htmlFor={reasonId}>دلیل (اختیاری)</Label>
          <Textarea
            id={reasonId}
            value={reason}
            maxLength={ASSESSMENT_REASON_MAX_LENGTH}
            onChange={(event) => setReason(event.target.value)}
            placeholder="اگر می‌خواهی، برای آرمان بنویس."
            className="min-h-20"
          />
        </div>

        {refusal && (
          <p role="alert" className="text-sm text-destructive">
            {refusal}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancel.isPending}>نه، بماند</AlertDialogCancel>
          {/* Not `AlertDialogAction`: that closes the dialog on click, and it should stay open until the API answers. */}
          <Button type="button" variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            {cancel.isPending && <Spinner data-icon="inline-start" />}
            بله، لغو کن
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
