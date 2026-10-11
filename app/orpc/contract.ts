import { assessmentContract } from "~/orpc/assessment/contract";
import { courseContract } from "~/orpc/course/contract";
import { dogContract } from "~/orpc/dog/contract";
import { enrollmentContract } from "~/orpc/enrollment/contract";
import { mediaContract } from "~/orpc/media/contract";

/*===== API Contract =====*/
// Source of truth for the API. The browser client is typed from this, never from the router.
export const contract = {
  assessment: assessmentContract,
  course: courseContract,
  dog: dogContract,
  enrollment: enrollmentContract,
  media: mediaContract,
};
