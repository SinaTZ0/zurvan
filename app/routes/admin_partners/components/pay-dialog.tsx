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
import { formatToman } from "~/lib/course-format";
import { client } from "~/orpc/client";
import type { AdminCommission } from "~/orpc/commission/contract";
import { firstNameOf } from "~/routes/admin_partners/partner-views";

/*===== Pay Dialog =====*/
/**
 * The one confirmation before a commission is marked paid (F9). The transfer happened in his bank app; this records it
 * and sends the partner an SMS, which can't be taken back, so he is asked once per commission (no bulk button: each
 * SMS must name a payment that really happened).
 *
 * Controlled, so the page keeps one dialog for every «پرداخت شد»; the page remounts it (a new `key`) for each opening,
 * which also clears a failure left from the last one. It can't be dismissed while the write is in flight, and
 * `ALREADY_PAID` (another tab got there first) goes through the hook's conflict path: it toasts the API's message,
 * refreshes the list and closes this.
 */
export function PayDialog({
  open,
  onOpenChange,
  commission,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: AdminCommission;
}) {
  const partnerName = commission.partner.name;

  /*------ Write ------*/
  const action = useAdminAction({
    mutationFn: (id: string) => client.commission.admin.markPaid({ id }),
    success: `پرداخت شد؛ به ${firstNameOf(partnerName)} پیامک رفت`,
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
          <AlertDialogTitle>پرداخت شد؟</AlertDialogTitle>
          <AlertDialogDescription>
            {formatToman(commission.amount)} به {partnerName} پرداخت شده؟ برگشتی ندارد و به او پیامک می‌رود.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={action.isPending ? undefined : (action.failure?.message ?? undefined)} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={action.isPending}>نه، برگرد</AlertDialogCancel>
          <AlertDialogAction variant="solid" disabled={action.isPending} onClick={() => action.run(commission.id)}>
            {action.isPending && <Spinner aria-hidden />}
            بله، پرداخت شد
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
