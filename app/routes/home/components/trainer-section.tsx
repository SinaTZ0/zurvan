import { HEAD_TRAINER } from "~/lib/head-trainer";
import { ChalkDoodle } from "~/components/chalk-doodle";
import { SpeechBubble } from "~/components/speech-bubble";
import { TrainerFacts } from "~/components/trainer-facts";

/*===== Trainer Section =====*/
/**
 * The head trainer and founder, introduced by their dog. They are the only trainer the home page introduces. A portrait
 * photo of Tala crouched beside the dog (the owner's own, `HEAD_TRAINER.photos.withDog`) with the dog's line under it,
 * in a bubble whose tail points up at the dog: the photo's corners hold banners and logos, so nothing is laid over
 * it. Credentials come from the owner's business card (the same three facts as the About page). No button and no
 * line about the free assessment here: it is asked for in the hero, the quick actions and the evaluation panel.
 */
export function TrainerSection() {
  return (
    <section id="trainer" aria-labelledby="trainer-title" className="site-container scroll-mt-24 pt-section-lg">
      <div className="grid items-center gap-gutter lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
        {/*===== Words =====*/}
        <div className="order-2 lg:order-1">
          <h2 id="trainer-title" className="font-display text-h1 font-black text-balance">
            این {HEAD_TRAINER.firstName}ـه، مربی من
          </h2>
          <p className="mt-2 font-bold text-primary">
            {HEAD_TRAINER.name}، {HEAD_TRAINER.role}
          </p>
          <p className="mt-4 max-w-lg text-pretty text-muted-foreground">
            {HEAD_TRAINER.firstName} زروان رو راه انداخته و ارزیابی اولمون رو خودش انجام می‌ده. توی آموزش سگ‌ها از
            آموزش‌های پایه و عمومی تا دوره‌های تخصصی، نگهبانی، ورزشی و سطوح مسابقاتی کار می‌کنه.
          </p>

          <TrainerFacts />
        </div>

        {/*===== Photo =====*/}
        <div className="relative order-1 lg:order-2">
          <div className="overflow-hidden rounded-4xl border border-border">
            {/* The frame is 6:7 and the picture 2:3: `object-top` keeps both faces and the harness and stops above the
                trouser leg, where the lettering in the original is garbled (the owner's call whether to keep it). */}
            <img
              src={HEAD_TRAINER.photos.withDog.src}
              srcSet={HEAD_TRAINER.photos.withDog.srcSet}
              sizes="(min-width: 64rem) 35rem, 100vw"
              alt={HEAD_TRAINER.photos.withDog.alt}
              width={HEAD_TRAINER.photos.withDog.width}
              height={HEAD_TRAINER.photos.withDog.height}
              loading="lazy"
              decoding="async"
              className="aspect-[6/7] w-full object-cover object-top"
            />
          </div>

          {/* Under the photo, at the dog's side (the start side); the tail points up at the dog. */}
          <div className="mt-5 flex justify-start">
            <SpeechBubble tail="top-start" className="max-w-[16rem]">
              هر بار که {HEAD_TRAINER.firstName} میاد کلی چیز یاد می‌گیرم، بعدشم بازی!
            </SpeechBubble>
          </div>
          <ChalkDoodle name="heart" className="absolute end-8 -bottom-4 w-12 -rotate-12 opacity-90 max-lg:hidden" />
        </div>
      </div>
    </section>
  );
}
