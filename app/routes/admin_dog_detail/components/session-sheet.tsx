import { XIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "~/components/ui/sheet";
import { useAdminAction } from "~/hooks/use-admin-action";
import { useIsMobile } from "~/hooks/use-mobile";
import { client } from "~/orpc/client";
import type { AdminDog } from "~/orpc/dog/contract";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import type { LogbookEntry } from "~/orpc/logbook/contract";
import { SessionForm, type SessionInput } from "~/routes/admin_dog_detail/components/session-form";
import { SHEET_HEAD, SHEET_PLATE, SHEET_TITLE } from "~/routes/admin_dog_detail/surfaces";

/*===== Session Sheet =====*/
/**
 * «ثبت جلسه» and «ویرایش» for one session of the dog's diary, in a side sheet (a bottom sheet on phones), opened by
 * `?session=new` or `?session=<id>` so Back closes it. As the edit sheet does: the request lives here so the failure
 * outlives a re-render and the form starts fresh each time the sheet opens; saving toasts, refreshes the page and closes.
 */
export function SessionSheet({
  dog,
  enrollments,
  entry,
  publicRecordsAvailable,
  open,
  onClose,
}: {
  dog: AdminDog;
  enrollments: AdminEnrollment[];
  /** The session being corrected, or null for a new one. */
  entry: LogbookEntry | null;
  /** An owner can make a record public (approved wording exists), so the form offers the entry's «public» mark. */
  publicRecordsAvailable: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();

  /*------ Save ------*/
  const save = useAdminAction({
    mutationFn: (input: SessionInput) =>
      entry
        ? client.logbook.admin.update({ id: entry.id, ...input })
        : client.logbook.admin.add({ dogId: dog.id, ...input }),
    success: entry ? "جلسه اصلاح شد." : "جلسه ثبت شد.",
    toastFailure: false,
    onSuccess: () => close(),
    // The dog or the entry is gone (NOT_FOUND): the hook has toasted why and reloaded.
    onConflict: () => close(),
  });

  function close() {
    save.reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && !save.isPending && close()}>
      <SheetContent side={isMobile ? "bottom" : "left"} showCloseButton={false} className={SHEET_PLATE}>
        <header className={SHEET_HEAD}>
          <div className="min-w-0 flex-1">
            <SheetTitle className={SHEET_TITLE}>{entry ? "ویرایش جلسه" : "ثبت جلسه"}</SheetTitle>
            <SheetDescription className="mt-1 truncate text-sm">
              <bdi>{dog.name}</bdi>
            </SheetDescription>
          </div>
          <SheetClose
            disabled={save.isPending}
            render={<Button variant="ghost" size="icon-sm" aria-label="بستن" className="shrink-0" />}
          >
            <XIcon aria-hidden />
          </SheetClose>
        </header>

        {/* Keyed by the entry, so editing another session starts from its own text. */}
        <SessionForm
          key={entry?.id ?? "new"}
          entry={entry}
          publicRecordsAvailable={publicRecordsAvailable}
          enrollments={enrollments}
          isPending={save.isPending}
          failure={save.failure}
          onSubmit={(input) => {
            save.reset();
            save.run(input);
          }}
          onCancel={close}
        />
      </SheetContent>
    </Sheet>
  );
}
