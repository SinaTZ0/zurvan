import { useMemo } from "react";

import type { AvailableSlot } from "~/orpc/assessment/contract";
import { NotCustomerPanel, SignInPanel } from "~/routes/assessment/components/access-panels";
import { BookingPart } from "~/routes/assessment/components/booking-part";
import { Diary } from "~/routes/assessment/components/diary";
import { groupSlotsByDay } from "~/routes/assessment/slots";

/*===== Visitor Booking =====*/
/**
 * Everyone who can't book yet: a visitor who is signed out, or a signed-in trainer, partner or Admin. The diary stays
 * readable, because real free times are the best reason to sign in. The panel comes first in the DOM, so phones read
 * it before the diary; on desktop it takes the end column, where the slip would be.
 */
export function VisitorBooking({
  slots,
  viewer,
  signInHref,
}: {
  slots: readonly AvailableSlot[];
  viewer: { kind: "guest" } | { kind: "other"; isTrainer: boolean };
  signInHref: string;
}) {
  const days = useMemo(() => groupSlotsByDay(slots), [slots]);

  return (
    <div className="site-container grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 pt-10 pb-16 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-20 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1 lg:self-start">
        {viewer.kind === "guest" ? (
          <SignInPanel signInHref={signInHref} />
        ) : (
          <NotCustomerPanel isTrainer={viewer.isTrainer} />
        )}
      </div>

      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <BookingPart title="وقت‌های آزاد آرمان" description="ساعت‌ها به وقت تهران است.">
          <Diary mode="readonly" days={days} signInHref={signInHref} />
        </BookingPart>
      </div>
    </div>
  );
}
