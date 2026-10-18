import { SpeechBubble } from "~/components/speech-bubble";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Help Header =====*/
/**
 * The page's top: the headline and one line of help, with the Malinois from the auth page beside them. Its bubble is
 * the page's key fact, "pay first, then he calls", and its outline drawing in is the page's one orchestrated moment.
 *
 * Desktop: words at the start, the framed photo at the end, the bubble over the photo's dark end with its tail across
 * at the dog. Phones: the photo on top and the bubble under it with the tail pointing up at the dog, then the words.
 */
export function HelpHeader() {
  return (
    <section
      aria-labelledby="help-title"
      className="site-container grid items-center gap-y-6 pt-section-sm pb-section-sm lg:grid-cols-12 lg:gap-x-12"
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1 lg:col-span-7">
        <h1 id="help-title" className="font-display text-h1 font-black text-balance">
          هر چی می‌خوای بدونی، همین‌جاست
        </h1>
        <p className="mt-4 max-w-md text-lead text-pretty text-muted-foreground">
          از ارزیابی رایگان تا روزی که دوره تموم می‌شه. جوابتو پیدا نکردی؟ زنگ بزن.
        </p>
      </div>

      {/*===== Photo and Bubble =====*/}
      <div className="relative order-1 md:max-w-lg lg:order-2 lg:col-span-5 lg:max-w-none">
        <div className="overflow-hidden rounded-4xl border border-border">
          <picture>
            <source media="(min-width: 64rem)" srcSet="/photo/home/hero-2-1536.webp" />
            <img
              src="/photo/home/hero-2-900.webp"
              alt="یک مالینویز با قلاده‌ی چرمی، شب کنار خیابان نشسته و به دوربین نگاه می‌کند"
              width={900}
              height={600}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/3] w-full object-cover object-[8%_50%] lg:object-[0%_40%]"
            />
          </picture>
        </div>

        {/*------ Bubble ------*/}
        {/* Phones: under the photo, overlapping its dark bottom edge, the tail up at the dog. Desktop: it moves onto the
            photo's dark end (the start side) and its tail points across at the dog. */}
        <div className="relative -mt-8 ps-4 lg:static lg:mt-0 lg:ps-0">
          <SpeechBubble
            drawIn
            tail="top-end"
            lgTail="bottom-end"
            className="max-w-[16rem] sm:max-w-xs lg:absolute lg:start-5 lg:top-[14%] lg:max-w-[15rem] xl:start-6"
          >
            بعد از ثبت درخواستت، {HEAD_TRAINER.firstName} باهات تماس می‌گیره.
          </SpeechBubble>
        </div>
      </div>
    </section>
  );
}
