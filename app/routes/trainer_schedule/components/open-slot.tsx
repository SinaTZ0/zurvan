import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { ScheduleSlot } from "~/orpc/assessment/contract";
import { client } from "~/orpc/client";

/*===== Open Slot =====*/
/**
 * A time nobody has booked: a dashed box with the time and «باز». «ببند» appears on hover and focus (always, on touch)
 * and asks again in place, so closing a time never takes a dialog.
 */
export function OpenSlot({ slot }: { slot: ScheduleSlot }) {
  const [confirming, setConfirming] = useState(false);
  const revalidator = useRevalidator();

  const close = useMutation({
    mutationFn: () => client.assessment.trainer.closeSlot({ slotId: slot.id }),
    onSuccess: async () => {
      toast.add({ title: "وقت بسته شد.", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      // Usually NOT_OPEN: someone booked it a moment ago. The reload shows it as booked.
      toast.add({
        title: describeApiFailure({ error, fallback: "بسته نشد. دوباره امتحان کن." }).message,
        type: "error",
      });
      setConfirming(false);
      await revalidator.revalidate();
    },
  });

  const label = `${formatSlotDay(slot.startsAt)}، ${formatSlotTime(slot.startsAt)}`;

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-destructive/50 px-3 py-2.5">
        <p className="text-sm font-bold">
          <span className="tabular-nums">{formatSlotTime(slot.startsAt)}</span> بسته شود؟
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="xs"
            disabled={close.isPending}
            onClick={() => close.mutate()}
          >
            {close.isPending && <Spinner data-icon="inline-start" />}
            ببند
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={close.isPending}
            onClick={() => setConfirming(false)}
          >
            نه
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2 transition-colors focus-within:border-primary/50 hover:border-primary/50">
      <p className="flex items-baseline gap-2">
        <time dateTime={slot.startsAt.toISOString()} className="font-bold tabular-nums">
          {formatSlotTime(slot.startsAt)}
        </time>
        <span className="text-xs text-muted-foreground">باز</span>
      </p>
      <button
        type="button"
        aria-label={`بستن وقت ${label}`}
        onClick={() => setConfirming(true)}
        className="rounded-sm px-1.5 py-1 text-xs font-bold text-muted-foreground opacity-0 transition-[opacity,color] outline-none group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:opacity-100"
      >
        ببند
      </button>
    </div>
  );
}
