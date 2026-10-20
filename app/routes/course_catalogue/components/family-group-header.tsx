import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { courseMascotLine, familyMascotPose } from "~/lib/course-mascot";
import { courseScene } from "~/lib/course-scenes";
import type { FamilyGroup } from "~/routes/course_catalogue/family-groups";

/*===== Layouts =====*/
// The header has two shapes. Stacked, it is a row across the top of the family's panel: a small dog on a short piece
// of path at the start, the name and its line beside him. As a stage, it is the panel's start column, as tall as the
// cards: the name at the top, the path along the bottom and the dog standing on it. The panel picks the breakpoint at
// which it becomes a stage, or `none` to stay a row (see `ResultsGrid`); each class set is written out whole for
// Tailwind to find.
const STAGE_FROM = {
  sm: {
    root: "sm:relative sm:min-h-80 sm:flex-col sm:items-stretch sm:gap-0 sm:p-6",
    art: "sm:absolute sm:inset-x-0 sm:bottom-0 sm:h-56 sm:w-auto",
    ground: "sm:h-12",
    dog: "sm:bottom-[1.7rem] sm:h-44",
    scene: "sm:bottom-[1.7rem]",
    bubble: "sm:block",
    sky: "sm:block",
    words: "sm:order-first sm:pb-0",
  },
  lg: {
    root: "lg:relative lg:min-h-80 lg:flex-col lg:items-stretch lg:gap-0 lg:p-6",
    art: "lg:absolute lg:inset-x-0 lg:bottom-0 lg:h-56 lg:w-auto",
    ground: "lg:h-12",
    dog: "lg:bottom-[1.7rem] lg:h-44",
    scene: "lg:bottom-[1.7rem]",
    bubble: "lg:block",
    sky: "lg:block",
    words: "lg:order-first lg:pb-0",
  },
  none: { root: "", art: "", ground: "", dog: "", scene: "", bubble: "", sky: "", words: "" },
} as const;

/*===== Family Group Header =====*/
/**
 * The top (or start column) of a family's panel: the family's dog standing on his path, the family name and one plain
 * line. The dog is decoration (the heading names the family), so the picture is hidden from assistive tech.
 */
export function FamilyGroupHeader({
  group,
  headingId,
  stageFrom,
  bigDog = false,
}: {
  group: FamilyGroup;
  headingId: string;
  /** From which width the header becomes the panel's start column. */
  stageFrom: keyof typeof STAGE_FROM;
  /** A wide or tall stage (on a laptop) gets a larger dog, so it isn't an empty stretch. */
  bigDog?: boolean;
}) {
  const stage = STAGE_FROM[stageFrom];
  const pose = familyMascotPose(group.family);

  return (
    <div className={cn("flex items-end gap-4 px-4 pt-4 sm:px-6 sm:pt-5", stage.root)}>
      {/* The sky fills the stage between the family's name and the dog's bubble. */}
      <NightSky className={cn("inset-x-6 top-28 bottom-60 hidden", stage.sky)} />

      {/*------ The Dog on His Path ------*/}
      <div aria-hidden className={cn("relative h-24 w-28 shrink-0 sm:h-32 sm:w-40", stage.art)}>
        {/* A pool of warm light where he stands. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]" />
        <div
          className={cn(
            "absolute inset-x-0 top-0 bottom-[0.9rem] sm:bottom-[1.2rem]",
            stage.scene,
            bigDog && "lg:bottom-[2rem]",
          )}
        >
          {/* The place his courses happen (`~/lib/course-scenes`). */}
          {courseScene(group.family).map((piece, index) => (
            <MascotCut
              key={index}
              name={piece.name}
              className={cn("absolute bottom-0 translate-y-[6%] scenery-dim", piece.className)}
            />
          ))}
        </div>
        {/* The path fades out at both ends, so it doesn't run hard into the cards or the panel's rounded corner. */}
        <GroundStrip
          className={cn(
            "absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:h-9",
            stage.ground,
          )}
        />
        {/* On a stage he says his pose's line, which fills the stage's sky; the slim row on phones has no room. The
            words are flavour (the heading names the family), so they stay hidden with the picture. */}
        <ChalkBubble
          tail="left"
          className={cn(
            "lively-reveal-pop absolute inset-x-0 bottom-full mx-auto mb-2 hidden max-w-[calc(100%-2rem)] text-center text-pretty md:text-base lg:max-w-[15rem]",
            stage.bubble,
            bigDog && "lg:mb-[4.5rem]",
          )}
        >
          {courseMascotLine(pose)}
        </ChalkBubble>
        <MascotCut
          name={pose}
          className={cn(
            // He idles in place: the frisbee catcher floats, the others breathe.
            pose === "course-sport" ? "lively-float" : "lively-breathe",
            "absolute start-1/2 bottom-[0.9rem] h-[4.75rem] w-auto translate-x-1/2 sm:bottom-[1.2rem] sm:h-28",
            stage.dog,
            bigDog && "lg:bottom-[2rem] lg:h-64",
          )}
        />
      </div>

      {/*------ Name and Line ------*/}
      <div className={cn("relative min-w-0 pb-4", stage.words)}>
        <h3 id={headingId} className={`${DISPLAY_HEADING} text-xl sm:text-2xl lg:text-3xl`}>
          {group.label}
        </h3>
        {group.line && <p className="mt-1 max-w-md text-sm text-pretty text-muted-foreground sm:mt-2">{group.line}</p>}
      </div>
    </div>
  );
}
