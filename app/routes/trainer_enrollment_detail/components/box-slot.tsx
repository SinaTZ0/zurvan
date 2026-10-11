import { useState } from "react";

import { SessionBox, type SessionBoxData } from "~/components/session-card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "~/components/ui/drawer";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "~/components/ui/popover";
import { useIsMobile } from "~/hooks/use-mobile";
import { formatNumberFa } from "~/lib/digits";
import { SESSION_STATUS_LABELS } from "~/orpc/enrollment/constants";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { SessionEditor, type EditDone } from "~/routes/trainer_enrollment_detail/components/session-editor";
import { formatSessionWhen } from "~/routes/trainer_enrollment_detail/format";

const TRIGGER_CLASS =
  "rounded-lg outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/** What a screen reader hears for the button around a box. */
function boxLabel(box: SessionBoxData): string {
  const position = `جلسه‌ی ${formatNumberFa(box.index + 1)}`;
  if (!box.session) return `${position}: هنوز زمان‌بندی نشده. زمان بگذار`;
  return `${position}: ${SESSION_STATUS_LABELS[box.session.status]}، ${formatSessionWhen(box.session.startsAt)}`;
}

/*===== Box Slot =====*/
/**
 * One box of the editable card, as the trigger of its own editor: a popover beside the box on desktop, a bottom sheet
 * on phones where a small floating box would fight the keyboard. A box nothing can be done with (a scheduled one on a
 * finished course) is drawn but is not a button.
 *
 * @param punchKey Passed to the box so a session just marked held presses its hole in once.
 */
export function BoxSlot({
  box,
  enrollment,
  punchKey,
  onDone,
}: {
  box: SessionBoxData;
  enrollment: TrainerEnrollment;
  punchKey?: string;
  onDone: (done: EditDone) => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const used = box.state === "held" || box.state === "missed";
  const editable = used || enrollment.canSchedule;
  const drawing = <SessionBox box={box} size="full" punchKey={punchKey} />;
  if (!editable) return drawing;

  const title = `جلسه‌ی ${formatNumberFa(box.index + 1)}`;
  const editor = (
    <SessionEditor
      enrollment={enrollment}
      box={box}
      onDone={(done) => {
        setOpen(false);
        onDone(done);
      }}
    />
  );

  /*------ Phone ------*/
  if (isMobile) {
    return (
      <>
        <button type="button" aria-label={boxLabel(box)} onClick={() => setOpen(true)} className={TRIGGER_CLASS}>
          {drawing}
        </button>
        <Drawer open={open} onOpenChange={setOpen} swipeDirection="down" showSwipeHandle>
          <DrawerContent>
            <DrawerHeader className="text-start!">
              <DrawerTitle className="text-xl font-extrabold">{title}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-4 pb-8">{editor}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  /*------ Desktop ------*/
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" aria-label={boxLabel(box)} className={TRIGGER_CLASS} />}>
        {drawing}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="max-h-[calc(100dvh-4rem)] w-88 gap-4 overflow-y-auto p-4">
        <PopoverTitle className="text-base font-extrabold">{title}</PopoverTitle>
        {editor}
      </PopoverContent>
    </Popover>
  );
}
