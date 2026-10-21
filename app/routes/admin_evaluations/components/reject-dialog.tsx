import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
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
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE } from "~/routes/admin_evaluations/dialog-plate";
import { rejectFormSchema, type RejectFormValues } from "~/routes/admin_evaluations/schema";

/*===== Reject Dialog =====*/
/**
 * «رد»: the Admin must give a reason, and the owner gets it in an SMS. Controlled, with no trigger of its own, so a row
 * button and the drawer's footer share it; the page remounts it for each opening, so the textbox starts empty every
 * time, and it keeps what was typed after a failure.
 *
 * The action lives here (so Escape can be refused while a request is in flight). `onConfirmed` runs the moment the API
 * has accepted the answer, before the list reloads, so the page can keep the row for its stamp; after a success focus
 * goes to `returnFocus()`, since the button that opened it is gone.
 */
export function RejectDialog({
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

  const reject = useAdminAction({
    mutationFn: async (vars: { id: string; reason: string }) => {
      const result = await client.evaluation.admin.reject(vars);
      succeeded.current = true;
      onConfirmed(evaluation);
      return result;
    },
    success: (result) => `درخواست ${result.dog.name} رد شد.`,
    toastFailure: false,
    onSuccess: () => onOpenChange(false),
    // Answered meanwhile: the hook has toasted why and reloaded the list.
    onConflict: () => onOpenChange(false),
  });

  return (
    // A request in flight can't be dismissed: closing would hide whether it worked.
    <Dialog open={open} onOpenChange={(next) => !reject.isPending && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className={DIALOG_PLATE}
        finalFocus={() => {
          if (!succeeded.current) return true;
          returnFocus()?.focus({ preventScroll: true });
          return false;
        }}
      >
        <RejectForm
          evaluation={evaluation}
          pending={reject.isPending}
          failure={reject.failure}
          onClearFailure={reject.reset}
          onSubmit={(reason) => reject.run({ id: evaluation.id, reason })}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
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
    <form noValidate onSubmit={handleSubmit(({ reason }) => onSubmit(reason))} className="grid gap-4">
      <DialogHeader>
        <DialogTitle className={DIALOG_TITLE}>درخواست {evaluation.dog.name} رد بشه؟</DialogTitle>
        <DialogDescription>
          دلیلش رو بنویس؛ توی پیامک به صاحبش می‌رسه. بعدش می‌تونه دوباره درخواست بده.
        </DialogDescription>
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
        <div className="flex min-h-5 items-start justify-between gap-3 text-xs">
          <p id="reject-reason-error" role="alert" className="text-destructive">
            {fieldError}
          </p>
          <p className="shrink-0 text-muted-foreground tabular-nums">
            {formatNumberFa(length)} از {formatNumberFa(EVALUATION_REASON_MAX_LENGTH)}
          </p>
        </div>
      </div>

      <FormAlert message={failure?.message ?? undefined} />

      <DialogFooter className={DIALOG_FOOTER}>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          نه، بمونه
        </Button>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending && <Spinner aria-hidden />}
          رد کن
        </Button>
      </DialogFooter>
    </form>
  );
}
