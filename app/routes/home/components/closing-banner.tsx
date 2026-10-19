import { cn } from "cn";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ChalkDoodle } from "~/components/chalk-doodle";
import { SpeechBubble } from "~/components/speech-bubble";

/*===== Closing Banner =====*/
/**
 * The last ask: make an account, the first step of the way (the free assessment is asked for higher up). A German
 * shepherd peeks up over the bottom edge of the band, ears first, as if over the edge of the page, and asks whether
 * we're starting. The photo's top third is empty black, so the words sit there with no box.
 *
 * The photo is shown whole, never cropped to a band: a crop cut through the ears and left a hard edge under the words.
 * On wide screens it stops at a width where the head still fits under the words, and its sides fade into the page.
 */
export function ClosingBanner() {
  return (
    <section aria-labelledby="closing-title" className="relative isolate mt-section-md overflow-hidden bg-jet">
      {/*------ Words ------*/}
      <div className="relative z-10 site-container flex flex-col items-center pt-section-sm text-center">
        <h2 id="closing-title" className="font-display text-h1 font-black text-balance">
          یه قدم تا یه زندگی بهتر
        </h2>
        <p className="mt-3 max-w-md text-pretty text-muted-foreground">
          با یه حساب شروع می‌شه؛ بعدش منو معرفی کن، فقط کافیه بگی من کی‌ام.
        </p>
        <Link to="/auth" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
          ثبت‌نام و معرفی سگ
        </Link>
      </div>

      {/*------ Photo ------*/}
      {/* From `sm` up, pulled under the words by part of its empty top (the top 30% of the photo is black), so the
          ears start just below the button. Phones crop it a little closer, so the head isn't tiny, and keep all of
          the black top for the bubble. */}
      <div className="relative mx-auto mt-4 max-w-[72rem] sm:-mt-16 lg:-mt-36">
        <picture>
          <source media="(min-width: 64rem)" srcSet="/photo/home/peek-1536.webp" />
          <img
            src="/photo/home/peek-900.webp"
            alt="یک ژرمن‌شپرد از لبه‌ی میز سرک می‌کشد؛ فقط گوش‌ها، چشم‌ها و پنجه‌هایش پیداست"
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            className="block aspect-[5/4] w-full object-cover object-bottom sm:aspect-auto sm:h-auto lg:[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          />
        </picture>

        {/*------ Bubble ------*/}
        {/* In the black beside the dog's head, at the start, its tail curling down toward the ear. */}
        <SpeechBubble
          tail="bottom-end"
          className="absolute start-[2%] top-0 max-w-[15rem] sm:top-[6%] sm:max-w-[12rem] lg:start-[4%] lg:top-[36%] lg:max-w-[15rem]"
        >
          آماده‌ای شروع کنیم؟ من که مشتاقم!
        </SpeechBubble>
        <ChalkDoodle
          name="paw"
          className="absolute end-[16%] top-[28%] w-10 -rotate-12 opacity-80 max-sm:hidden lg:w-14"
        />
      </div>
    </section>
  );
}
