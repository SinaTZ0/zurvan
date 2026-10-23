import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { Payment } from "~/orpc/checkout/contract";
import type { Media } from "~/orpc/media/contract";
import type { MyRefund } from "~/orpc/refund/contract";
import { m } from "~/paraglide/messages";

import { PaymentSlip } from "./payment-slip";

/*===== Slips Section =====*/
/**
 * «رسیدها»: one paper slip per payment, newest first, in one column. The heading row stands straight on the newest slip:
 * the heading at the start, and at the end corner the `receipt` dog (the long receipt in his mouth) on the slip's top
 * edge, a bush either side and a pool of warm light, saying «این آخریشه!». He is in the row's flow, so the row is as tall
 * as he is and the heading, on its bottom edge, never runs under him. The other slips have no dog: a slip is paper on
 * the table, not a plate.
 *
 * He rises from behind the newest slip's edge with the page (`ap-receipt`, the clip moving with him) and his bubble pops
 * once he is up.
 */
export function SlipsSection({
  payments,
  refunds,
  photos,
}: {
  payments: readonly Payment[];
  refunds: readonly MyRefund[];
  photos: Readonly<Record<string, Media | null>>;
}) {
  return (
    <section aria-labelledby="slips-title" className="pt-6 lg:pt-16">
      {/*===== Heading and the Receipt Dog =====*/}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 pb-4">
          <h2 id="slips-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
            {m.account_purchases_slips_title()}
          </h2>
          <p className="mt-1 text-pretty text-muted-foreground">{m.account_purchases_slips_line()}</p>
        </div>

        {/* Physical sides: he faces right (towards the heading); the bush in front of him is the bigger one, and the
            bubble's tail (2.25rem in from its left edge) is aimed at his head, about 66% across him. On the English pages
            he stands at the right end, so the picture is mirrored and the bubble placed from the right instead. */}
        <div
          aria-hidden
          className="pointer-events-none relative z-10 me-3 w-20 shrink-0 translate-y-[3%] sm:me-8 sm:w-[6.5rem]"
        >
          <div className="relative ltr:-scale-x-100">
            <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[78%] w-[52%]" />
            <MascotCut name="plants" className="lively-sway-2 absolute right-[84%] bottom-0 w-[38%] -scale-x-100" />
            <div className="ap-receipt relative">
              <MascotCut name="receipt" className="lively-breathe block w-full" />
            </div>
          </div>
          <ChalkBubble
            tail="end"
            className="ap-receipt-pop absolute bottom-[calc(100%+0.2rem)] left-[calc(66%-2.25rem)] max-w-none whitespace-nowrap [--pop-origin:2.25rem_100%] ltr:right-[calc(66%-2.25rem)] ltr:left-auto ltr:origin-[calc(100%-2.25rem)_100%]!"
          >
            {m.account_purchases_slips_bubble()}
          </ChalkBubble>
        </div>
      </div>

      {/*===== Slips =====*/}
      <div className="flex flex-col gap-6 lg:gap-8">
        {payments.map((payment, index) => (
          <PaymentSlip
            key={payment.id}
            payment={payment}
            refunds={refunds.filter((entry) => entry.paymentId === payment.id)}
            photos={photos}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
