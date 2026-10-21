import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { COLUMN } from "~/routes/account_dog_form/column";

/*===== Dog Form Error =====*/
/**
 * What the page shows when it can't show the dog, inside the account shell (its header and way back stay on screen).
 * A dog that isn't there (a made-up id, or someone else's dog: the API answers both the same) gets the `sniff` dog
 * nosing along a short path, the scent gone cold; anything else gets the `sorry` dog. Words at the start, the stage at
 * the end (on phones the stage on top, about 12rem).
 */
export function DogFormError({ notFound }: { notFound: boolean }) {
  return (
    <section
      aria-labelledby="dog-form-error-title"
      className={cn(
        COLUMN,
        "grid grid-cols-[minmax(0,1fr)] items-center gap-y-6 pt-section-sm lg:grid-cols-12 lg:gap-x-12",
      )}
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-6">
        <h1 id="dog-form-error-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {notFound ? "این سگ پیدا نشد" : "فرم باز نشد"}
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          {notFound
            ? "شاید از حسابت برداشته شده."
            : "یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."}
        </p>
        <Link to="/account" className={buttonVariants({ variant: "solid", size: "lg", className: "mt-8" })}>
          سگ‌های من
        </Link>
      </div>

      {/*===== Stage =====*/}
      {/* Physical sides: the pieces are tied to the picture (he faces right). */}
      <div aria-hidden className="relative order-1 h-48 lg:order-2 lg:col-span-6 lg:h-[22rem]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_45%_78%,rgb(255_194_26/0.08),transparent)]" />
        <NightSky className="top-1 right-[6%] h-20 w-[42%] lg:top-4 lg:h-32" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />
        <MascotCut
          name="plants"
          className="lively-sway absolute bottom-[0.9rem] left-[4%] w-[15%] translate-y-[6%] lg:bottom-[1.2rem] lg:w-[13%]"
        />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute right-[4%] bottom-[0.9rem] w-[12%] translate-y-[6%] -scale-x-100 lg:bottom-[1.2rem] lg:w-[10%]"
        />
        {notFound ? (
          <MascotCut
            name="sniff"
            className="lively-breathe absolute bottom-[0.9rem] left-1/2 w-44 -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:w-[18rem]"
          />
        ) : (
          <MascotCut
            name="sorry"
            className="lively-breathe absolute bottom-[0.9rem] left-1/2 w-28 -translate-x-1/2 translate-y-[3%] lg:bottom-[1.2rem] lg:w-[14rem]"
          />
        )}
      </div>
    </section>
  );
}
