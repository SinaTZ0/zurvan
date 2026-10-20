import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { Bubble, Cut, EvaluationButton, HEADING, Ticks } from "~/routes/design_lab/components/story/story-parts";

/*===== Trainer =====*/
export function StoryTrainer() {
  const photo = HEAD_TRAINER.photos.withDog;

  return (
    <section
      aria-labelledby="st-trainer-title"
      className="relative mx-auto max-w-6xl px-4 pt-32 pb-16 md:px-8 md:pt-20 md:pb-20"
    >
      {/* He hangs from the band above: the image is cut flat at the top, so the cut sits on the band's bottom edge. */}
      <div aria-hidden className="absolute -top-px left-[6%] z-10 md:left-[8%]">
        <Cut name="upside" className="st-swing w-20 md:w-28" />
      </div>
      <Bubble
        tail="left"
        className="st-float absolute top-3 left-[calc(6%+5.4rem)] z-10 hidden w-40 sm:block md:top-5 md:left-[calc(8%+7.6rem)]"
      >
        وارونه‌ام، ولی هنوز دوستتم!
      </Bubble>

      {/* Foliage in the far corner, out in the page margin, so it never runs into the copy. */}
      <div aria-hidden className="absolute bottom-6 -left-28 hidden w-32 xl:block">
        <Cut name="plants" className="st-sway w-full -scale-x-100" />
      </div>

      <div className="grid items-end gap-x-8 gap-y-8 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_auto_1fr] lg:gap-x-10">
        {/*------ Dog + framed photo ------*/}
        <div className="flex items-end gap-3 md:col-span-1 lg:contents">
          <div className="relative w-[7.5rem] shrink-0 pt-16 sm:w-40 lg:w-56">
            <Cut name="plants" className="st-sway-2 absolute right-0 bottom-0 w-24 lg:w-36" />
            <div className="st-wiggle-late st-pet relative">
              <Cut name="sit" className="block w-full -scale-x-100" />
            </div>
            <Bubble tail="left" className="st-float-2 absolute top-0 right-0 w-[7.5rem] text-sm sm:w-36 lg:w-40 lg:text-lg">
              {HEAD_TRAINER.firstName} مربی منه!
            </Bubble>
          </div>

          <figure className="st-reveal-pop flex-1 rounded-sm border-2 border-(--st-line)/80 bg-(--st-paper-2) p-2 md:p-2.5 lg:w-72 lg:flex-none">
            <img
              src={photo.src}
              srcSet={photo.srcSet}
              sizes="(min-width: 1024px) 18rem, 50vw"
              width={photo.width}
              height={photo.height}
              alt={photo.alt}
              loading="lazy"
              className="aspect-[3/4] h-auto w-full object-cover"
            />
          </figure>
        </div>

        {/*------ Copy ------*/}
        <div className="md:self-center">
          <h2 id="st-trainer-title" className={`${HEADING} st-reveal text-3xl md:text-[2.6rem]`}>
            یک مربی.
            <br />
            یک همراهی ماندگار.
          </h2>
          <p className="mt-5 text-lg font-bold text-(--st-ink)">{HEAD_TRAINER.name}</p>
          <p className="mt-1 text-base leading-7 text-(--st-ink)/80">{HEAD_TRAINER.role}</p>
          <p className="mt-5 border-y border-(--st-line)/25 py-3 font-display text-2xl font-bold text-(--st-ink)">
            {formatNumberFa(HEAD_TRAINER.years)} سال تجربه
          </p>
          <p className="mt-3 text-base leading-7 text-(--st-ink)/80">{HEAD_TRAINER.credential}</p>
        </div>
      </div>
    </section>
  );
}

/*===== Closing =====*/
// The band can be its own colour (solid gold in one style): inside it, the ink, the bubbles' paper and the button
// switch to the band's set. The `--st-close-*` defaults (story-theme) keep the page's own colours.
const CLOSING_TOKENS = {
  "--st-ink": "var(--st-close-ink)",
  "--st-line": "var(--st-close-ink)",
  "--st-paper": "var(--st-close)",
  "--st-bubble-line": "var(--st-close-bubble)",
  "--st-bubble-ink": "var(--st-close-bubble)",
  "--st-red": "var(--st-close-btn)",
  "--st-red-deep": "var(--st-close-btn-hover)",
  "--st-on-red": "var(--st-close-btn-ink)",
  "--st-dim": "var(--st-close-dim)",
} as React.CSSProperties;

// The leash image is cut flat at the chest (84% down); that cut sits on the band's bottom edge, so the leash itself
// dangles 16% of the image into the footer.
export function StoryClosing() {
  return (
    <section aria-labelledby="st-closing-title" style={CLOSING_TOKENS} className="relative z-10 bg-(--st-close)">
      <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-12 md:px-8 md:pt-16">
        <div className="pb-[17rem] md:min-h-[27rem] md:pe-[18rem] md:pb-16">
          <h2 id="st-closing-title" className={`${HEADING} st-reveal text-4xl md:text-6xl`}>
            هر وقت آماده‌ای،
            <br />
            ما هم هستیم
          </h2>
          <EvaluationButton className="mt-7" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-4 z-20 w-44 md:left-[8%] md:w-64">
        <div className="relative translate-y-[16%]">
          <Cut name="plants" className="st-sway absolute bottom-[16%] left-[92%] z-0 w-24 md:w-36" />
          <Cut name="plants" className="st-sway-2 absolute right-[88%] bottom-[16%] z-0 w-24 -scale-x-100 md:w-32" />
          <Cut name="leash" className="st-hop relative z-10 w-full" />
          <Ticks className="st-ticks absolute top-[14%] -right-6 z-20 w-7 md:-right-8 md:w-8" />
          <Ticks className="st-ticks absolute top-[22%] -left-5 z-20 w-6 -scale-x-100 [animation-delay:-.7s] md:-left-7 md:w-7" />
          <Bubble tail="right" className="st-float absolute -top-6 right-[60%] z-20 md:-top-4">
            بریم؟
          </Bubble>
        </div>
      </div>
    </section>
  );
}

/*===== Footer =====*/
export function StoryFooter() {
  const linkClass =
    "rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-ink)";
  return (
    <footer className="mx-auto max-w-6xl px-4 pt-20 pb-28 md:px-8 md:pt-14">
      <div className="grid gap-8 border-t border-(--st-line)/25 pt-8 text-sm text-(--st-ink)/85 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-black text-(--st-ink)">زروان</p>
          <p className="mt-1">{CENTER_DESCRIPTOR}</p>
        </div>
        <div className="space-y-2">
          <p>
            تلفن:{" "}
            <a href={`tel:${CENTER_PHONE.tel}`} dir="ltr" className={`inline-block ${linkClass}`}>
              {CENTER_PHONE.display}
            </a>
          </p>
          <p>محدوده‌ی خدمات: {CENTER_SERVICE_AREA}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col">
          {CENTER_LINKS.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={linkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col">
          <li>
            <Link to="/privacy" className={linkClass}>
              حریم خصوصی
            </Link>
          </li>
          <li>
            <Link to="/join/partner" className={linkClass}>
              همکاری با ما
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
