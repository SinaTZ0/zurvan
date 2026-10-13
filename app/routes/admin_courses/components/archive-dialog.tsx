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
import { formatNumberFa } from "~/lib/digits";
import type { AdminCourse } from "~/orpc/course/contract";

/*===== Archive Dialog =====*/
/**
 * «بایگانی شود؟»: the one confirmation before a course leaves the shop (app-spec F8). The body says what happens to the
 * people already in it (active enrollments carry on, a finished one still counts as a prerequisite) and, when a course
 * on sale needs this one, which courses stop opening for new dogs. Restoring needs no dialog, so it lives on the row.
 *
 * Controlled. The page remounts it for each opening so an old failure doesn't come back.
 */
export function ArchiveDialog({
  open,
  onOpenChange,
  course,
  isPending,
  failure,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: AdminCourse;
  isPending: boolean;
  failure: string | undefined;
  onConfirm: () => void;
}) {
  const active = course.activeEnrollmentCount;
  // Only courses on sale are named: an archived course that needs this one is already off the shop.
  const onSaleAfter = course.requiredBy.filter((required) => required.status === "approved");

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>بایگانی {course.title}؟</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              دیگر در فهرست نیست و کسی نمی‌تواند بخرد.
              {active > 0 &&
                ` ${formatNumberFa(active)} ثبت‌نام فعالش ادامه پیدا می‌کند و کسی که تمامش کرده، پیش‌نیاز حساب می‌شود.`}{" "}
              هر وقت خواستی برش می‌گردانی.
            </span>
            {onSaleAfter.length > 0 && (
              <span className="mt-2 block">
                {onSaleAfter.map((required) => required.title).join("، ")} بعد از این باز می‌شوند؛ سگی که این دوره را
                نگذرانده تا برگرداندنش به آن‌ها نمی‌رسد.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={isPending ? undefined : failure} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>نه</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending && <Spinner aria-hidden />}
            بله، بایگانی شود
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
