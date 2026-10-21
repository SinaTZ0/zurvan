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
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useAdminAction } from "~/hooks/use-admin-action";
import type { ApiFailure } from "~/lib/api-error";
import { client } from "~/orpc/client";
import type { Certificate } from "~/orpc/certificate/contract";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Revoke Certificate Dialog =====*/
/**
 * «باطل کردن گواهی»: the Admin must say why, and the reason is his, kept with the record and never shown to anyone else.
 * The certificate stays on record; its public page then says it is revoked. This can't be undone. Controlled, with no
 * trigger of its own; the form is mounted only while the dialog is open, so the box starts empty each time.
 */
export function RevokeCertificateDialog({
  certificate,
  open,
  onOpenChange,
}: {
  certificate: Certificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const revoke = useAdminAction({
    mutationFn: (vars: { id: string; reason: string }) => client.certificate.admin.revoke(vars),
    success: "گواهی باطل شد.",
    toastFailure: false,
    onSuccess: () => close(),
    onConflict: () => close(),
  });

  function close() {
    revoke.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !revoke.isPending && (next ? onOpenChange(true) : close())}>
      {certificate && (
        <RevokeForm
          certificate={certificate}
          pending={revoke.isPending}
          failure={revoke.failure}
          onClearFailure={revoke.reset}
          onSubmit={(reason) => revoke.run({ id: certificate.id, reason })}
          onCancel={close}
        />
      )}
    </Dialog>
  );
}

/*===== Form =====*/
function RevokeForm({
  certificate,
  pending,
  failure,
  onClearFailure,
  onSubmit,
  onCancel,
}: {
  certificate: Certificate;
  pending: boolean;
  failure: ApiFailure | null;
  onClearFailure: () => void;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [missing, setMissing] = useState(false);
  const fieldError = missing ? "دلیل باطل کردن رو بنویس." : failure?.fields.reason;

  return (
    <DialogContent showCloseButton={false} className={DIALOG_PLATE}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (reason.trim() === "") {
            setMissing(true);
            return;
          }
          onSubmit(reason);
        }}
        className="grid gap-4"
      >
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE}>گواهی «{certificate.course.title}» باطل بشه؟</DialogTitle>
          <DialogDescription className="leading-6">
            گواهی توی سابقه می‌مونه، ولی صفحه‌ی عمومی‌ش می‌گه «باطل شده». این کار برگشت نداره. دلیلت رو فقط خودت
            می‌بینی.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label htmlFor="revoke-reason" className="text-sm font-bold">
            دلیل باطل کردن
          </label>
          <Textarea
            id="revoke-reason"
            rows={3}
            readOnly={pending}
            value={reason}
            aria-invalid={!!fieldError}
            onChange={(event) => {
              setReason(event.target.value);
              setMissing(false);
              onClearFailure();
            }}
          />
          <p role="alert" className="min-h-5 text-xs text-destructive">
            {fieldError}
          </p>
        </div>

        <FormAlert message={failure?.message ?? undefined} />

        <DialogFooter className={DIALOG_FOOTER}>
          <Button type="button" variant="outline" className={INK_OUTLINE} disabled={pending} onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending && <Spinner aria-hidden />}
            باطل کن
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
