import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { DIALOG_FOOTER, DIALOG_PLATE, DIALOG_TITLE, INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

/*===== Leave Dialog =====*/
/**
 * Asked when she leaves the form (a link, the rail, Back) with changes that aren't saved: staying is the default and
 * the main button, since a long text is the one thing here that can't be typed again in a minute. Closing a tab or
 * reloading gets the browser's own question instead (`useBlocker`'s `enableBeforeUnload`).
 */
export function LeaveDialog({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onStay()}>
      <AlertDialogContent className={`${DIALOG_PLATE} data-[size=default]:sm:max-w-md`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={DIALOG_TITLE}>تغییرها ذخیره نشدن</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-pretty">
            اگه از این صفحه بری، هر چی از آخرین ذخیره نوشتی پاک می‌شه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={DIALOG_FOOTER}>
          {/* An action, not the dialog's Close: closing means staying (`onOpenChange`), and only one answer may run. */}
          <AlertDialogAction variant="outline" className={INK_OUTLINE} onClick={onLeave}>
            برو، ذخیره نکن
          </AlertDialogAction>
          <AlertDialogAction variant="solid" onClick={onStay}>
            بمونم
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
