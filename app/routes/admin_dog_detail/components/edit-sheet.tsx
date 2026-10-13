import { XIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "~/components/ui/sheet";
import { useAdminAction } from "~/hooks/use-admin-action";
import { useIsMobile } from "~/hooks/use-mobile";
import { client } from "~/orpc/client";
import type { AdminDog } from "~/orpc/dog/contract";
import { EditForm, type DogUpdateInput } from "~/routes/admin_dog_detail/components/edit-form";

/*===== Edit Sheet =====*/
/**
 * «ویرایش مشخصات»: the dog's details in a side sheet (a bottom sheet on phones), opened by `?edit=true` so Back closes
 * it. It is not `ui/drawer`, which positions physically and is wrong in RTL. The request lives here, outside the
 * sheet's body, so the failure outlives a re-render and the form (which unmounts when the sheet closes) starts fresh
 * each time it opens.
 *
 * Saving toasts, refreshes the page's data and closes; a failure stays in the form with the input kept.
 */
export function EditSheet({ dog, open, onClose }: { dog: AdminDog; open: boolean; onClose: () => void }) {
  const isMobile = useIsMobile();

  /*------ Save ------*/
  const save = useAdminAction({
    mutationFn: (input: DogUpdateInput) => client.dog.admin.update(input),
    success: (saved) => `مشخصات ${saved.name} ذخیره شد.`,
    // The form shows the failure itself (fields and alert), so a toast would say it twice.
    toastFailure: false,
    onSuccess: () => close(),
    // The dog is gone (NOT_FOUND): the hook has toasted why and reloaded, which turns the page into its 404.
    onConflict: () => close(),
  });

  function close() {
    save.reset();
    onClose();
  }

  return (
    // A save in flight can't be dismissed: closing would hide whether it worked.
    <Sheet open={open} onOpenChange={(next) => !next && !save.isPending && close()}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        showCloseButton={false}
        className="gap-0 p-0 data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-3xl data-[side=left]:w-full data-[side=left]:sm:max-w-md"
      >
        {/*===== Header (fixed) =====*/}
        <header className="flex items-center gap-3 border-b border-border p-4">
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-lg font-extrabold">ویرایش مشخصات</SheetTitle>
            <SheetDescription className="mt-0.5 truncate text-xs">
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

        <EditForm
          dog={dog}
          isPending={save.isPending}
          failure={save.failure}
          onSubmit={(input) => {
            // A new attempt starts clean: the last failure's alert must not sit beside a request in flight.
            save.reset();
            save.run(input);
          }}
          onCancel={close}
        />
      </SheetContent>
    </Sheet>
  );
}
