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

/*===== Evaluate Dialog =====*/
/**
 * «ارزیابی شد», asked once before it happens: it can't be undone, it unlocks the dog's courses, locks its birth date
 * and breed, and sends the owner an SMS. Controlled, with no trigger of its own, so a row button and the drawer's
 * footer share it.
 */
export function EvaluateDialog({
  evaluation,
  open,
  onOpenChange,
}: {
  /** The request being answered; the page keeps it while the dialog fades out. */
  evaluation: AdminEvaluation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  /*------ Action ------*/
  const evaluate = useAdminAction({
    mutationFn: (id: string) => client.evaluation.admin.evaluate({ id }),
    success: (result) => `ارزیابی ${result.dog.name} ثبت شد.`,
    toastFailure: false,
    onSuccess: () => close(),
    // Answered meanwhile (another tab, or the owner withdrew): the hook has toasted why and reloaded the list.
    onConflict: () => close(),
  });

  function close() {
    evaluate.reset();
    onOpenChange(false);
  }

  const dogName = evaluation?.dog.name ?? "";

  return (
    // A request in flight can't be dismissed: closing would hide whether it worked.
    <AlertDialog open={open} onOpenChange={(next) => !evaluate.isPending && (next ? onOpenChange(true) : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ارزیابی {dogName} ثبت شود؟</AlertDialogTitle>
          <AlertDialogDescription>
            {dogName} ارزیابی‌شده می‌شود، دوره‌هایش باز می‌شوند و تاریخ تولد و نژادش قفل می‌شود. به صاحبش پیامک می‌رود و
            این کار برنمی‌گردد.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={evaluate.failure?.message ?? undefined} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={evaluate.isPending}>نه، هنوز</AlertDialogCancel>
          <AlertDialogAction
            disabled={evaluate.isPending || !evaluation}
            onClick={() => evaluation && evaluate.run(evaluation.id)}
          >
            {evaluate.isPending && <Spinner aria-hidden />}
            ارزیابی شد
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
