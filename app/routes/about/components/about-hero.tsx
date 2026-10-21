import { buttonVariants } from "~/components/ui/button";
import { ChalkBubble } from "~/components/chalk-bubble";
import { EvaluationButton } from "~/components/evaluation-button";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { BRICK } from "~/lib/brick";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { COLUMN } from "~/routes/about/column";

/*===== Tape =====*/
// A strip of translucent tape with torn ends (the home trainer section's, in a paper tone: the print's mount is ivory,
// so the ivory tape of the dark print would vanish on it).
const TAPE =
  "absolute h-5 w-16 bg-[rgb(214_196_150/0.8)] [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] md:w-20";

/*===== Hero =====*/
/**
 * The page's one brick wall. The owner's real photo hangs on it as a print, a dark plate beside it carries her name and
 * the two ways forward, and the dog sits on the wall's coping waving hello and introducing her. On phones the dog and
 * his bubble come first, then the print, then the plate; from `lg` the plate is at the start (the right) and the print
 * at the end, with the dog over the plate's end corner.
 *
 * The dog sits on the coping, so his block overlaps the band by a few pixels (the cut-out's soft feet disappear into
 * the stone). His bubble and bushes use physical sides on purpose: they are tied to the picture (the wave pose's raised
 * paw is on his right), not to the reading direction.
 */
export function AboutHero() {
  const photo = HEAD_TRAINER.photos.standing;

  return (
    <section aria-labelledby="about-title">
      {/*------ The dog on the coping ------*/}
      <div aria-hidden className={`${COLUMN} relative z-10 grid pt-2 md:pt-4 lg:grid-cols-12 lg:gap-x-10`}>
        <div className="flex justify-start ps-12 pt-20 lg:col-span-7 lg:justify-end lg:ps-0 lg:pe-10 lg:pt-16">
          <div className="relative w-36 translate-y-[3%] md:w-44 lg:w-64">
            {/* A pool of warm light where he sits. */}
            <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
            <MascotCut name="plants" eager className="lively-sway absolute bottom-0 left-[74%] w-[60%]" />
            <MascotCut
              name="plants"
              eager
              className="lively-sway-2 absolute right-[78%] bottom-0 w-[50%] -scale-x-100"
            />
            <MascotCut name="wave" eager className="lively-wiggle relative block w-full" />
            <ChalkBubble
              tail="right"
              className="ab-pop absolute right-[58%] bottom-[84%] w-max max-w-[13rem] text-pretty md:max-w-[16rem]"
            >
              سلام! اینم طلاست، مربی من.
            </ChalkBubble>
          </div>
        </div>

        {/* A garden hedge and a bush along the coping over the plate's start side, so the sky above the plate isn't
            bare. Physical side: the plate is on the right and the garden stands over it. */}
        <div aria-hidden className="absolute right-8 bottom-0 hidden w-64 translate-y-[2%] lg:block xl:w-72">
          <MascotCut name="hedge" className="relative w-full" />
          <MascotCut name="plants" className="lively-sway absolute right-[-4%] bottom-0 w-[30%]" />
        </div>
      </div>

      {/*------ The wall ------*/}
      <div
        style={{ backgroundImage: `var(--grain), ${BRICK}` }}
        className="relative border-t-2 border-b border-t-foreground/60 border-b-border surface-inverse"
      >
        <div className={`${COLUMN} grid items-center gap-10 pt-4 pb-14 lg:grid-cols-12 lg:gap-x-10`}>
          {/*------ The plate ------*/}
          <div className="order-2 rounded-3xl border border-border bg-jet paper-grain p-6 shadow-md sm:p-8 lg:order-1 lg:col-span-7 lg:p-10">
            <h1
              id="about-title"
              className="font-display text-5xl leading-[1.2] font-extrabold tracking-tight text-primary md:text-6xl"
            >
              {HEAD_TRAINER.name}
            </h1>
            <p className="mt-3 text-lead text-pretty text-muted-foreground">{HEAD_TRAINER.role}</p>
            <p className="mt-4 max-w-lg text-pretty text-foreground/85">
              {HEAD_TRAINER.name} با {formatNumberFa(HEAD_TRAINER.years)} سال سابقه و تجربه‌ی حرفه‌ای توی آموزش سگ‌ها
              کار می‌کنه؛ از آموزش‌های پایه و عمومی تا دوره‌های تخصصی، نگهبانی، ورزشی و سطوح مسابقاتی.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <EvaluationButton className="h-12">ارزیابی رایگان بگیر</EvaluationButton>
              <Link to="/courses" className={buttonVariants({ variant: "outline", className: "h-12 px-7 text-base" })}>
                دوره‌ها رو ببین
              </Link>
            </div>
          </div>

          {/*------ The print ------*/}
          {/* The real photo, never altered: a mount, two strips of tape across the top corners and a slight tilt. */}
          <figure className="ab-print relative order-1 mx-auto w-full max-w-[22rem] -rotate-2 lg:order-2 lg:col-span-5 lg:self-start">
            <div className="rounded-sm bg-foreground p-2.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.9)] md:p-3">
              <img
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(min-width: 64rem) 22rem, 90vw"
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                fetchPriority="high"
                decoding="async"
                className="aspect-[2/3] h-auto w-full object-cover"
              />
            </div>
            <span aria-hidden className={`${TAPE} -top-4 -right-3 rotate-45 md:-right-5`} />
            <span aria-hidden className={`${TAPE} -top-4 -left-3 -rotate-45 md:-left-5`} />
          </figure>
        </div>
      </div>

      {/* The page's one load moment: the print drops onto the wall from its tape and swings to rest, then the dog's
          bubble pops from its tail (bottom right, 2.25rem in) and settles into the shared float, second in the list so
          it takes over once it starts. The keyframes add to the print's own tilt (Tailwind's separate `rotate`). Off
          for reduced motion. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ab-print {
            transform-origin: 50% 0;
            animation: ab-print .9s cubic-bezier(.3,.7,.4,1) .1s both;
          }
          .ab-pop {
            transform-origin: calc(100% - 2.25rem) 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .75s both, lively-float 3.4s ease-in-out 1.15s infinite alternate;
          }
        }
        @keyframes ab-print {
          0% { opacity: 0; transform: translateY(-2.5rem) rotate(-5deg); }
          45% { opacity: 1; transform: translateY(.25rem) rotate(2.5deg); }
          65% { transform: rotate(-1.5deg); }
          82% { transform: rotate(.6deg); }
          100% { transform: none; }
        }
      `}</style>
    </section>
  );
}
