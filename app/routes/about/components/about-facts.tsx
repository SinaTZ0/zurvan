import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { COLUMN } from "~/routes/about/column";

/*===== Scenes =====*/
// Each fact has a small stage: a dog on a path in front of a piece of the place the fact is about. Pieces are placed as
// shares of the box, so one composition fits both the phone's slim square (8.5rem) and the desktop stage (about 18rem
// wide, 11rem tall). The ground strip is the stage's floor; the dogs' feet are a little inside it.
const FLOOR =
  "absolute inset-x-0 bottom-0 h-8 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] md:h-10";
const POOL =
  "absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(ellipse_55%_60%_at_45%_85%,rgb(255_194_26/0.08),transparent)]";

/** Thirteen years of work: the dog sits by his notebook in front of the training centre. */
function ExperienceScene() {
  return (
    <>
      <div className={POOL} />
      <MascotCut name="center" className="absolute end-[-4%] bottom-[18%] w-[80%]" />
      <GroundStrip className={FLOOR} />
      <MascotCut name="teach-advice" className="lively-breathe absolute start-[2%] bottom-[7%] w-[66%]" />
    </>
  );
}

/** The credential: the dog brings his rolled diploma, with the finish flag behind him. */
function CredentialScene() {
  return (
    <>
      <div className={POOL} />
      {/* The pole stands about 72% across the picture and the flag flies left, which is onward in RTL. */}
      <MascotCut name="flag" className="lively-sway absolute end-[2%] bottom-[16%] w-[58%]" />
      <GroundStrip className={FLOOR} />
      <MascotCut name="diploma" className="lively-wiggle absolute start-[18%] bottom-[7%] h-[92%] w-auto" />
    </>
  );
}

/** All over Tehran: the dog trots along with his leash, the skyline and the Alborz behind him. */
function AreaScene() {
  return (
    <>
      <div className={POOL} />
      {/* Cropped to the Milad tower's side (the picture's right) so the tower and the peaks read at this size, with
          its hard straight sides faded out. The dog stands on the other side of the stage. */}
      <div className="absolute inset-x-0 bottom-[13%] h-[75%] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <MascotCut name="tehran" className="absolute right-0 bottom-0 w-[190%]" />
      </div>
      <GroundStrip className={FLOOR} />
      <MascotCut name="course-companion" className="lively-hop absolute end-[8%] bottom-[7%] h-[88%] w-auto" />
    </>
  );
}

/*===== Stage =====*/
/**
 * One fact. Phones lay it out as a slim row (the scene at the start, the words beside it); from `lg` the three stand
 * side by side with the words on top and the scene at the bottom, so extra height only adds sky.
 */
function Stage({
  scene,
  children,
  className,
}: {
  scene: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-x-4 p-3 lg:flex lg:min-h-[23rem] lg:flex-col lg:items-stretch lg:p-8",
        className,
      )}
    >
      <div className="lg:flex-1">{children}</div>
      <div aria-hidden className="relative h-32 max-lg:order-first lg:mt-6 lg:h-56">
        {scene}
      </div>
    </li>
  );
}

/*===== Facts =====*/
/**
 * The three facts from the owner's business card, each on its own stage. No bubbles here: the facts are the words, and
 * every fact is a line of `HEAD_TRAINER` or `contact.ts`.
 */
export function AboutFacts() {
  return (
    <section aria-labelledby="about-facts-title" className={`${COLUMN} pt-section-sm`}>
      <h2 id="about-facts-title" className="sr-only">
        {HEAD_TRAINER.firstName} در یک نگاه
      </h2>
      <div className="overflow-hidden rounded-4xl border border-border bg-sunken paper-grain shadow-sm">
        <ul className="grid divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {/*------ Experience ------*/}
          <Stage scene={<ExperienceScene />}>
            <p className="font-display text-3xl leading-tight font-extrabold text-primary lg:text-5xl">
              از سال {toPersianDigits(String(HEAD_TRAINER.since))}
            </p>
            <p className="mt-2 text-pretty text-muted-foreground">
              {formatNumberFa(HEAD_TRAINER.years)} سال سابقه و تجربه‌ی حرفه‌ای
            </p>
          </Stage>

          {/*------ Credential ------*/}
          <Stage scene={<CredentialScene />}>
            <p className="font-display text-2xl leading-snug font-extrabold text-balance text-primary lg:text-3xl">
              {HEAD_TRAINER.credential}
            </p>
          </Stage>

          {/*------ Area ------*/}
          <Stage scene={<AreaScene />}>
            <p className="font-display text-2xl leading-snug font-extrabold text-balance text-primary lg:text-3xl">
              فعال در {CENTER_SERVICE_AREA}
            </p>
          </Stage>
        </ul>
      </div>
    </section>
  );
}
