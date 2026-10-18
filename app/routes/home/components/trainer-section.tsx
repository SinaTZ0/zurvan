import { AwardIcon, CalendarHeartIcon, GiftIcon, MapPinnedIcon } from "lucide-react";

import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { ChalkDoodle } from "~/components/chalk-doodle";
import { SpeechBubble } from "~/components/speech-bubble";

/*===== Trainer Section =====*/
/**
 * The head trainer and founder, introduced by their dog. They are the only trainer the home page introduces. The one
 * wide photo band below the hero: Tala laughing while a German shepherd licks their cheek, with the dog's line over the
 * photo's dark end. Credentials come from the owner's business card; the photo remains illustrative. No button here: the
 * free assessment is asked for in the hero, the quick actions, the evaluation panel and the closing banner.
 */
export function TrainerSection() {
  const points = [
    { icon: CalendarHeartIcon, label: `${formatNumberFa(HEAD_TRAINER.years)} سال سابقه و تجربه‌ی حرفه‌ای` },
    { icon: AwardIcon, label: HEAD_TRAINER.credential },
    { icon: MapPinnedIcon, label: `فعال در ${CENTER_SERVICE_AREA}` },
    { icon: GiftIcon, label: "قبل از هر دوره، یه ارزیابی رایگان" },
  ];

  return (
    <section id="trainer" aria-labelledby="trainer-title" className="site-container scroll-mt-24 pt-section-lg">
      <div className="grid items-center gap-gutter lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
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

          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <Icon aria-hidden strokeWidth={1.5} className="size-7 shrink-0 text-primary" />
                <span className="font-bold">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/*===== Photo =====*/}
        <div className="relative order-1 lg:order-2">
          <div className="overflow-hidden rounded-4xl border border-border">
            <picture>
              <source media="(min-width: 64rem)" srcSet="/photo/home/trainer-1536.webp" />
              <img
                src="/photo/home/trainer-900.webp"
                alt={`${HEAD_TRAINER.firstName} روی زمین نشسته و می‌خندد، ژرمن‌شپردش گونه‌اش را می‌لیسد`}
                width={1536}
                height={1024}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover object-[30%_50%] lg:aspect-[3/2]"
              />
            </picture>
          </div>

          {/* Over the photo's dark start third, the tail pointing back at the dog. */}
          <SpeechBubble
            tail="bottom-end"
            className="absolute start-4 top-4 max-w-[13rem] sm:start-8 sm:top-8 sm:max-w-[16rem]"
          >
            هر بار که {HEAD_TRAINER.firstName} میاد کلی چیز یاد می‌گیرم، بعدشم بازی!
          </SpeechBubble>
          <ChalkDoodle name="heart" className="absolute start-10 -bottom-5 w-12 rotate-12 opacity-90 max-lg:hidden" />
        </div>
      </div>
    </section>
  );
}
