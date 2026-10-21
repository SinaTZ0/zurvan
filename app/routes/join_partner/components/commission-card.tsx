import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Commission Card =====*/
/**
 * The commission rules, as a raised grained plate at the end of the page's middle row. The percent is the Admin's
 * setting (read by the page's loader), so changing it there changes it here. Payment happens outside the app: the plate
 * says so, and the app only records whether it has been paid.
 *
 * The dog with the basket walks along the plate's top edge at its end corner (the first purchase), a bush either side
 * and a pool of warm light; he carries no bubble. His sides are physical: he is in the plate's left corner and his
 * picture looks to the right, at the words. The section's top padding is his headroom, and the same as the steps
 * board's beside it, so the two plates line up. The percent is a number of any width up to three digits: the big one
 * sits at the heading's end and wraps nothing.
 *
 * @param commissionPercent The commission percent in force (the Admin's setting).
 */
export function CommissionCard({ commissionPercent }: { commissionPercent: number }) {
  const percent = `${formatNumberFa(commissionPercent)}٪`;

  return (
    <section aria-labelledby="commission-title" className="relative flex flex-col pt-44 lg:pt-48">
      {/*------ Sky over the plate's headroom, beside the dog ------*/}
      <NightSky className="inset-x-0 top-6 h-24 lg:top-4 lg:h-28" />

      <div className="relative flex flex-1 flex-col rounded-4xl border border-border bg-card paper-grain p-6 shadow-[0_24px_50px_-24px_rgb(0_0_0/0.9)] sm:p-8">
        {/*------ The Dog on the Top Edge ------*/}
        <div aria-hidden className="absolute bottom-[calc(100%-0.2rem)] left-8 z-10 w-28 lg:w-32">
          <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_55%,rgb(255_194_26/0.08),transparent)]" />
          <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[88%] w-[40%] translate-y-[4%]" />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[88%] bottom-0 w-[46%] translate-y-[4%] -scale-x-100"
          />
          <MascotCut name="basket" className="lively-wiggle-late relative block w-full translate-y-[3%]" />
        </div>

        {/*------ Heading and the Percent ------*/}
        <h2 id="commission-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          کمیسیون چطوریه؟
        </h2>
        {/* The number is a decoration of rule one (which says it in words), so it is hidden from assistive tech. */}
        <p aria-hidden className="mt-1 font-display text-7xl leading-none font-black text-primary lg:text-8xl">
          {percent}
        </p>

        {/*------ The Rules ------*/}
        <ul className="mt-6 flex flex-1 flex-col">
          <CommissionItem>{percent} از مجموع دوره‌هایی که مشتری توی اولین خریدش می‌خره.</CommissionItem>
          <CommissionItem>فقط اولین خرید؛ از خریدهای بعدی همون مشتری چیزی نمی‌رسه.</CommissionItem>
          <CommissionItem>
            {HEAD_TRAINER.firstName} کمیسیون رو بیرون از سایت با واریز بانکی به شبات می‌ده و توی سایت «پرداخت شد»
            می‌زنه. تو هر کمیسیون رو پرداخت‌شده یا پرداخت‌نشده می‌بینی.
          </CommissionItem>
          <CommissionItem>اگه بعدش آموزش لغو بشه، کمیسیون برای تو می‌مونه.</CommissionItem>
        </ul>
      </div>
    </section>
  );
}

/** One line of the list, with a gold dot at its start and a hairline above all but the first. */
function CommissionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex flex-1 items-center gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
      <span className="text-pretty">{children}</span>
    </li>
  );
}
