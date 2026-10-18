import { useState } from "react";

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
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { formatToman } from "~/lib/course-format";
import { client } from "~/orpc/client";
import type { Refund } from "~/orpc/refund/contract";

/*===== Mark Refund Paid =====*/
/**
 * «پرداخت شد»: the Admin has sent the money out of the app and writes the transfer's reference, which is kept with the
 * refund and sent to the customer in an SMS. It can't be undone. Controlled; the form lives only while the dialog is open.
 */
export function MarkRefundPaidDialog({
  refund,
  open,
  onOpenChange,
}: {
  refund: Refund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reference, setReference] = useState("");
  const [missing, setMissing] = useState(false);
  const paid = useAdminAction({
    mutationFn: (vars: { id: string; reference: string }) => client.refund.admin.markPaid(vars),
    success: "بازپرداخت پرداخت‌شده ثبت شد.",
    toastFailure: false,
    onSuccess: () => close(),
    onConflict: () => close(),
  });

  function close() {
    paid.reset();
    setReference("");
    setMissing(false);
    onOpenChange(false);
  }

  const fieldError = missing ? "کد پیگیری انتقال را بنویس." : paid.failure?.fields.reference;

  return (
    <Dialog open={open} onOpenChange={(next) => !paid.isPending && (next ? onOpenChange(true) : close())}>
      {refund && (
        <DialogContent showCloseButton={false}>
          <form
            noValidate
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (reference.trim() === "") {
                setMissing(true);
                return;
              }
              paid.run({ id: refund.id, reference });
            }}
          >
            <DialogHeader>
              <DialogTitle>{formatToman(refund.amount)} پرداخت شد؟</DialogTitle>
              <DialogDescription>
                کد پیگیری انتقال ثبت می‌شود و به مشتری پیامک می‌رود. بعد از این برگشتی ندارد.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label htmlFor="refund-reference" className="text-sm font-bold">
                کد پیگیری انتقال
              </label>
              <Input
                id="refund-reference"
                dir="ltr"
                autoComplete="off"
                readOnly={paid.isPending}
                value={reference}
                aria-invalid={!!fieldError}
                onChange={(event) => {
                  setReference(event.target.value);
                  setMissing(false);
                  paid.reset();
                }}
              />
              <p role="alert" className="min-h-5 text-xs text-destructive">
                {fieldError}
              </p>
            </div>

            <FormAlert message={paid.failure?.message ?? undefined} />

            <DialogFooter>
              <Button type="button" variant="outline" disabled={paid.isPending} onClick={close}>
                انصراف
              </Button>
              <Button type="submit" disabled={paid.isPending}>
                {paid.isPending && <Spinner aria-hidden />}
                پرداخت شد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

/*===== Cancel Refund =====*/
/** «لغو بازپرداخت»: withdraws a refund that has not been paid. Its amount goes back to what can still be refunded. */
export function CancelRefundDialog({
  refund,
  open,
  onOpenChange,
}: {
  refund: Refund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cancel = useAdminAction({
    mutationFn: (id: string) => client.refund.admin.cancel({ id }),
    success: "بازپرداخت لغو شد.",
    toastFailure: false,
    onSuccess: () => close(),
    onConflict: () => close(),
  });

  function close() {
    cancel.reset();
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !cancel.isPending && (next ? onOpenChange(true) : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {refund ? `بازپرداخت ${formatToman(refund.amount)} لغو شود؟` : "لغو شود؟"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            هنوز پرداخت نشده، پس چیزی از دست نمی‌رود. مبلغش دوباره قابل بازپرداخت می‌شود.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormAlert message={cancel.failure?.message ?? undefined} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancel.isPending}>نه</AlertDialogCancel>
          <AlertDialogAction disabled={cancel.isPending || !refund} onClick={() => refund && cancel.run(refund.id)}>
            {cancel.isPending && <Spinner aria-hidden />}
            لغو کن
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
