import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
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
import { ASSESSMENT_REASON_MAX_LENGTH } from "~/orpc/assessment/constants";
import { client } from "~/orpc/client";

/*===== Cancel Assessment =====*/
/**
 * «لغو این ارزیابی», for an upcoming booking only. The reason is required because the customer receives it by SMS, and
 * the slot is closed rather than reopened: if the trainer can't make it, nobody should book it again.
 */
export function CancelAssessment({ assessmentId, dogName }: { assessmentId: string; dogName: string }) {
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [alert, setAlert] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const cancel = useMutation({
    mutationFn: () => client.assessment.trainer.cancel({ id: assessmentId, reason }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: "ارزیابی لغو شد و برای صاحب سگ پیامک رفت.", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const failure = describeApiFailure({ error, fallback: "لغو نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setReasonError(failure.fields.reason ?? null);
      // NOT_CANCELLABLE: the time came, or the customer cancelled first. Show the page as it is now.
      if (failure.message && !failure.fields.reason) await revalidator.revalidate();
    },
  });

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setAlert(null);
    setReasonError(null);
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
      <DialogTrigger render={<Button type="button" variant="ghost" className="text-destructive" />}>
        لغو این ارزیابی
      </DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">ارزیابی {dogName} لغو شود؟</DialogTitle>
            <DialogDescription>
              دلیلت با پیامک برای صاحب سگ می‌رود. این وقت هم بسته می‌شود و کسی دوباره رزروش نمی‌کند.
            </DialogDescription>
          </DialogHeader>
          <FormAlert message={alert ?? undefined} />
          <Field data-invalid={!!reasonError}>
            <FieldLabel htmlFor="cancel-reason">دلیل لغو</FieldLabel>
            <Textarea
              id="cancel-reason"
              value={reason}
              maxLength={ASSESSMENT_REASON_MAX_LENGTH}
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
              لغو کن
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
