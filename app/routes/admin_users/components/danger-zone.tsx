import { useState } from "react";

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
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import type { UserStatus } from "~/lib/user-constants";
import { client } from "~/orpc/client";
import type { AdminUser } from "~/orpc/user/contract";

/*===== Danger Zone =====*/
/**
 * The switch that shuts an account or opens it again, in its own bordered block at the end of the dialog. Blocking asks
 * first (it signs the person out everywhere); opening again needs no question. The Admin's own row and any admin have no
 * button at all, only the line that says why (the API refuses both too).
 *
 * Success closes the whole dialog; a failure stays in a `FormAlert` (in the confirm while it is open, else in the
 * block) so the Admin sees why and can try again.
 */
export function DangerZone({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const change = useAdminAction({
    mutationFn: (status: UserStatus) => client.user.admin.setStatus({ id: user.id, status }),
    success: (saved) =>
      saved.status === "blocked" ? `${saved.name} مسدود شد` : `${saved.name} دوباره می‌تواند وارد شود`,
    toastFailure: false,
    onSuccess: () => {
      setConfirmOpen(false);
      onDone();
    },
    // The person is gone (NOT_FOUND): the hook has toasted why and reloaded.
    onConflict: () => {
      setConfirmOpen(false);
      onDone();
    },
  });

  const blocked = user.status === "blocked";
  const protectedAccount = user.isSelf || user.role === "admin";
  const failureMessage = change.isPending ? undefined : (change.failure?.message ?? undefined);

  return (
    <section aria-label="مسدود کردن" className="rounded-2xl border border-destructive/40 p-4">
      {protectedAccount ? (
        <p className="text-sm text-muted-foreground">حساب مدیر مسدود نمی‌شود.</p>
      ) : blocked ? (
        /*===== Open Again =====*/
        <div className="flex flex-col gap-3">
          <FormAlert message={failureMessage} />
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-fit"
            disabled={change.isPending}
            onClick={() => {
              change.reset();
              change.run("active");
            }}
          >
            {change.isPending && <Spinner aria-hidden />}
            باز کردن حساب
          </Button>
        </div>
      ) : (
        /*===== Block =====*/
        <div className="flex flex-col gap-3">
          {!confirmOpen && <FormAlert message={failureMessage} />}
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:text-destructive sm:w-fit"
            onClick={() => {
              change.reset();
              setConfirmOpen(true);
            }}
          >
            مسدود کردن
          </Button>
        </div>
      )}

      {/*===== Confirm =====*/}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!change.isPending) setConfirmOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسدود کنیم؟</AlertDialogTitle>
            <AlertDialogDescription>
              <bdi>{user.name}</bdi> همین حالا از همه‌جا بیرون می‌رود و دیگر کد ورود نمی‌گیرد. اطلاعاتش (سگ‌ها و خریدها)
              می‌ماند و هر وقت بخواهی دوباره بازش می‌کنی.
              {user.role === "partner" &&
                " لینک و پورسانتش روشن می‌ماند؛ برای خاموش کردنشان او را در صفحه‌ی همکاران غیرفعال کن."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <FormAlert message={failureMessage} />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={change.isPending}>نه</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={change.isPending} onClick={() => change.run("blocked")}>
              {change.isPending && <Spinner aria-hidden />}
              بله، مسدود شود
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
