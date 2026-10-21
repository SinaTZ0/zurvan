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
import { client } from "~/orpc/client";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Issue Certificate Dialog =====*/
/**
 * «صدور گواهی» for a completed enrollment, asked once before it happens: the certificate gets a public number and a page
 * anyone can open to check it, and the owner sees it on the dog's page. It can be revoked, never deleted. Controlled, with
 * no trigger of its own; the action lives here so Escape can be refused while a request is in flight.
 */
export function IssueCertificateDialog({
  enrollment,
  open,
  onOpenChange,
}: {
  /** The enrollment being certified; the page keeps it while the dialog fades out. */
  enrollment: AdminEnrollment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const issue = useAdminAction({
    mutationFn: (enrollmentId: string) => client.certificate.admin.issue({ enrollmentId }),
    success: (certificate) => `گواهی ${certificate.dog.name} صادر شد.`,
    toastFailure: false,
    onSuccess: () => close(),
    onConflict: () => close(),
  });

  function close() {
    issue.reset();
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !issue.isPending && (next ? onOpenChange(true) : close())}>
      <AlertDialogContent className={`${DIALOG_PLATE} data-[size=default]:sm:max-w-md`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={DIALOG_TITLE}>
            {enrollment
              ? `گواهی «${enrollment.course.title}» برای ${enrollment.dog.name} صادر بشه؟`
              : "گواهی صادر بشه؟"}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            گواهی یه شماره‌ی عمومی می‌گیره و هر کسی شماره یا QR‌ش رو داشته باشه می‌تونه ببینه معتبره یا نه. صاحب سگ
            گواهی رو توی صفحه‌ی سگش می‌بینه. اگه اشتباه صادر شد، می‌شه باطلش کرد.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={issue.failure?.message ?? undefined} />

        <AlertDialogFooter className={DIALOG_FOOTER}>
          <AlertDialogCancel className={INK_OUTLINE} disabled={issue.isPending}>
            نه، هنوز
          </AlertDialogCancel>
          <AlertDialogAction
            variant="solid"
            disabled={issue.isPending || !enrollment}
            onClick={() => enrollment && issue.run(enrollment.id)}
          >
            {issue.isPending && <Spinner aria-hidden />}
            صدور گواهی
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
