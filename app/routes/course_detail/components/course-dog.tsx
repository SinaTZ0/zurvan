import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { courseMascotLine, courseMascotPose } from "~/lib/course-mascot";
import type { Course } from "~/orpc/course/contract";

/*===== Course Dog =====*/
/**
 * The course's own dog, standing on the buy card's top edge at its end corner (the left, in RTL), with the line that
 * belongs to his pose in a bubble on his start side. This is the mascot's voice: it only describes the picture. The
 * customer's own dog answers in the dog list further down, so the two voices never share a bubble.
 *
 * The zone has a fixed height and sits flush on the card (a few pixels of overlap hide the cut-out's soft feet), so the
 * card below never moves whatever the line's length. Cut-outs are low resolution: 10rem / 8rem is about their natural
 * height, no more. Physical sides (`left`, `right`) are on purpose: he is pinned to the card's left corner in RTL.
 */
export function CourseDog({ course }: { course: Course }) {
  const pose = courseMascotPose({ slug: course.slug, family: course.family });

  return (
    <div className="relative z-10 -mb-[3px] flex h-[9.75rem] items-end justify-end gap-1 px-5 lg:h-40">
      {/*------ Bubble ------*/}
      {/* Raised to his head height, its tail aimed down-left at him (physical: he is on its left). */}
      {/* It pops from its tail a moment after the page opens, once; he idles in place (the frisbee catcher floats,
          the others breathe). */}
      <ChalkBubble
        tail="left"
        className="answer-pop mb-[5.25rem] max-w-[13rem] [--answer-delay:0.4s] [--pop-origin:1.75rem_100%] lg:mb-[5.75rem] lg:max-w-[15rem]"
      >
        {courseMascotLine(pose)}
      </ChalkBubble>

      {/*------ Dog ------*/}
      {/* He stands in a little garden on the card's edge, as the catalogue's dog looks over his wall: a bush either
          side and a pool of warm light behind him. The end side's bush is small, so it doesn't run past the card's
          rounded corner. */}
      <div className="relative shrink-0">
        <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_55%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[62%] w-[52%]" />
        <MascotCut name="plants" className="lively-sway-2 absolute right-[78%] bottom-0 w-[34%] -scale-x-100" />
        <MascotCut
          name={pose}
          eager
          className={cn(
            pose === "course-sport" ? "lively-float" : "lively-breathe",
            "relative h-32 w-auto lg:h-40",
          )}
        />
      </div>
    </div>
  );
}
