import { cn } from "cn";

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
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import type { AdminCourse } from "~/orpc/course/contract";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_courses/surfaces";

/*===== Archive Dialog =====*/
/**
 * «بایگانی بشه؟»: the one confirmation before a course leaves the shop (app-spec F8). The body says what happens to the
 * people already in it (active enrollments carry on, a finished one still counts as a prerequisite) and, when a course
 * on sale needs this one, names those courses under the slip's tear: they stop opening for a dog that hasn't passed this
 * one. Restoring needs no dialog, so it lives on the row.
 *
 * Controlled. The page remounts it for each opening so an old failure doesn't come back. It can't be dismissed while
 * the write is in flight, so the outcome is never hidden.
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
      <AlertDialogContent className={cn(DIALOG_PLATE, "data-[size=default]:sm:max-w-md")}>
        <AlertDialogHeader>
          <AlertDialogTitle className={DIALOG_TITLE}>{course.title} بایگانی بشه؟</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-pretty">
            دیگه توی فهرست نیست و کسی نمی‌تونه بخردش.
            {active > 0 &&
              ` ${formatNumberFa(active)} ثبت‌نام فعالش ادامه پیدا می‌کنه و کسی که تمومش کرده، پیش‌نیاز حساب می‌شه.`}{" "}
            هر وقت خواستی برش می‌گردونی.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/*------ Courses That Need It ------*/}
        {onSaleAfter.length > 0 && (
          <section aria-label="دوره‌هایی که بعد از این باز می‌شن" className={cn("border-t pt-4", ADMIN_TEAR)}>
            <p className="text-sm font-bold">این‌ها بعد از این دوره باز می‌شن:</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {onSaleAfter.map((required) => (
                <li
                  key={required.slug}
                  className="rounded-full border border-foreground/15 px-3 py-1 text-sm leading-5 text-foreground/90"
                >
                  {required.title}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm leading-6 text-pretty text-muted-foreground">
              سگی که این دوره رو نگذرونده، تا برش نگردونی به این‌ها نمی‌رسه.
            </p>
          </section>
        )}

        <FormAlert message={isPending ? undefined : failure} />

        <AlertDialogFooter className={DIALOG_FOOTER}>
          <AlertDialogCancel variant="outline" className={INK_OUTLINE} disabled={isPending}>
            نه، بمونه
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending && <Spinner aria-hidden />}
            بایگانی کن
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
