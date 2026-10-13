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
    body: ({ dog }) =>
      `${dog} این دوره را گذرانده حساب می‌شود و دوره‌های بعدی برایش باز می‌شوند. به صاحبش پیامک می‌رود.`,
    keep: "نه، هنوز",
    confirm: "تمام شد",
    toast: ({ course, dog }) => `دوره‌ی ${course} برای ${dog} تمام شد.`,
  },
  cancel: {
    title: ({ course, dog }) => `ثبت‌نام ${dog} در ${course} لغو شود؟`,
    body: () => "پولی از برنامه برنمی‌گردد؛ اگر لازم باشد خودت بیرون از برنامه پس می‌دهی. به صاحبش پیامک می‌رود.",
    keep: "نه، بمونه",
    confirm: "لغو کن",
    toast: ({ course, dog }) => `ثبت‌نام ${dog} در ${course} لغو شد.`,
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
 */
export function FinishDialog({
  open,
  onOpenChange,
  enrollment,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: AdminEnrollment;
  kind: FinishKind;
}) {
  const copy = COPY[kind];
  const names = { course: enrollment.course.title, dog: enrollment.dog.name };

  /*------ Write ------*/
  const action = useAdminAction({
    mutationFn: (id: string) =>
      kind === "complete" ? client.enrollment.admin.complete({ id }) : client.enrollment.admin.cancel({ id }),
    success: copy.toast(names),
    failureFallback: "انجام نشد. دوباره امتحان کن.",
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
          <AlertDialogTitle>{copy.title(names)}</AlertDialogTitle>
          <AlertDialogDescription>{copy.body(names)}</AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={action.isPending ? undefined : (action.failure?.message ?? undefined)} />

        <AlertDialogFooter>
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
