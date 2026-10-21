import { useRef } from "react";

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
import { FormAlert } from "~/components/form-alert";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { client } from "~/orpc/client";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";

/*===== Types =====*/
export type FinishKind = "complete" | "cancel";

/*===== Copy =====*/
// One component for both endings: the words differ, the flow is the same (ask once, then write once).
const COPY: Record<
  FinishKind,
  {
    title: (names: { course: string; dog: string }) => string;
    body: (names: { dog: string }) => string;
    keep: string;
    confirm: string;
    toast: (names: { course: string; dog: string }) => string;
  }
> = {
  complete: {
    title: ({ course, dog }) => `دوره‌ی ${course} برای ${dog} تمام شد؟`,
    body: ({ dog }) => `${dog} این دوره رو گذرونده حساب می‌شه و دوره‌های بعدی براش باز می‌شن. به صاحبش پیامک می‌ره.`,
    keep: "نه، هنوز",
    confirm: "تمام شد",
    toast: ({ course, dog }) => `دوره‌ی ${course} برای ${dog} تمام شد.`,
  },
  cancel: {
    title: ({ course, dog }) => `ثبت‌نام ${dog} توی ${course} لغو بشه؟`,
    // Refunds are recorded on the Payments page (F5); the money itself moves outside the app.
    body: () => "پولی خودکار برنمی‌گرده؛ اگه قراره پس بدی، توی پرداخت‌ها بازپرداخت رو ثبت کن. به صاحبش پیامک می‌ره.",
    keep: "نه، بمونه",
    confirm: "لغو کن",
    toast: ({ course, dog }) => `ثبت‌نام ${dog} توی ${course} لغو شد.`,
  },
};

/*===== Finish Dialog =====*/
/**
 * The one confirmation before an enrollment ends (F6): «تمام شد» passes the course for the dog and unlocks the next
 * ones, «لغو» ends it with nothing passed. Both are final and both send the owner an SMS, so he is asked once. No form:
 * there is no note to write.
 *
 * Controlled, so the page keeps one dialog for all lines; the page remounts it (a new `key`) for each opening, which
 * also clears a failure left from the last one. It can't be dismissed while the write is in flight (closing
 * would hide the outcome), and a conflict (the enrollment is no longer active) closes it after the hook has toasted the
 * API's message and refreshed the list.
 *
 * `onConfirmed` runs the moment the API has accepted the ending, before the list reloads, so the page can keep the
 * line for its exit (a conflict or a failure never calls it). After a success the line is leaving, so focus goes back
 * to `returnFocus` (the sheet) instead of the line's vanished button.
 */
export function FinishDialog({
  open,
  onOpenChange,
  enrollment,
  kind,
  onConfirmed,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: AdminEnrollment;
  kind: FinishKind;
  onConfirmed: (args: { enrollment: AdminEnrollment; kind: FinishKind }) => void;
  returnFocus: React.RefObject<HTMLElement | null>;
}) {
  const copy = COPY[kind];
  const names = { course: enrollment.course.title, dog: enrollment.dog.name };
  const succeeded = useRef(false);

  /*------ Write ------*/
  const action = useAdminAction({
    mutationFn: async (id: string) => {
      const result =
        kind === "complete"
          ? await client.enrollment.admin.complete({ id })
          : await client.enrollment.admin.cancel({ id });
      succeeded.current = true;
      onConfirmed({ enrollment, kind });
      return result;
    },
    success: copy.toast(names),
    failureFallback: "انجام نشد. دوباره امتحان کن.",
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
      <AlertDialogContent
        className="rounded-3xl paper-grain"
        finalFocus={() => {
          if (!succeeded.current) return true;
          // The sheet, without scrolling: he stays where he was in the list.
          returnFocus.current?.focus({ preventScroll: true });
          return false;
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-pretty">{copy.title(names)}</AlertDialogTitle>
          <AlertDialogDescription>{copy.body(names)}</AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={action.isPending ? undefined : (action.failure?.message ?? undefined)} />

        <AlertDialogFooter className="rounded-b-3xl">
          <AlertDialogCancel disabled={action.isPending}>{copy.keep}</AlertDialogCancel>
          <AlertDialogAction
            variant={kind === "complete" ? "solid" : "destructive"}
            disabled={action.isPending}
            onClick={() => action.run(enrollment.id)}
          >
            {action.isPending && <Spinner aria-hidden />}
            {copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
