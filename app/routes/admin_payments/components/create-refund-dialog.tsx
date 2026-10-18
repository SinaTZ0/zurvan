import { useState } from "react";

import { FormAlert } from "~/components/form-alert";
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
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useAdminAction } from "~/hooks/use-admin-action";
import type { ApiFailure } from "~/lib/api-error";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { rialToToman, tomanToRial } from "~/lib/refund-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import { client } from "~/orpc/client";
import { REFUND_REASON_MAX_LENGTH } from "~/orpc/refund/constants";

/*===== Create Refund Dialog =====*/
/**
 * «ثبت بازپرداخت» for one paid payment: the Admin says how much goes back (in Toman, never more than what is left of
 * what the payment charged), for which course if it is for one, and why. It records the decision; the money is sent
 * outside the app and then marked paid. Controlled, with no trigger of its own; the request lives here so Escape can be
 * refused while it is in flight, and the form is mounted only while the dialog is open so it starts fresh each time.
 */
export function CreateRefundDialog({
  payment,
  remaining,
  open,
  onOpenChange,
}: {
  payment: AdminPayment;
  /** Rial of the payment's charge not yet promised back. */
  remaining: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useAdminAction({
    mutationFn: (vars: { paymentId: string; paymentItemId: string | null; amount: number; reason: string }) =>
      client.refund.admin.create(vars),
    success: "بازپرداخت ثبت شد.",
    toastFailure: false,
    onSuccess: () => close(),
    onConflict: () => close(),
  });

  function close() {
    create.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && (next ? onOpenChange(true) : close())}>
      {open && (
        <CreateForm
          payment={payment}
          remaining={remaining}
          pending={create.isPending}
          failure={create.failure}
          onClearFailure={create.reset}
          onSubmit={(vars) => create.run(vars)}
          onCancel={close}
        />
      )}
    </Dialog>
  );
}

/*===== Form =====*/
function CreateForm({
  payment,
  remaining,
  pending,
  failure,
  onClearFailure,
  onSubmit,
  onCancel,
}: {
  payment: AdminPayment;
  remaining: number;
  pending: boolean;
  failure: ApiFailure | null;
  onClearFailure: () => void;
  onSubmit: (vars: { paymentId: string; paymentItemId: string | null; amount: number; reason: string }) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(rialToToman(remaining)));
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState("");
  const [local, setLocal] = useState<{ amount?: string; reason?: string }>({});

  const amountError = local.amount ?? failure?.fields.amount;
  const reasonError = local.reason ?? failure?.fields.reason;

  return (
    <DialogContent showCloseButton={false}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const rial = tomanToRial(amount);
          const next: { amount?: string; reason?: string } = {};
          if (rial === null) next.amount = "مبلغ را به تومان و با عدد صحیح بنویس.";
          else if (rial > remaining) next.amount = `بیشتر از مبلغ قابل بازپرداخت (${formatToman(remaining)}) نمی‌شود.`;
          if (reason.trim() === "") next.reason = "دلیل بازپرداخت را بنویس.";
          setLocal(next);
          if (rial === null || next.amount || next.reason) return;
          onSubmit({ paymentId: payment.id, paymentItemId: itemId || null, amount: rial, reason });
        }}
      >
        <DialogHeader>
          <DialogTitle>ثبت بازپرداخت برای {payment.customer.name}</DialogTitle>
          <DialogDescription>
            این فقط تصمیم را ثبت می‌کند؛ پول را بیرون از برنامه بفرست و بعد «پرداخت شد» را بزن. قابل بازپرداخت:{" "}
            {formatToman(remaining)}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label htmlFor="refund-amount" className="text-sm font-bold">
            مبلغ (تومان)
          </label>
          <Input
            id="refund-amount"
            inputMode="numeric"
            autoComplete="off"
            readOnly={pending}
            value={amount}
            aria-invalid={!!amountError}
            onChange={(event) => {
              setAmount(event.target.value);
              setLocal((current) => ({ ...current, amount: undefined }));
              onClearFailure();
            }}
          />
          <p role="alert" className="min-h-5 text-xs text-destructive">
            {amountError}
          </p>
        </div>

        {payment.items.length > 0 && (
          <div className="grid gap-2">
            <label htmlFor="refund-item" className="text-sm font-bold">
              برای کدام دوره؟
            </label>
            <NativeSelect
              id="refund-item"
              className="w-full"
              disabled={pending}
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
            >
              <NativeSelectOption value="">کل پرداخت</NativeSelectOption>
              {payment.items.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.course.title} · {item.dog.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        <div className="grid gap-2">
          <label htmlFor="refund-reason" className="text-sm font-bold">
            دلیل
          </label>
          <Textarea
            id="refund-reason"
            rows={3}
            maxLength={REFUND_REASON_MAX_LENGTH}
            readOnly={pending}
            value={reason}
            aria-invalid={!!reasonError}
            onChange={(event) => {
              setReason(event.target.value);
              setLocal((current) => ({ ...current, reason: undefined }));
              onClearFailure();
            }}
          />
          <div className="flex items-start justify-between gap-3 text-xs">
            <p role="alert" className="min-h-4 text-destructive">
              {reasonError}
            </p>
            <p className="shrink-0 text-muted-foreground tabular-nums">
              {formatNumberFa(reason.length)} از {formatNumberFa(REFUND_REASON_MAX_LENGTH)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">این دلیل فقط خودت می‌بینی، نه مشتری.</p>
        </div>

        <FormAlert message={failure?.message ?? undefined} />

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner aria-hidden />}
            ثبت کن
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
