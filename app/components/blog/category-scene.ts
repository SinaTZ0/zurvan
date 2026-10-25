import type { MascotCutName } from "~/components/mascot-cut";
import type { BlogCategory } from "~/orpc/blog/constants";
import { m } from "~/paraglide/messages";

/*===== Category Scene =====*/
// The article header's stage, one per section, so a section looks like the same place on every post: the thinking dog
// by the park bench for behavior, the dog balancing a treat by the lesson's chalkboard for training, the clipboard dog
// in front of the clinic for care, the playful pup by the toy chest for puppies. The line is his greeting to the reader:
// what he is doing and how he feels, never what the post promises.
//
// Every piece is placed as a share of the stage's width and stands on its path. The cut-outs all face right, so the
// stage is laid out in logical sides and mirrored on the English pages (`ltr:-scale-x-100` on each picture): the dog
// stands on the start side, nearest the words, and looks at them.

export type CategoryScene = {
  dog: MascotCutName;
  /** The dog's height on phones and from `lg` (its width follows the picture). */
  dogClass: string;
  scenery: MascotCutName;
  /** Where the dimmed scenery stands and how wide it is. */
  sceneryClass: string;
  /** Where the bubble sits over his head; its tail is on its start side, over him. */
  bubbleClass: string;
  line: () => string;
};

const SCENES: Record<BlogCategory, CategoryScene> = {
  behavior: {
    dog: "think",
    dogClass: "start-[16%] h-[7.6rem] lg:start-[14%] lg:h-[12.5rem]",
    scenery: "bench",
    sceneryClass: "end-[-2%] w-[64%] lg:w-[66%]",
    bubbleClass: "start-[8%] bottom-[calc(0.9rem+7.9rem)] lg:start-[6%] lg:bottom-[calc(1.2rem+13rem)]",
    line: m.blog_article_scene_behavior,
  },
  training: {
    dog: "course-basics",
    dogClass: "start-[16%] h-[8rem] lg:start-[14%] lg:h-[13rem]",
    scenery: "chalkboard",
    sceneryClass: "end-[6%] w-[44%] lg:w-[42%]",
    bubbleClass: "start-[8%] bottom-[calc(0.9rem+8.3rem)] lg:start-[6%] lg:bottom-[calc(1.2rem+13.5rem)]",
    line: m.blog_article_scene_training,
  },
  care: {
    dog: "clipboard",
    dogClass: "start-[16%] h-[7.8rem] lg:start-[14%] lg:h-[12.8rem]",
    scenery: "clinic",
    sceneryClass: "end-[0%] w-[54%] lg:w-[56%]",
    bubbleClass: "start-[8%] bottom-[calc(0.9rem+8.1rem)] lg:start-[6%] lg:bottom-[calc(1.2rem+13.3rem)]",
    line: m.blog_article_scene_care,
  },
  puppy: {
    dog: "course-young",
    dogClass: "start-[12%] h-[6.8rem] lg:start-[10%] lg:h-[11rem]",
    scenery: "toy-box",
    sceneryClass: "end-[2%] w-[42%] lg:w-[44%]",
    bubbleClass: "start-[10%] bottom-[calc(0.9rem+7.1rem)] lg:start-[8%] lg:bottom-[calc(1.2rem+11.5rem)]",
    line: m.blog_article_scene_puppy,
  },
};

/** The stage of a post's section. */
export function categoryScene(category: BlogCategory): CategoryScene {
  return SCENES[category];
}
