import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { DogStatus } from "~/lib/dog-status";
import type { Dog } from "~/orpc/dog/contract";

/*===== Types =====*/
/**
 * How a stop looks: `done` is a filled gold disc with a check, `current` the lit stop (a gold ring that breathes, its
 * label gold), `locked` a muted ring with a lock, `ahead` a muted empty ring.
 */
export type RoadTone = "done" | "current" | "locked" | "ahead";

/** What sits inside a stop's ring. A rejected evaluation is the current stop, but its ring is muted with a small x. */
export type RoadMark = "check" | "hollow" | "dot" | "x" | "lock";

export type RoadStopId = "intro" | "evaluation" | "courses" | "passed";

export type RoadStop = {
  id: RoadStopId;
  label: string;
  /** One short fact under the label; null where the stop lists things instead (the active courses). */
  fact: string | null;
  tone: RoadTone;
  mark: RoadMark;
};

/*===== Road =====*/
/** The evaluation stop while it is the lit one. */
function atEvaluation(fact: string, mark: RoadMark = "hollow"): RoadStop {
  return { id: "evaluation", label: "ارزیابی", fact, tone: "current", mark };
}

/**
 * A dog's road on the Dashboard, in order: introduced → evaluation → courses → passed. Everything comes from what the
 * page already has: the dog (its `createdAt`, its passed courses), `getDogStatus` and its active enrollments.
 *
 * The current stop is where the one action is: the evaluation until the dog is evaluated, the courses after. The
 * passed stop is never "current" (there is no last step to take); it is done as soon as one course is passed.
 */
export function buildRoad({
  dog,
  status,
  activeCount,
}: {
  dog: Pick<Dog, "createdAt" | "passedCourses">;
  status: DogStatus;
  activeCount: number;
}): { stops: RoadStop[]; current: number } {
  const trainer = HEAD_TRAINER.firstName;
  const evaluated = status.kind === "evaluated" || status.kind === "training";
  const passed = dog.passedCourses.length;

  /*------ Evaluation ------*/
  const evaluation: RoadStop = evaluated
    ? { id: "evaluation", label: "ارزیابی", fact: "ارزیابی شد", tone: "done", mark: "check" }
    : status.kind === "waiting"
      ? atEvaluation(`منتظر زنگ ${trainer}`)
      : status.kind === "rejected"
        ? atEvaluation("جواب داده شد", "x")
        : atEvaluation("رایگانه");

  /*------ Courses ------*/
  // A dog that has passed courses but has none running now hasn't "never bought": it just has no new one yet.
  const courses: RoadStop = !evaluated
    ? { id: "courses", label: "دوره‌ها", fact: "بعد از ارزیابی", tone: "locked", mark: "lock" }
    : activeCount > 0
      ? { id: "courses", label: "دوره‌ها", fact: null, tone: "current", mark: "dot" }
      : {
          id: "courses",
          label: "دوره‌ها",
          fact: passed > 0 ? "دوره‌ی تازه‌ای نخریدی" : "هنوز نخریدی",
          tone: "current",
          mark: "hollow",
        };

  return {
    current: evaluated ? 2 : 1,
    stops: [
      {
        id: "intro",
        label: "معرفی",
        fact: formatJalaliTimestamp(dog.createdAt),
        tone: "done",
        mark: "check",
      },
      evaluation,
      courses,
      passed > 0
        ? { id: "passed", label: "گذرونده", fact: null, tone: "done", mark: "check" }
        : { id: "passed", label: "گذرونده", fact: "هنوز هیچی", tone: "ahead", mark: "hollow" },
    ],
  };
}
