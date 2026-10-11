import { courseContract } from "~/orpc/course/contract";
import { dogContract } from "~/orpc/dog/contract";
import { mediaContract } from "~/orpc/media/contract";
import { petContract } from "~/orpc/pet/contract";

/*===== API Contract =====*/
// Source of truth for the API. The browser client is typed from this, never from the router.
export const contract = {
  course: courseContract,
  dog: dogContract,
  media: mediaContract,
  pet: petContract,
};
