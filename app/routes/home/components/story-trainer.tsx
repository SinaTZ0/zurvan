import { ArrowLeft, Award, CalendarHeart } from "lucide-react";

import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { LINKS } from "~/routes/home/content";
import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { m } from "~/paraglide/messages";

/*===== Trainer =====*/
// A strip of translucent tape with torn ends.
const TAPE =
  "absolute h-5 w-16 bg-foreground/25 [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] md:w-20";

// The scene's sides are logical: on the English pages (left to right) it is mirrored, and the sitting dog turns to face
// the photo, which is then on his other side.
export function StoryTrainer() {
  const photo = HEAD_TRAINER.photos.withDog;

  return (
    <section
      aria-labelledby="st-trainer-title"
      className="relative mx-auto max-w-6xl px-4 pt-32 pb-16 md:px-8 md:pt-36 md:pb-20"
    >
      {/* He hangs from the band above: the image is cut flat at the top, so the cut sits on the band's bottom edge. */}
      <div aria-hidden className="absolute end-[6%] -top-px z-10 md:end-[8%]">
        <MascotCut name="upside" className="lively-swing w-20 md:w-28" />
      </div>
      <ChalkBubble
        tail="end"
        className="lively-float absolute end-[calc(6%+5.4rem)] top-6 z-10 w-40 md:end-[calc(8%+7.6rem)] md:top-5"
      >
        {m.home_trainer_hanging_bubble()}
      </ChalkBubble>

      {/* Foliage in the far corner, out in the page margin, so it never runs into the copy. */}
      <div aria-hidden className="absolute -end-28 bottom-6 hidden w-32 xl:block">
        <MascotCut name="plants" className="lively-sway w-full -scale-x-100" />
      </div>

      {/* On a tablet the photo's column is sized by the photo, which would take all it can; the copy keeps 22rem. */}
      <div className="grid items-end gap-x-8 gap-y-8 md:grid-cols-[auto_minmax(22rem,1fr)] lg:grid-cols-[auto_auto_1fr] lg:gap-x-10">
        {/*------ Dog + framed photo ------*/}
        <div className="flex items-end gap-3 md:col-span-1 lg:contents">
          <div className="relative w-[7.5rem] shrink-0 pt-16 sm:w-40 lg:w-56">
            <MascotCut name="plants" className="lively-sway-2 absolute start-0 bottom-0 w-24 lg:w-36" />
            <div className="lively-wiggle-late lively-pet relative">
              <MascotCut name="sit" className="block w-full -scale-x-100 ltr:scale-x-100" />
            </div>
            <ChalkBubble
              tail="end"
              className="lively-float-2 absolute start-0 top-0 w-[7.5rem] text-sm sm:w-36 lg:w-40 lg:text-lg"
            >
              {m.home_trainer_bubble({ trainer: HEAD_TRAINER.firstName })}
            </ChalkBubble>
          </div>

          {/* A print taped to the wall, a little crooked. */}
          <figure className="relative flex-1 -rotate-2 lg:w-72 lg:flex-none">
            <div className="lively-reveal-pop rounded-sm border-2 border-foreground/80 bg-card p-2 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.9)] md:p-2.5">
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
            className="lively-reveal font-display text-3xl leading-[1.2] font-extrabold tracking-tight text-primary md:text-[2.6rem]"
          >
            {HEAD_TRAINER.name}
          </h2>
          <p className="mt-3 font-display text-xl leading-snug font-extrabold text-foreground md:text-2xl">
            {m.home_trainer_line()}
          </p>
          <p className="mt-4 text-lg leading-8 text-foreground/80">{HEAD_TRAINER.role}</p>

          {/*------ Facts ------*/}
          <ul className="mt-6 flex flex-col gap-3 border-t border-foreground/15 pt-6 text-base text-foreground/85">
            <li className="flex items-center gap-3">
              <CalendarHeart aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
              {m.home_trainer_since({ year: HEAD_TRAINER.sinceYear })}
            </li>
            <li className="flex items-center gap-3">
              <Award aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
              {HEAD_TRAINER.credential}
            </li>
          </ul>

          <Link
            to={LINKS.about}
            className="mt-7 inline-flex items-center gap-1.5 rounded text-base font-bold text-foreground underline decoration-primary decoration-2 underline-offset-8 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {m.home_trainer_more({ trainer: HEAD_TRAINER.firstName })}
            <ArrowLeft aria-hidden className="size-4 ltr:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
