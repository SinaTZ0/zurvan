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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {enrollment
              ? `گواهی «${enrollment.course.title}» برای ${enrollment.dog.name} صادر شود؟`
              : "گواهی صادر شود؟"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            گواهی یک شماره‌ی عمومی می‌گیرد و هر کس شماره یا QR آن را داشته باشد می‌تواند معتبر بودنش را ببیند. صاحب سگ
            گواهی را توی صفحه‌ی سگش می‌بیند. اگر اشتباه صادر شد، می‌شود باطلش کرد.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <FormAlert message={issue.failure?.message ?? undefined} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={issue.isPending}>نه، هنوز</AlertDialogCancel>
          <AlertDialogAction
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
