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
import type { AdminPartner } from "~/orpc/partner/contract";

/*===== Deactivate Dialog =====*/
/**
 * «غیرفعال کنیم؟»: the one confirmation before a partner's link and numbers stop counting (F7). Written commissions
 * stay and are paid as usual, which the body says outright so he doesn't hold back from closing an account for fear of
 * losing what is owed. Activating again needs no dialog (it only starts counting later sign-ups), so it lives in the
 * drawer.
 *
 * Controlled and remounted by the drawer for each opening, like the pay dialog.
 */
export function DeactivateDialog({
  open,
  onOpenChange,
  partner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: AdminPartner;
}) {
  const action = useAdminAction({
    mutationFn: (id: string) => client.partner.admin.setActive({ id, isActive: false }),
    success: `${partner.name} غیرفعال شد`,
    toastFailure: false,
    onSuccess: () => onOpenChange(false),
    onConflict: () => onOpenChange(false),
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!action.isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>غیرفعال کنیم؟</AlertDialogTitle>
          <AlertDialogDescription>
            لینک و شماره‌های {partner.name} از این به بعد کسی را به نام او ثبت نمی‌کند و برای خریدهای بعد پورسانتی
            نمی‌نویسد. پورسانت‌های نوشته‌شده می‌مانند و پرداخت می‌شوند.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={action.isPending ? undefined : (action.failure?.message ?? undefined)} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={action.isPending}>نه</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={action.isPending} onClick={() => action.run(partner.id)}>
            {action.isPending && <Spinner aria-hidden />}
            بله، غیرفعال شود
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
