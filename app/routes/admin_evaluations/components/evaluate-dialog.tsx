import { useRef } from "react";

import { FormAlert } from "~/components/form-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { client } from "~/orpc/client";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE } from "~/routes/admin_evaluations/dialog-plate";

/*===== Evaluate Dialog =====*/
/**
 * «ارزیابی شد», asked once before it happens: it can't be undone, it unlocks the dog's courses, locks its birth date
 * and breed, and sends the owner an SMS. Controlled, with no trigger of its own, so a row button and the drawer's
 * footer share it; the page remounts it (a new `key`) for each opening, which also clears an old failure.
 *
 * It can't be dismissed while the write is in flight (closing would hide the outcome). `onConfirmed` runs the moment
 * the API has accepted the answer, before the list reloads, so the page can keep the row for its stamp (a conflict or a
 * failure never calls it). After a success the button that opened it is gone, so focus goes to `returnFocus()`.
 */
export function EvaluateDialog({
  evaluation,
  open,
  onOpenChange,
  onConfirmed,
  returnFocus,
}: {
  evaluation: AdminEvaluation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: (evaluation: AdminEvaluation) => void;
  /** Where focus lands after a success: the open drawer, or the queue. */
  returnFocus: () => HTMLElement | null;
}) {
  const succeeded = useRef(false);

  /*------ Action ------*/
  const evaluate = useAdminAction({
    mutationFn: async (id: string) => {
      const result = await client.evaluation.admin.evaluate({ id });
      succeeded.current = true;
      onConfirmed(evaluation);
      return result;
    },
    success: (result) => `ارزیابی ${result.dog.name} ثبت شد.`,
    toastFailure: false,
    onSuccess: () => onOpenChange(false),
    // Answered meanwhile (another tab, or the owner withdrew): the hook has toasted why and reloaded the list.
    onConflict: () => onOpenChange(false),
  });

  const dogName = evaluation.dog.name;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !evaluate.isPending && onOpenChange(next)}>
      <AlertDialogContent
        className={DIALOG_PLATE}
        finalFocus={() => {
          if (!succeeded.current) return true;
          returnFocus()?.focus({ preventScroll: true });
          return false;
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={DIALOG_TITLE}>ارزیابی {dogName} ثبت بشه؟</AlertDialogTitle>
          <AlertDialogDescription>
            {dogName} ارزیابی‌شده حساب می‌شه، دوره‌هاش باز می‌شن و تاریخ تولد و نژادش قفل می‌شه. به صاحبش پیامک می‌ره و
            این کار برنمی‌گرده.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={evaluate.isPending ? undefined : (evaluate.failure?.message ?? undefined)} />

        <AlertDialogFooter className={DIALOG_FOOTER}>
          <AlertDialogCancel disabled={evaluate.isPending}>نه، هنوز</AlertDialogCancel>
          <AlertDialogAction variant="solid" disabled={evaluate.isPending} onClick={() => evaluate.run(evaluation.id)}>
            {evaluate.isPending && <Spinner aria-hidden />}
            ارزیابی شد
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
