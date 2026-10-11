import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
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
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { ASSESSMENT_TRAINER_NOTES_MAX_LENGTH } from "~/orpc/assessment/constants";
import { client } from "~/orpc/client";

/*===== Mark No-Show =====*/
/**
 * «حاضر نشد»: the customer didn't come. It ends the assessment for good, so it asks first; the note is optional.
 */
export function MarkNoShow({ assessmentId }: { assessmentId: string }) {
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [alert, setAlert] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const markNoShow = useMutation({
    mutationFn: () => client.assessment.trainer.markNoShow({ id: assessmentId, trainerNotes: note }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: "ثبت شد که حاضر نشد.", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      const failure = describeApiFailure({ error, fallback: "ثبت نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setNoteError(failure.fields.trainerNotes ?? null);
      if (failure.message && !failure.fields.trainerNotes) await revalidator.revalidate();
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAlert(null);
          setNoteError(null);
        }
      }}
    >
      <AlertDialogTrigger render={<Button type="button" variant="outline" className="w-full sm:w-auto" />}>
        حاضر نشد
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>ثبت شود که حاضر نشد؟</AlertDialogTitle>
          <AlertDialogDescription>ارزیابی بسته می‌شود و بعد از این نمی‌شود برایش نتیجه نوشت.</AlertDialogDescription>
        </AlertDialogHeader>
        <FormAlert message={alert ?? undefined} />
        <Field data-invalid={!!noteError}>
          <FieldLabel htmlFor="no-show-note">
            یادداشت <span className="font-medium text-muted-foreground">(اختیاری)</span>
          </FieldLabel>
          <Textarea
            id="no-show-note"
            value={note}
            maxLength={ASSESSMENT_TRAINER_NOTES_MAX_LENGTH}
            aria-invalid={!!noteError}
            onChange={(event) => setNote(event.target.value)}
          />
          <FieldError>{noteError}</FieldError>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>برگرد</AlertDialogCancel>
          {/* Not `AlertDialogAction`: that closes the dialog before the request answers, hiding a refusal. */}
          <Button type="button" variant="solid" disabled={markNoShow.isPending} onClick={() => markNoShow.mutate()}>
            {markNoShow.isPending && <Spinner data-icon="inline-start" />}
            بله، حاضر نشد
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
