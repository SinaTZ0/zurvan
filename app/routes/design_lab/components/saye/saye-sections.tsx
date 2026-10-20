import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { LAB_FORMATS, LAB_SERVICES, LAB_STEPS } from "~/routes/design_lab/lab-content";
import { Link } from "~/components/link";

import { FOCUS_RING, Grain, POSTER_FONT, SayeLine, Stamp } from "./saye-parts";

/*===== Sections =====*/
// A stack of posters: each section is one flat colour field with one big headline. Alternation (fawn, newsprint,
// black) carries the rhythm, so no cards, shadows or rounded corners are needed.

const SECTION = "relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24 lg:px-12";
const TITLE = `${POSTER_FONT} text-[clamp(3rem,9vw,7rem)] leading-[0.95]`;

/*===== Saye's Band =====*/
export function SayeBand() {
  return (
    <section aria-label="سایه می‌گوید" className="bg-black px-4 py-8 text-[var(--sy-fawn)] sm:px-8 lg:px-12">
      <p className={`${POSTER_FONT} text-[clamp(1.6rem,4.4vw,3.6rem)] leading-tight`}>
        همیشه کنارت. جلو نمی‌افتم، عقب نمی‌مانم.
      </p>
    </section>
  );
}

/*===== Evaluation Steps =====*/
export function SayeSteps() {
  return (
    <section aria-labelledby="sy-steps-title" className={`${SECTION} bg-[var(--sy-paper)] text-black`}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <h2 id="sy-steps-title" className={TITLE}>
          چهار قدم
          <br />
          تا شروع
        </h2>
        {/*------ The one red stamp ------*/}
        <Stamp className="mt-2">رایگان</Stamp>
      </div>

      <ol className="mt-12 grid border-t-[6px] border-black sm:grid-cols-2 lg:grid-cols-4">
        {LAB_STEPS.map((step, i) => (
          <li
            key={step.title}
            className="border-b-[3px] border-black py-6 sm:pe-6 lg:border-s-[3px] lg:border-b-0 lg:ps-6 lg:first:border-s-0"
          >
            <span className={`${POSTER_FONT} block text-[7rem] leading-[0.8]`} aria-hidden="true">
              {formatNumberFa(i + 1)}
            </span>
            <h3 className={`${POSTER_FONT} mt-4 text-3xl leading-tight`}>{step.title}</h3>
            <p className="mt-2 max-w-[32ch] leading-7">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/*===== Services =====*/
export function SayeServices() {
  return (
    <section aria-labelledby="sy-services-title" className={`${SECTION} bg-black text-[var(--sy-paper)]`}>
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
        <div>
          <h2 id="sy-services-title" className={`${TITLE} text-[var(--sy-fawn)]`}>
            هر نژاد،
            <br />
            هر سنی
          </h2>
          <ul className="mt-10 border-t-[3px] border-[var(--sy-fawn)]">
            {LAB_SERVICES.map((service) => (
              <li
                key={service.title}
                className="grid gap-1 border-b border-[var(--sy-paper)]/40 py-5 sm:grid-cols-[1fr_1.1fr] sm:gap-8"
              >
                <h3 className={`${POSTER_FONT} text-2xl leading-snug text-[var(--sy-fawn)] sm:text-3xl`}>
                  {service.title}
                </h3>
                <p className="leading-7">{service.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        {/*------ Leap print, cropped on the dog ------*/}
        <div className="relative min-h-72 overflow-hidden bg-[var(--sy-fawn)] lg:min-h-0">
          <img
            src="/photo/design-lab/saye-leap.webp"
            width={610}
            height={610}
            loading="lazy"
            alt="نقش دو رنگ یک مالینوا در میانه‌ی جهش"
            className="absolute inset-0 size-full object-cover [object-position:72%_32%] lg:[object-position:88%_30%]"
          />
          <Grain />
        </div>
      </div>
    </section>
  );
}

/*===== Formats =====*/
export function SayeFormats() {
  return (
    <section aria-labelledby="sy-formats-title" className={`${SECTION} bg-[var(--sy-fawn)] text-black`}>
      <h2 id="sy-formats-title" className={TITLE}>
        هر جا که لازم باشد
      </h2>
      <ul className="mt-10 grid gap-4 lg:grid-cols-3">
        {LAB_FORMATS.map((format) => (
          <li
            key={format}
            className={`${POSTER_FONT} flex min-h-40 items-end bg-black p-6 text-3xl leading-tight text-[var(--sy-fawn)]`}
          >
            {format}
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-[50ch] text-lg leading-8 font-bold">
        پانسیون فقط با هماهنگی قبلی. وقت و محل را {HEAD_TRAINER.firstName} با تو هماهنگ می‌کند.
      </p>
      <Grain />
    </section>
  );
}

/*===== Head Trainer =====*/
export function SayeTrainer() {
  const photo = HEAD_TRAINER.photos.withDog;

  return (
    <section aria-labelledby="sy-trainer-title" className={`${SECTION} bg-[var(--sy-paper)] text-black`}>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
        <div>
          <SayeLine>سایه: «من فرمان می‌برم. فرمانده {HEAD_TRAINER.firstName} است.»</SayeLine>
          <h2 id="sy-trainer-title" className={`${TITLE} mt-6`}>
            {HEAD_TRAINER.name}
          </h2>
          <p className={`${POSTER_FONT} mt-4 text-2xl leading-snug sm:text-3xl`}>{HEAD_TRAINER.role}</p>
          <dl className="mt-8 grid max-w-md gap-0 border-t-[3px] border-black text-lg">
            <div className="flex items-baseline justify-between gap-4 border-b border-black/40 py-3">
              <dt>تجربه</dt>
              <dd className={`${POSTER_FONT} text-3xl`}>{formatNumberFa(HEAD_TRAINER.years)} سال</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-black/40 py-3">
              <dt>مدرک</dt>
              <dd className="font-bold">{HEAD_TRAINER.credential}</dd>
            </div>
          </dl>
        </div>

        {/*------ Photo, black offset block behind it like a mis-registered print ------*/}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 bg-[var(--sy-fawn)]" />
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(min-width: 1024px) 26rem, 90vw"
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            className="relative aspect-[3/4] w-full border-[4px] border-black object-cover"
          />
        </div>
      </div>
    </section>
  );
}

/*===== Closing CTA =====*/
export function SayeClosing() {
  return (
    <section aria-labelledby="sy-closing-title" className="bg-black px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="relative grid overflow-hidden bg-[var(--sy-fawn)] text-black lg:grid-cols-[1.2fr_1fr]">
        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <h2 id="sy-closing-title" className={TITLE}>
            اول، ارزیابی.
          </h2>
          <p className="mt-5 max-w-[34ch] text-lg leading-8 font-bold">
            {HEAD_TRAINER.firstName} سگت را می‌بیند و می‌گوید از کجا شروع کنید. رایگان، بدون تعهد.
          </p>
          <Link
            to="/assessment"
            className={`${POSTER_FONT} mt-8 inline-block bg-black px-9 py-3 text-3xl text-[var(--sy-fawn)] hover:bg-[var(--sy-paper)] hover:text-black ${FOCUS_RING}`}
          >
            ارزیابی رایگان
          </Link>
        </div>
        <div className="relative min-h-56 overflow-hidden">
          <img
            src="/photo/design-lab/saye-leap.webp"
            width={610}
            height={610}
            loading="lazy"
            alt=""
            className="absolute inset-0 size-full object-cover [object-position:80%_30%]"
          />
        </div>
        <Grain />
      </div>
    </section>
  );
}
