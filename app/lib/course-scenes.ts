import type { MascotCutName } from "~/components/mascot-cut";
import type { CourseFamily } from "~/orpc/course/constants";

/*===== Course Scenes =====*/
// Behind a family's dog, the place its courses happen, from the home page's scenery: the house for the house rules,
// the centre's yard for obedience, a hedge and a signpost for the walks of the companion courses, and so on. The
// catalogue's family stages and Course Detail's hero draw the same scene, so a family looks like the same place on
// both pages. Each piece is placed as a share of its box's width, so one scene fits a small row and a wide stage alike;
// the box puts them on its ground and dims them (`scenery-dim`, also on the hedge and the flag, which the home page
// keeps bright) so the dog stays the brightest thing. A family nobody drew a scene for gets the plain bushes.
export type ScenePiece = { name: MascotCutName; className: string };

const SCENES: Partial<Record<CourseFamily, ScenePiece[]>> = {
  basics: [
    { name: "home", className: "end-[2%] w-[58%]" },
    { name: "plants", className: "start-[3%] w-[24%]" },
  ],
  "six-month": [
    { name: "hedge", className: "start-[6%] w-[88%] max-w-[38rem]" },
    { name: "bone", className: "end-[8%] -bottom-[4%] w-[20%] max-w-36" },
  ],
  obedience: [{ name: "center", className: "end-[1%] w-[66%]" }],
  companion: [
    { name: "hedge", className: "end-0 w-[62%]" },
    { name: "signpost", className: "start-[4%] w-[30%]" },
  ],
  working: [
    { name: "lodge", className: "end-[2%] w-[62%]" },
    { name: "plants", className: "start-[2%] w-[22%]" },
  ],
  sport: [
    { name: "flag", className: "start-[8%] w-[22%]" },
    { name: "plants", className: "end-[4%] w-[28%] -scale-x-100" },
  ],
};

const DEFAULT_SCENE: ScenePiece[] = [
  { name: "plants", className: "start-[4%] w-[24%]" },
  { name: "plants", className: "end-[4%] w-[22%] -scale-x-100" },
];

/** The scenery pieces for a family's place. Always returns a scene. */
export function courseScene(family: CourseFamily): ScenePiece[] {
  return SCENES[family] ?? DEFAULT_SCENE;
}
