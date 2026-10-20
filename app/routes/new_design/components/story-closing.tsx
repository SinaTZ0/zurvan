import {
  ArrowLeft,
  ArrowUpLeft,
  Award,
  CalendarHeart,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";
import { toPersianDigits } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { SITE_RULES } from "~/lib/site-rules";
import {
  Bubble,
  Cut,
  EvaluationButton,
  HEADING,
  Ticks,
} from "~/routes/new_design/components/story-parts";
import { Emblem, SOCIAL_ICONS } from "~/routes/new_design/components/story-brand";
import { GRAIN } from "~/routes/new_design/components/story-theme";
import { LINKS } from "~/routes/new_design/content";

/*===== Trainer =====*/
// A strip of translucent tape with torn ends.
const TAPE =
  "absolute h-5 w-16 bg-(--st-ink)/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] md:w-20";

export function StoryTrainer() {
  const photo = HEAD_TRAINER.photos.withDog;

  return (
    <section
      aria-labelledby="st-trainer-title"
      className="relative mx-auto max-w-6xl px-4 pt-32 pb-16 md:px-8 md:pt-36 md:pb-20"
    >
      {/* He hangs from the band above: the image is cut flat at the top, so the cut sits on the band's bottom edge. */}
      <div aria-hidden className="absolute -top-px left-[6%] z-10 md:left-[8%]">
        <Cut name="upside" className="st-swing w-20 md:w-28" />
      </div>
      <Bubble
        tail="left"
        className="st-float absolute top-6 left-[calc(6%+5.4rem)] z-10 w-40 md:top-5 md:left-[calc(8%+7.6rem)]"
      >
        از این بالا همه‌چی معلومه!
      </Bubble>

      {/* Foliage in the far corner, out in the page margin, so it never runs into the copy. */}
      <div aria-hidden className="absolute bottom-6 -left-28 hidden w-32 xl:block">
        <Cut name="plants" className="st-sway w-full -scale-x-100" />
      </div>

      {/* On a tablet the photo's column is sized by the photo, which would take all it can; the copy keeps 22rem. */}
      <div className="grid items-end gap-x-8 gap-y-8 md:grid-cols-[auto_minmax(22rem,1fr)] lg:grid-cols-[auto_auto_1fr] lg:gap-x-10">
        {/*------ Dog + framed photo ------*/}
        <div className="flex items-end gap-3 md:col-span-1 lg:contents">
          <div className="relative w-[7.5rem] shrink-0 pt-16 sm:w-40 lg:w-56">
            <Cut name="plants" className="st-sway-2 absolute right-0 bottom-0 w-24 lg:w-36" />
            <div className="st-wiggle-late st-pet relative">
              <Cut name="sit" className="block w-full -scale-x-100" />
            </div>
            <Bubble
              tail="left"
              className="st-float-2 absolute top-0 right-0 w-[7.5rem] text-sm sm:w-36 lg:w-40 lg:text-lg"
            >
              {HEAD_TRAINER.firstName} مربی منه!
            </Bubble>
          </div>

          {/* A print taped to the wall, a little crooked. */}
          <figure className="relative flex-1 -rotate-2 lg:w-72 lg:flex-none">
            <div className="st-reveal-pop rounded-sm border-2 border-(--st-line)/80 bg-(--st-paper-2) p-2 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.9)] md:p-2.5">
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
            </div>
            {/* Tape across the two top corners. One strip over the middle of the top edge read as a censor bar. */}
            <span aria-hidden className={`${TAPE} -top-1 -right-2.5 rotate-45 md:-right-4`} />
            <span aria-hidden className={`${TAPE} -top-1 -left-2.5 -rotate-45 md:-left-4`} />
          </figure>
        </div>

        {/*------ Copy ------*/}
        {/* Three steps of type and no more: the name in gold at heading size, one plain line under it (the person
            who evaluates the dog is the one who trains it, a fact rather than a slogan), then everything else at
            body size. The name is the heading (and the one gold line on the page, the owner's call,
            2026-10-20): the section sells her. */}
        <div className="md:self-center">
          <h2
            id="st-trainer-title"
            className="st-reveal font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-(--st-red) md:text-[2.6rem]"
          >
            {HEAD_TRAINER.name}
          </h2>
          <p className="mt-3 font-display text-xl leading-snug font-extrabold text-(--st-ink) md:text-2xl">
            همون کسی که سگت رو ارزیابی می‌کنه، آموزشش هم می‌ده.
          </p>
          <p className="mt-4 text-lg leading-8 text-(--st-ink)/80">{HEAD_TRAINER.role}</p>

          {/*------ Facts ------*/}
          <ul className="mt-6 flex flex-col gap-3 border-t border-(--st-line)/15 pt-6 text-base text-(--st-ink)/85">
            <li className="flex items-center gap-3">
              <CalendarHeart
                aria-hidden
                className="size-5 shrink-0 text-(--st-red)"
                strokeWidth={1.8}
              />
              از سال {toPersianDigits(String(HEAD_TRAINER.since))} با سگ‌ها کار می‌کنه
            </li>
            <li className="flex items-center gap-3">
              <Award aria-hidden className="size-5 shrink-0 text-(--st-red)" strokeWidth={1.8} />
              {HEAD_TRAINER.credential}
            </li>
          </ul>

          <Link
            to={LINKS.about}
            className="mt-7 inline-flex items-center gap-1.5 rounded text-base font-bold text-(--st-ink) underline decoration-(--st-mustard) decoration-2 underline-offset-8 hover:decoration-(--st-ink) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--st-ink)"
          >
            بیشتر درباره‌ی {HEAD_TRAINER.firstName}
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/*===== Closing =====*/
// Inside the band, the bubble's paper is the band's own grey, so the bubble reads as cut from it.
const CLOSING_TOKENS = { "--st-paper": "var(--st-sage)" } as React.CSSProperties;

// The leash image is cut flat at the chest (84% down); that cut sits on the band's bottom edge, so the leash itself
// dangles 16% of the image into the footer.
export function StoryClosing() {
  return (
    <section
      aria-labelledby="st-closing-title"
      style={CLOSING_TOKENS}
      className="relative z-10 bg-(--st-sage)"
    >
      <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-12 md:px-8 md:pt-16">
        <div className="pb-[17rem] md:min-h-[27rem] md:pe-[18rem] md:pb-16">
          <h2 id="st-closing-title" className={`${HEADING} st-reveal text-4xl md:text-6xl`}>
            حالا نوبت
            <br />
            سگ توئه!
          </h2>
          <EvaluationButton className="mt-7" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-7 z-20 w-44 md:left-[8%] md:w-64">
        <div className="relative translate-y-[16%]">
          <Cut
            name="plants"
            className="st-sway absolute bottom-[16%] left-[92%] z-0 w-24 md:w-36"
          />
          <Cut
            name="plants"
            className="st-sway-2 absolute right-[88%] bottom-[16%] z-0 w-24 -scale-x-100 md:w-32"
          />
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
// The storefront footer's facts (site-footer), laid out as a full-width band: the brand with its social links, three
// link groups, and how to reach the center, over a copyright line. Gold only marks the contact icons, as everywhere
// on this page. The closing scene's dog stands on the band's top edge.
const FOOTER_GROUPS = [
  { title: "دوره‌ها", links: [{ label: "همه‌ی دوره‌ها", to: LINKS.courses }] },
  {
    title: "ارتباط با زروان",
    links: [
      { label: `درباره‌ی ${HEAD_TRAINER.name}`, to: LINKS.about },
      { label: "تماس با ما", to: LINKS.contact },
      { label: "همکاری با زروان", to: "/join/partner" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { label: "سؤال‌های پرتکرار", to: LINKS.help },
      { label: "لاگ‌بوک سگ‌ها", to: "/logbook" },
      // Only once the owner has approved the wording.
      ...(SITE_RULES ? [{ label: "قوانین", to: "/rules" }] : []),
    ],
  },
];

const FOOTER_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-ink)";
const FOOTER_LINK = `rounded text-(--st-ink)/70 transition-colors hover:text-(--st-ink) ${FOOTER_FOCUS}`;

export function StoryFooter() {
  return (
    <footer
      style={{ backgroundImage: GRAIN }}
      className="border-t border-(--st-line)/10 bg-(--st-paper-2) text-sm text-(--st-ink)/85"
    >
      {/* Below lg the bottom padding clears the floating tab bar. */}
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-32 md:px-8 md:pt-24 lg:pb-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-[1.9fr_repeat(3,minmax(0,1fr))_1.3fr] lg:gap-x-10">
          {/*------ Brand ------*/}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className={`inline-flex items-center gap-3 rounded ${FOOTER_FOCUS}`}>
              <Emblem className="size-14" />
              <span className="flex flex-col leading-tight">
                <span className="font-display text-3xl font-black text-(--st-ink)">زروان</span>
                <span className="mt-0.5 text-xs text-(--st-ink)/65">{CENTER_DESCRIPTOR}</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-pretty text-(--st-ink)/70">
              {HEAD_TRAINER.name} از سال {toPersianDigits(String(HEAD_TRAINER.since))} سگ‌ها رو آموزش می‌ده:
              فرمان‌پذیری، اصلاح رفتار، کارهای تخصصی و آمادگی مسابقه.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {CENTER_LINKS.map((item) => {
                const Icon = SOCIAL_ICONS[item.href];
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`flex items-center gap-2 rounded-xl border border-(--st-line)/15 px-3 py-1.5 text-(--st-ink)/85 transition-colors hover:border-(--st-line)/35 hover:text-(--st-ink) ${FOOTER_FOCUS}`}
                    >
                      <Icon className="size-[1.125rem] text-(--st-red)" />
                      {item.label}
                      <ArrowUpLeft aria-hidden className="size-3.5 text-(--st-ink)/50" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/*------ Link groups ------*/}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-display text-base font-bold text-(--st-ink)">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={FOOTER_LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/*------ Reach the center ------*/}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h2 className="font-display text-base font-bold text-(--st-ink)">تماس با زروان</h2>
            <ul className="mt-4 flex flex-col gap-3.5">
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden className="size-4 shrink-0 text-(--st-red)" strokeWidth={1.8} />
                <a
                  href={`tel:${CENTER_PHONE.tel}`}
                  dir="ltr"
                  className={`rounded font-bold text-(--st-ink) tabular-nums hover:underline ${FOOTER_FOCUS}`}
                >
                  {CENTER_PHONE.display}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin aria-hidden className="size-4 shrink-0 text-(--st-red)" strokeWidth={1.8} />
                فعالیت در {CENTER_SERVICE_AREA}
              </li>
              <li className="flex items-center gap-2.5">
                <UserRound
                  aria-hidden
                  className="size-4 shrink-0 text-(--st-red)"
                  strokeWidth={1.8}
                />
                مربی: {HEAD_TRAINER.name}
              </li>
            </ul>
          </div>
        </div>

        {/*------ Bottom bar ------*/}
        <div className="mt-12 flex flex-col gap-3 border-t border-(--st-line)/10 pt-6 text-xs text-(--st-ink)/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© ۱۴۰۵ زروان. همه‌ی حقوق محفوظ است.</p>
          <Link to="/privacy" className={`self-start ${FOOTER_LINK} text-(--st-ink)/60`}>
            حریم خصوصی
          </Link>
        </div>
      </div>
    </footer>
  );
}
