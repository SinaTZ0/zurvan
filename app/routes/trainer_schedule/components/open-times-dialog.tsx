import { useRevalidator } from "react-router";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "~/components/ui/drawer";
import { useIsMobile } from "~/hooks/use-mobile";
import { OpenTimesForm } from "~/routes/trainer_schedule/components/open-times-form";

const TITLE = "وقت باز کن";
const DESCRIPTION = "وقت‌هایی که مشتری می‌تواند برای ارزیابی رایگان رزرو کند. یک بار یا هر هفته.";

/*===== Open Times Dialog =====*/
/**
 * The open-times composer: a dialog on desktop, a bottom sheet on phones where a centred box would fight the
 * keyboard. After it opens something the week is reloaded in place.
 */
export function OpenTimesDialog({
  open,
  onOpenChange,
  today,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `YYYY-MM-DD` in Tehran. */
  today: string;
}) {
  const isMobile = useIsMobile();
  const revalidator = useRevalidator();

  const form = (
    <OpenTimesForm
      today={today}
      onOpened={() => {
        onOpenChange(false);
        void revalidator.revalidate();
      }}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down" showSwipeHandle>
        <DrawerContent>
          <DrawerHeader className="text-start!">
            <DrawerTitle className="text-xl font-extrabold">{TITLE}</DrawerTitle>
            <DrawerDescription className="text-start">{DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto p-4 pb-8">{form}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-4rem)] gap-6 overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{TITLE}</DialogTitle>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
