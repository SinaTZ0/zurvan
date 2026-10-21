import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { MascotCut, type MascotCutName } from "~/components/mascot-cut";

/*===== Stages =====*/
// The dog of each road step, so scrolling the questions is walking the road again. `dog` sizes him (his poses are
// small, so never past about 1.3x their natural width); `flip` turns the walking ones to face the accordion, the way
// the road goes; the sitting ones keep looking at their heading. `pieces` are the step's props and the bushes, placed
// as shares of the art box, behind him. Every class set is written out whole for Tailwind to find.
type Piece = { name: MascotCutName; className: string };

type Stage = {
  pose: MascotCutName;
  dog: string;
  flip?: boolean;
  pieces: Piece[];
};

const STAGES: Record<string, Stage> = {
  // The notebook is part of his picture: he is taking notes at the evaluation.
  evaluation: {
    pose: "teach-advice",
    dog: "w-[5.5rem] lg:w-36",
    pieces: [
      { name: "plants", className: "lively-sway left-[-6%] w-[26%]" },
      { name: "plants", className: "lively-sway-2 right-[-4%] hidden w-[22%] -scale-x-100 lg:block" },
    ],
  },
  // The key lies on his path: the courses that open.
  courses: {
    pose: "course-manners",
    dog: "h-20 w-auto lg:h-32",
    pieces: [
      { name: "key", className: "left-[-8%] bottom-[0.45rem] w-[36%] -rotate-12 lg:bottom-[0.8rem]" },
      { name: "plants", className: "lively-sway-2 right-[-4%] w-[24%] -scale-x-100" },
    ],
  },
  // He carries the basket: the cart.
  paying: {
    pose: "basket",
    dog: "w-[5.5rem] lg:w-36",
    flip: true,
    pieces: [
      { name: "plants", className: "lively-sway left-[-8%] w-[28%]" },
      { name: "plants", className: "lively-sway-2 right-[-6%] hidden w-[24%] -scale-x-100 lg:block" },
    ],
  },
  // The leash he brings: the call is made and they go out.
  training: {
    pose: "course-companion",
    dog: "h-20 w-auto lg:h-32",
    flip: true,
    pieces: [
      { name: "plants", className: "lively-sway right-[-6%] w-[26%] -scale-x-100" },
      { name: "plants", className: "lively-sway-2 left-[-6%] hidden w-[22%] lg:block" },
    ],
  },
  // The rosette on his chest, the finish flag planted behind him.
  done: {
    pose: "teach-medal",
    dog: "w-[4.75rem] lg:w-32",
    flip: true,
    pieces: [{ name: "flag", className: "lively-sway-2 right-[-12%] w-[38%] lg:right-[-8%]" }],
  },
  // Welcome back, with nothing to carry: his bushes only.
  account: {
    pose: "wave",
    dog: "h-20 w-auto lg:h-32",
    pieces: [
      { name: "plants", className: "lively-sway left-[-4%] w-[26%]" },
      { name: "plants", className: "lively-sway-2 right-[-4%] hidden w-[22%] -scale-x-100 lg:block" },
    ],
  },
};

const FALLBACK: Stage = {
  pose: "course-manners",
  dog: "h-20 w-auto lg:h-32",
  pieces: [{ name: "plants", className: "lively-sway left-[-4%] w-[26%]" }],
};

/*===== Group Art =====*/
/**
 * The step's dog on a short path, with his props and bushes and a pool of warm light. Phones: a small box at the end of
 * the heading's row, with its own path. Wide: the box is absolutely placed at the stage's end, standing on the stage's
 * own path (`FaqGroup` draws that one), so its path is hidden. Decoration only: the heading says the same thing.
 */
export function GroupArt({ groupId }: { groupId: string }) {
  const stage = STAGES[groupId] ?? FALLBACK;

  return (
    <div aria-hidden className="relative h-[5.5rem] w-24 shrink-0 lg:absolute lg:end-0 lg:bottom-0 lg:h-40 lg:w-40">
      {/* A pool of warm light where he stands. */}
      <div className="absolute -inset-x-1/4 inset-y-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_80%,rgb(255_194_26/0.08),transparent)]" />

      {/*------ Path (phones) ------*/}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] lg:hidden" />

      {/*------ Props and Bushes ------*/}
      {stage.pieces.map((piece, index) => (
        <MascotCut
          key={index}
          name={piece.name}
          className={cn("absolute bottom-[0.7rem] translate-y-[6%] lg:bottom-[1rem]", piece.className)}
        />
      ))}

      {/*------ Dog ------*/}
      {/* Centred on the box with physical sides (a mirrored cut-out stays mirrored: the keyframes only add to the
          separate `scale` property). He stands on the path's middle. */}
      <MascotCut
        name={stage.pose}
        className={cn(
          "help-dog lively-breathe absolute bottom-[0.7rem] left-1/2 -translate-x-1/2 lg:bottom-[1rem]",
          stage.dog,
          stage.flip && "-scale-x-100",
        )}
      />
    </div>
  );
}

/*===== Group Filler =====*/
// What lies at the end of a short group's row once its accordion is shorter than the stage: the stage's path goes on a
// little way under the questions and fades out, and a prop stands where it fades, the thing the dog is heading to (he
// faces it). So the row doesn't end in empty paper, and the path isn't a ground band that runs across the column. The
// filler is `overflow-hidden` and as tall as what the accordion leaves, so a prop that doesn't fit is simply cut, and an
// accordion taller than the stage (the sticky case) leaves the filler no height at all. Sides are physical: the stage
// is at the page's right and the path runs out of it to the left.
const FILLERS: Record<string, Piece[]> = {
  // The bone he dropped, where the medal dog is heading.
  done: [{ name: "bone", className: "left-[52%] w-20 -rotate-6" }],
  // A bush for the welcome-back dog to sit by.
  account: [{ name: "plants", className: "lively-sway left-[53%] w-14" }],
};

/**
 * The stage's path carried on beneath a short accordion, fading out about halfway across. Wide only. It reaches back
 * over the grid's gap and the stage path's faded end (`-ms-[5.5rem]`), so the two read as one line.
 */
export function GroupFiller({ groupId }: { groupId: string }) {
  return (
    <div aria-hidden className="relative -ms-[5.5rem] hidden min-h-0 flex-1 overflow-hidden lg:block">
      <GroundStrip className="absolute right-0 bottom-0 h-9 w-[55%] [mask-image:linear-gradient(to_right,transparent,black_35%,black_80%,transparent)]" />
      {(FILLERS[groupId] ?? []).map((piece, index) => (
        <MascotCut
          key={index}
          name={piece.name}
          className={cn("absolute bottom-[1rem] translate-y-[6%]", piece.className)}
        />
      ))}
    </div>
  );
}
