import { checkoutContract } from "~/orpc/checkout/contract";
import { commissionContract } from "~/orpc/commission/contract";
import { courseContract } from "~/orpc/course/contract";
import { dogContract } from "~/orpc/dog/contract";
import { enrollmentContract } from "~/orpc/enrollment/contract";
import { evaluationContract } from "~/orpc/evaluation/contract";
import { mediaContract } from "~/orpc/media/contract";
import { partnerContract } from "~/orpc/partner/contract";

/*===== API Contract =====*/
// Source of truth for the API. The browser client is typed from this, never from the router.
export const contract = {
  checkout: checkoutContract,
  commission: commissionContract,
  course: courseContract,
  dog: dogContract,
  enrollment: enrollmentContract,
  evaluation: evaluationContract,
  media: mediaContract,
  partner: partnerContract,
};
