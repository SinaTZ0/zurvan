import { courseContract } from "~/orpc/course/contract";
import { petContract } from "~/orpc/pet/contract";

/*===== API Contract =====*/
// Source of truth for the API. The browser client is typed from this, never from the router.
export const contract = {
  course: courseContract,
  pet: petContract,
};
