import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { FandoghBubble } from "~/routes/design_lab/components/fandogh/fandogh-bubble";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

/*===== Fandogh Trainer =====*/
/**
 * The grown-up section: ink background, the real photo, the real facts, no cartoon beyond a small introduction.
 * Fandogh only hands the floor over; he doesn't dress the expert up.
 */
export function FandoghTrainer() {
  const photo = HEAD_TRAINER.photos.withDog;

  return (
    <section aria-labelledby="fd-trainer-title" className="bg-[var(--fd-ink)] py-16 text-white sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[auto_1fr] lg:gap-16">
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="(min-width: 1024px) 380px, 80vw"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          className="mx-auto aspect-[2/3] w-[80vw] max-w-sm rounded-[2rem] object-cover lg:mx-0 lg:w-[380px]"
        />
        <div>
          <div className="flex items-center gap-4">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
              <img
                src="/photo/design-lab/fandogh-2.webp"
                alt=""
                width={610}
                height={610}
                loading="lazy"
                className="size-full scale-125 object-cover object-top"
              />
            </span>
            <FandoghBubble tone="sky" tail="top-end" className="text-base">
              این مربی‌ی من است. حرف‌های بعدی را به خودش می‌سپارم.
            </FandoghBubble>
          </div>

          <h2 id="fd-trainer-title" className="mt-10 font-['Lalezar'] text-4xl leading-snug sm:text-5xl">
            {HEAD_TRAINER.name}
          </h2>
          <p className="mt-2 text-xl font-semibold text-[var(--fd-sky)]">{HEAD_TRAINER.role}</p>

          <dl className="mt-8 grid max-w-xl gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-2">
            <div className="bg-[var(--fd-ink)] p-5">
              <dt className="text-sm text-white/70">تجربه</dt>
              <dd className="mt-1 text-xl font-bold">{formatNumberFa(HEAD_TRAINER.years)} سال کار با سگ‌ها</dd>
            </div>
            <div className="bg-[var(--fd-ink)] p-5">
              <dt className="text-sm text-white/70">مدرک</dt>
              <dd className="mt-1 text-xl font-bold">{HEAD_TRAINER.credential}</dd>
            </div>
          </dl>

          <p className="mt-8 max-w-xl leading-8 text-white/85">
            {HEAD_TRAINER.firstName} تنها مربی مرکز است و خودش هر سگ تازه‌ای را می‌بیند و ارزیابی می‌کند. وقتی با او
            تماس بگیری، با خود او حرف می‌زنی.
          </p>
          <Link
            to={LAB_LINKS.about}
            className="mt-6 inline-block rounded-md font-semibold text-[var(--fd-sky)] underline underline-offset-8 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
          >
            درباره‌ی {HEAD_TRAINER.firstName} بیشتر بخوان
          </Link>
        </div>
      </div>
    </section>
  );
}
