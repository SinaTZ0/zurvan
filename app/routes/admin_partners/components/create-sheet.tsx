import { cn } from "cn";
import { XIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "~/components/ui/sheet";
import { useAdminAction } from "~/hooks/use-admin-action";
import { useIsMobile } from "~/hooks/use-mobile";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { client } from "~/orpc/client";
import type { AdminPartner } from "~/orpc/partner/contract";
import { CreateForm } from "~/routes/admin_partners/components/create-form";
import { SHEET_PLATE } from "~/routes/admin_partners/dialog-plate";
import type { CreatePartnerValues } from "~/routes/admin_partners/schema";

/*===== Create Sheet =====*/
/**
 * «همکار تازه»: opens a partner's account, from `?new=1` so Back closes it. It is not `ui/drawer`, which positions
 * physically and is wrong in RTL. The request lives here, outside the sheet's body, so a failure outlives a re-render
 * and the form (which unmounts when the sheet closes) starts empty each time it opens.
 *
 * Creating toasts, refreshes the page's data and hands the new partner to the page, which opens his file. No SMS is
 * sent (F9 has no such event): the Admin phones him.
 */
export function CreateSheet({
  open,
  siteOrigin,
  onClose,
  onCreated,
}: {
  open: boolean;
  siteOrigin: string;
  onClose: () => void;
  onCreated: (partner: AdminPartner) => void;
}) {
  const isMobile = useIsMobile();

  /*------ Create ------*/
  const create = useAdminAction({
    mutationFn: (values: CreatePartnerValues) =>
      client.partner.admin.create({
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        // Blank means "generate one"; the server also reads an empty string that way, but omitting it is plainer.
        code: values.code === "" ? undefined : values.code,
      }),
    success: "حساب همکار ساخته شد",
    // The form shows the failure itself (fields and alert), so a toast would say it twice.
    toastFailure: false,
    // The hook has already cleared the failure by now.
    onSuccess: (partner) => onCreated(partner),
  });

  function close() {
    create.reset();
    onClose();
  }

  return (
    // A request in flight can't be dismissed: closing would hide whether it worked.
    <Sheet open={open} onOpenChange={(next) => !next && !create.isPending && close()}>
      <SheetContent side={isMobile ? "bottom" : "left"} showCloseButton={false} className={SHEET_PLATE}>
        {/*===== Head (fixed) =====*/}
        <header className={cn("flex items-start gap-3 border-b-2 p-5", ADMIN_TEAR)}>
          <div className="min-w-0 flex-1">
            <SheetTitle className={cn(DISPLAY_HEADING, "text-xl")}>همکار تازه</SheetTitle>
            <SheetDescription className="mt-1.5">حساب و لینک همکار رو این‌جا می‌سازی.</SheetDescription>
          </div>
          <SheetClose
            disabled={create.isPending}
            render={<Button variant="ghost" size="icon-sm" aria-label="بستن" className="-me-1 shrink-0" />}
          >
            <XIcon aria-hidden />
          </SheetClose>
        </header>

        <CreateForm
          siteOrigin={siteOrigin}
          isPending={create.isPending}
          failure={create.failure}
          onSubmit={(values) => {
            // A new attempt starts clean: the last failure's alert must not sit beside a request in flight.
            create.reset();
            create.run(values);
          }}
          onCancel={close}
        />
      </SheetContent>
    </Sheet>
  );
}
