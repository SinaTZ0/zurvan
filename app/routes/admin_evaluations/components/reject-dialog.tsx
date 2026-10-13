import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

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
import { type ApiFailure } from "~/lib/api-error";
import { formatNumberFa } from "~/lib/digits";
import { client } from "~/orpc/client";
import { EVALUATION_REASON_MAX_LENGTH } from "~/orpc/evaluation/constants";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { rejectFormSchema, type RejectFormValues } from "~/routes/admin_evaluations/schema";

/*===== Reject Dialog =====*/
/**
 * «رد»: the Admin must give a reason, and the owner gets it in an SMS. Controlled, with no trigger of its own, so a row
 * button and the drawer's footer share it. The action lives here (so Escape can be refused while a request is in
 * flight); the form lives in the content, which is mounted only while the dialog is open, so the textbox starts empty
 * every time and keeps what was typed after a failure.
 */
export function RejectDialog({
  evaluation,
  open,
  onOpenChange,
}: {
  /** The request being answered; the page keeps it while the dialog fades out. */
  evaluation: AdminEvaluation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reject = useAdminAction({
    mutationFn: (vars: { id: string; reason: string }) => client.evaluation.admin.reject(vars),
    success: (result) => `درخواست ${result.dog.name} رد شد.`,
    toastFailure: false,
    onSuccess: () => close(),
    // Answered meanwhile: the hook has toasted why and reloaded the list.
    onConflict: () => close(),
  });

  function close() {
    reject.reset();
    onOpenChange(false);
  }

  return (
    // A request in flight can't be dismissed: closing would hide whether it worked.
    <Dialog open={open} onOpenChange={(next) => !reject.isPending && (next ? onOpenChange(true) : close())}>
      {evaluation && (
        <RejectForm
          evaluation={evaluation}
          pending={reject.isPending}
          failure={reject.failure}
          onClearFailure={reject.reset}
          onSubmit={(reason) => reject.run({ id: evaluation.id, reason })}
          onCancel={close}
        />
      )}
    </Dialog>
  );
}

/*===== Form =====*/
function RejectForm({
  evaluation,
  pending,
  failure,
  onClearFailure,
  onSubmit,
  onCancel,
}: {
  evaluation: AdminEvaluation;
  pending: boolean;
  failure: ApiFailure | null;
  onClearFailure: () => void;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectFormValues>({ resolver: zodResolver(rejectFormSchema), defaultValues: { reason: "" } });

  const length = useWatch({ control, name: "reason" }).length;

  /*------ Errors ------*/
  // The server's message for the field wins once a request has failed; it goes away as soon as the text changes.
  const fieldError = errors.reason?.message ?? failure?.fields.reason ?? Object.values(failure?.fields ?? {})[0];
  const reasonProps = register("reason", { onChange: onClearFailure });

  return (
    <DialogContent showCloseButton={false}>
      <form noValidate onSubmit={handleSubmit(({ reason }) => onSubmit(reason))} className="grid gap-4">
        <DialogHeader>
          <DialogTitle>رد درخواست {evaluation.dog.name}</DialogTitle>
          <DialogDescription>این دلیل در پیامک به صاحب سگ می‌رسد.</DialogDescription>
        </DialogHeader>

        {/*------ Reason ------*/}
        <div className="grid gap-2">
          <label htmlFor="reject-reason" className="text-sm font-bold">
            دلیل رد
          </label>
          <Textarea
            id="reject-reason"
            rows={4}
            maxLength={EVALUATION_REASON_MAX_LENGTH}
            readOnly={pending}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? "reject-reason-error" : undefined}
            {...reasonProps}
          />
          <div className="flex items-start justify-between gap-3 text-xs">
            <p id="reject-reason-error" role="alert" className="text-destructive">
              {fieldError}
            </p>
            <p className="shrink-0 text-muted-foreground tabular-nums">
              {formatNumberFa(length)} از {formatNumberFa(EVALUATION_REASON_MAX_LENGTH)}
            </p>
          </div>
        </div>

        <FormAlert message={failure?.message ?? undefined} />

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending && <Spinner aria-hidden />}
            رد کن
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
