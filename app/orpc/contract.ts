import { cartContract } from "~/orpc/cart/contract";
import { checkoutContract } from "~/orpc/checkout/contract";
import { commissionContract } from "~/orpc/commission/contract";
import { consentContract } from "~/orpc/consent/contract";
import { courseContract } from "~/orpc/course/contract";
import { dashboardContract } from "~/orpc/dashboard/contract";
import { dogContract } from "~/orpc/dog/contract";
import { enrollmentContract } from "~/orpc/enrollment/contract";
import { evaluationContract } from "~/orpc/evaluation/contract";
import { mediaContract } from "~/orpc/media/contract";
import { partnerContract } from "~/orpc/partner/contract";
import { passwordContract } from "~/orpc/password/contract";
import { settingContract } from "~/orpc/setting/contract";
import { smsContract } from "~/orpc/sms/contract";
import { userContract } from "~/orpc/user/contract";

/*===== API Contract =====*/
// Source of truth for the API. The browser client is typed from this, never from the router.
export const contract = {
  cart: cartContract,
  checkout: checkoutContract,
  commission: commissionContract,
  consent: consentContract,
  course: courseContract,
  dashboard: dashboardContract,
  dog: dogContract,
  enrollment: enrollmentContract,
  evaluation: evaluationContract,
  media: mediaContract,
  partner: partnerContract,
  password: passwordContract,
  setting: settingContract,
  sms: smsContract,
  user: userContract,
};
