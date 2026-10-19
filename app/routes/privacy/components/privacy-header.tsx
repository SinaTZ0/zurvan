import { SpeechBubble } from "~/components/speech-bubble";

/*===== Privacy Header =====*/
/**
 * The page's top: the headline, one line on what the page covers, and the lying German shepherd photo band. The dog's
 * bubble sits over the photo's dark end on desktop and drops under the band on phones, its tail pointing up at the dog.
 * The bubble is drawn once on load (`drawIn`), the page's one orchestrated moment; reduced motion shows it finished.
 */
export function PrivacyHeader() {
  return (
    <section aria-labelledby="privacy-title" className="site-container pt-section-sm">
      <div className="max-w-2xl">
        <h1 id="privacy-title" className="font-display text-h1 font-black text-balance">
          از من و تو چی نگه می‌دارن؟
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          اینجا ساده نوشتیم چی ذخیره می‌شه، کی می‌بینه و چی رو خودت می‌تونی عوض کنی.
        </p>
      </div>

      {/*------ Photo Band ------*/}
      <div className="mt-10">
        <div className="relative overflow-hidden rounded-4xl border border-border">
          <picture>
            <source media="(min-width: 64rem)" srcSet="/photo/home/hero-1536.webp" />
            <img
              src="/photo/home/hero-900.webp"
              alt="یک ژرمن‌شپرد روی مبل چرمی دراز کشیده و مستقیم به دوربین نگاه می‌کند"
              width={1536}
              height={1024}
              decoding="async"
              className="h-48 w-full object-cover object-[24%_30%] lg:h-72 lg:object-[20%_57%]"
            />
          </picture>

          {/* Desktop: over the photo's dark end, the tail pointing back at the dog. */}
          <SpeechBubble
            drawIn
            tail="bottom-end"
            className="absolute start-8 top-1/2 max-w-[16rem] -translate-y-1/2 max-lg:hidden"
          >
            ببین چی رو نگه می‌دارن؛ همه‌ش اینجا نوشته.
          </SpeechBubble>
        </div>

        {/* Phones: the same bubble under the band, its tail pointing up at the dog. */}
        <div className="mt-6 flex justify-end lg:hidden">
          <SpeechBubble drawIn tail="top-end" className="max-w-[16rem]">
            ببین چی رو نگه می‌دارن؛ همه‌ش اینجا نوشته.
          </SpeechBubble>
        </div>
      </div>
    </section>
  );
}
