import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { ChalkTicks } from "~/components/chalk-ticks";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { PURCHASES_PATH } from "~/orpc/checkout/constants";
import { FADED_ENDS, PLATE } from "~/routes/account_cart/column";
import { NextRoad } from "~/routes/account_cart/components/next-road";

/*===== Payment Banner =====*/
/**
 * The gateway's result (F5), the page's one orchestrated moment.
 *
 * - **paid:** a big plate lit warm: the center's dog leaps for joy up off the path and lands (`ct-leap`), his bubble and
 *   chalk ticks pop as he lands; the plain line (an `<output>`), the two ways on, and «بعدش چی می‌شه؟» as a road that
 *   draws itself on. The cart body isn't shown under it (the server took the bought items out).
 * - **failed:** a calmer plate: the sorry dog rises from behind the path, his bubble pops; the plain line says the cart
 *   is as it was, and the bags are right below with «پرداخت».
 *
 * The dogs' words are decoration; the `<output>` says the result in plain words.
 */
export function PaymentBanner({ result }: { result: "paid" | "failed" }) {
  return result === "paid" ? <PaidBanner /> : <FailedBanner />;
}

/*===== Paid =====*/
function PaidBanner() {
  return (
    <section
      aria-label="نتیجه‌ی پرداخت"
      className={cn(
        PLATE,
        "relative overflow-hidden border-primary/25 px-5 pt-5 pb-8 sm:px-8 lg:px-10 lg:pb-10",
        "bg-[radial-gradient(ellipse_60%_70%_at_25%_70%,rgb(255_194_26/0.08),transparent)]",
      )}
    >
      <div className="grid gap-y-4 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        {/*===== The Leap =====*/}
        {/* Physical sides: he leaps rightwards, towards the words; his head is 85% in from his left. */}
        <div aria-hidden className="relative h-56 lg:order-2 lg:col-span-5 lg:h-[19rem]">
          <NightSky className="inset-x-[8%] top-1 h-16 lg:top-4 lg:h-24" />
          <GroundStrip className={cn("absolute -inset-x-4 bottom-0 h-7 lg:h-9", FADED_ENDS)} />
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute bottom-[0.9rem] left-[6%] w-14 translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-20"
          />
          <MascotCut
            name="plants"
            className="lively-sway absolute right-[4%] bottom-[0.9rem] w-16 translate-y-[6%] lg:bottom-[1.2rem] lg:w-24"
          />
          <div className="absolute bottom-[2rem] left-1/2 w-44 -translate-x-[55%] sm:w-52 lg:bottom-[2.6rem] lg:w-[16rem]">
            <div className="ct-leap">
              <MascotCut name="jump" className="lively-breathe block w-full" />
            </div>
            <ChalkTicks className="answer-pop absolute top-[4%] left-[95%] size-7 [--answer-delay:1s] lg:size-9" />
            <ChalkBubble
              tail="right"
              className="answer-pop absolute right-[calc(15%-2.25rem)] bottom-[102%] text-pretty [--answer-delay:0.95s] [--pop-origin:calc(100%-2.25rem)_100%]"
            >
              یاهو! پرداخت شد
            </ChalkBubble>
          </div>
        </div>

        {/*===== Words =====*/}
        <div className="lg:order-1 lg:col-span-7 lg:self-center lg:py-8">
          <output className={cn(DISPLAY_HEADING, "block max-w-xl text-3xl text-balance lg:text-4xl")}>
            پرداخت انجام شد؛ برای هماهنگی باهات تماس می‌گیریم.
          </output>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={PURCHASES_PATH}
              className={buttonVariants({ variant: "solid", size: "lg", className: "sm:min-w-48" })}
            >
              دیدن خریدها
            </Link>
            <Link to="/account" className={buttonVariants({ variant: "outline", size: "lg" })}>
              سگ‌های من
            </Link>
          </div>
        </div>
      </div>

      {/*===== What Happens Next =====*/}
      <div className="mt-8 border-t border-dashed border-foreground/20 pt-8">
        <h2 className="mb-6 text-xl font-extrabold">بعدش چی می‌شه؟</h2>
        <NextRoad />
      </div>
    </section>
  );
}

/*===== Failed =====*/
function FailedBanner() {
  return (
    <section aria-label="نتیجه‌ی پرداخت" className={cn(PLATE, "overflow-hidden px-5 pt-5 sm:px-8 lg:px-10")}>
      <div className="grid gap-y-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/*===== The Sorry Dog =====*/}
        {/* Physical sides: his bubble's tail (left, 1.75rem in) on his head; a bush either side. */}
        <div aria-hidden className="relative h-52 sm:order-2 lg:h-60">
          <GroundStrip className={cn("absolute -inset-x-4 bottom-0 h-7 lg:h-9", FADED_ENDS)} />
          <div className="absolute bottom-[0.9rem] left-[38%] w-24 -translate-x-1/2 lg:bottom-[1.2rem] lg:w-28">
            <MascotCut
              name="plants"
              className="lively-sway-2 absolute right-[88%] bottom-0 w-[55%] translate-y-[6%] -scale-x-100"
            />
            <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[80%] w-[48%] translate-y-[6%]" />
            <div className="ct-up relative translate-y-[3%]">
              <MascotCut name="sorry" className="lively-breathe block w-full" />
            </div>
            <ChalkBubble
              tail="left"
              className="answer-pop absolute bottom-[96%] left-[30%] w-max max-w-[11rem] text-pretty [--answer-delay:0.7s] [--pop-origin:1.75rem_100%] lg:max-w-[16rem]"
            >
              این‌بار نشد… سبدم سر جاشه
            </ChalkBubble>
          </div>
        </div>

        {/*===== Words =====*/}
        <div className="pb-6 sm:order-1 sm:self-center sm:py-6">
          <output className={cn(DISPLAY_HEADING, "block max-w-lg text-2xl text-balance lg:text-3xl")}>
            پرداخت انجام نشد و سبدت همون‌طور مونده.
          </output>
          <p className="mt-2 text-pretty text-muted-foreground">هر وقت خواستی دوباره «پرداخت» رو بزن.</p>
        </div>
      </div>
    </section>
  );
}
