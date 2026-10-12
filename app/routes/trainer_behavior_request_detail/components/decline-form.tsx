import { useMutation } from "@tanstack/react-query";
import { ORPCError } from "@orpc/client";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { client } from "~/orpc/client";
import { BEHAVIOR_TRAINER_NOTE_MAX_LENGTH } from "~/orpc/behavior-request/constants";

/*===== Decline Form =====*/
/**
 * Declining with a reason the owner reads (e.g. «اول یک ارزیابی حضوری لازم است»). The reason is written first; the
 * destructive «رد کردن درخواست» asks for confirmation before anything is sent, since the owner is told at once.
 */
export function DeclineForm({ requestId, onCancel }: { requestId: string; onCancel?: () => void }) {
  const revalidator = useRevalidator();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const decline = useMutation({
    mutationFn: () => client.behaviorRequest.trainer.decline({ id: requestId, reason }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: "درخواست رد شد.", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      setOpen(false);
      const failure = describeApiFailure({ error, fallback: "رد نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setReasonError(failure.fields.reason ?? null);
      if (error instanceof ORPCError && (error.code === "NOT_ANSWERABLE" || error.code === "NOT_FOUND")) {
        // The card remounts with the new status, which clears this alert, so the reason also goes to a toast.
        toast.add({ title: failure.message ?? "این درخواست دیگر در انتظار پاسخ نیست.", type: "error" });
        await revalidator.revalidate();
      }
    },
  });

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setAlert(null);
    if (reason.trim() === "") {
      setReasonError("دلیل را بنویس؛ صاحب سگ آن را می‌بیند.");
      return;
    }
    setReasonError(null);
    setOpen(true);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <FormAlert message={alert ?? undefined} />

      <Field data-invalid={!!reasonError}>
        <FieldLabel htmlFor="decline-reason">دلیل رد کردن</FieldLabel>
        <FieldDescription>صاحب سگ این را می‌بیند. مثلاً: اول یک ارزیابی حضوری لازم است.</FieldDescription>
        <Textarea
          id="decline-reason"
          value={reason}
          maxLength={BEHAVIOR_TRAINER_NOTE_MAX_LENGTH}
          aria-invalid={!!reasonError}
          onChange={(event) => setReason(event.target.value)}
          className="min-h-28"
        />
        <FieldError>{reasonError}</FieldError>
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
        <Button type="submit" variant="destructive" className="w-full sm:w-auto">
          رد کردن درخواست
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
        )}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="gap-5 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold">این درخواست رد شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              صاحب سگ همین دلیل را می‌بیند. اگر برنامه‌ای برایش باز کرده باشد، آن سفارش لغو می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              برگرد
            </Button>
            <Button type="button" variant="destructive" disabled={decline.isPending} onClick={() => decline.mutate()}>
              {decline.isPending && <Spinner data-icon="inline-start" />}
              رد کن
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
