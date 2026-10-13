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
import type { AdminDog } from "~/orpc/dog/contract";

/*===== Evaluate Dialog =====*/
/**
 * «ارزیابی شد» for a dog, asked once before it happens: it can't be undone, it unlocks the dog's courses, locks its
 * birth date and breed for the owner, and sends the owner an SMS. It works with or without a request from the owner
 * (`markEvaluated` answers an open one too), so the body says so when there is one waiting.
 */
export function EvaluateDialog({
  dog,
  hasWaitingRequest,
  open,
  onOpenChange,
}: {
  dog: AdminDog;
  hasWaitingRequest: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  /*------ Action ------*/
  const evaluate = useAdminAction({
    mutationFn: (dogId: string) => client.evaluation.admin.markEvaluated({ dogId }),
    success: `${dog.name} ارزیابی‌شده ثبت شد.`,
    toastFailure: false,
    onSuccess: () => close(),
    // Evaluated meanwhile (another tab): the hook has toasted why and reloaded the page.
    onConflict: () => close(),
  });

  function close() {
    evaluate.reset();
    onOpenChange(false);
  }

  return (
    // A request in flight can't be dismissed: closing would hide whether it worked.
    <AlertDialog open={open} onOpenChange={(next) => !evaluate.isPending && (next ? onOpenChange(true) : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dog.name} ارزیابی‌شده ثبت شود؟</AlertDialogTitle>
          <AlertDialogDescription>
            دوره‌هایش برای خرید باز می‌شوند و نژاد و تاریخ تولدش برای صاحبش قفل می‌شود. به صاحبش پیامک می‌رود.
            {hasWaitingRequest && " درخواستش هم جواب داده می‌شود."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={evaluate.failure?.message ?? undefined} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={evaluate.isPending}>نه، هنوز</AlertDialogCancel>
          <AlertDialogAction disabled={evaluate.isPending} onClick={() => evaluate.run(dog.id)}>
            {evaluate.isPending && <Spinner aria-hidden />}
            ارزیابی شد
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
