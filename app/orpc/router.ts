import {
  adminDogEligibilityProcedure,
  adminListPaymentsProcedure,
  dogEligibilityProcedure,
  listMyPaymentsProcedure,
  payCartProcedure,
  reviewCartProcedure,
} from "~/orpc/checkout/procedure";
import {
  adminListCommissionsProcedure,
  adminMarkCommissionPaidProcedure,
  listMyCommissionsProcedure,
} from "~/orpc/commission/procedure";
import { getCourseProcedure, listCoursesProcedure } from "~/orpc/course/procedure";
import { adminOverviewProcedure } from "~/orpc/dashboard/procedure";
import {
  adminGetDogProcedure,
  adminListDogsProcedure,
  adminUpdateDogProcedure,
  createDogProcedure,
  getDogProcedure,
  listDogsProcedure,
  setPassedCourseProcedure,
  updateDogProcedure,
} from "~/orpc/dog/procedure";
import {
  adminCancelEnrollmentProcedure,
  adminCompleteEnrollmentProcedure,
  adminListEnrollmentsProcedure,
  listMyEnrollmentsProcedure,
} from "~/orpc/enrollment/procedure";
import {
  adminEvaluateProcedure,
  adminGetEvaluationProcedure,
  adminListEvaluationsProcedure,
  adminMarkEvaluatedProcedure,
  adminRejectProcedure,
  listMyEvaluationsProcedure,
  requestEvaluationProcedure,
  withdrawEvaluationProcedure,
} from "~/orpc/evaluation/procedure";
import { implementer } from "~/orpc/implementer.server";
import { uploadMediaProcedure } from "~/orpc/media/procedure";
import {
  addLeadProcedure,
  adminCreatePartnerProcedure,
  adminListPartnersProcedure,
  adminSetPartnerActiveProcedure,
  getMyPartnerProfileProcedure,
  listMyLeadsProcedure,
  updateMyPartnerProfileProcedure,
} from "~/orpc/partner/procedure";

/*===== API Router =====*/
// Assembled with the undecorated implementer (see `implementer.server.ts`).
export const router = implementer.router({
  checkout: {
    eligibility: dogEligibilityProcedure,
    review: reviewCartProcedure,
    pay: payCartProcedure,
    payments: listMyPaymentsProcedure,
    admin: {
      payments: adminListPaymentsProcedure,
      dogEligibility: adminDogEligibilityProcedure,
    },
  },
  commission: {
    listMine: listMyCommissionsProcedure,
    admin: {
      list: adminListCommissionsProcedure,
      markPaid: adminMarkCommissionPaidProcedure,
    },
  },
  course: {
    list: listCoursesProcedure,
    get: getCourseProcedure,
  },
  dashboard: {
    admin: {
      overview: adminOverviewProcedure,
    },
  },
  dog: {
    list: listDogsProcedure,
    get: getDogProcedure,
    create: createDogProcedure,
    update: updateDogProcedure,
    admin: {
      list: adminListDogsProcedure,
      get: adminGetDogProcedure,
      update: adminUpdateDogProcedure,
      setPassedCourse: setPassedCourseProcedure,
    },
  },
  enrollment: {
    listMine: listMyEnrollmentsProcedure,
    admin: {
      list: adminListEnrollmentsProcedure,
      complete: adminCompleteEnrollmentProcedure,
      cancel: adminCancelEnrollmentProcedure,
    },
  },
  evaluation: {
    request: requestEvaluationProcedure,
    withdraw: withdrawEvaluationProcedure,
    listMine: listMyEvaluationsProcedure,
    admin: {
      list: adminListEvaluationsProcedure,
      get: adminGetEvaluationProcedure,
      evaluate: adminEvaluateProcedure,
      reject: adminRejectProcedure,
      markEvaluated: adminMarkEvaluatedProcedure,
    },
  },
  media: {
    upload: uploadMediaProcedure,
  },
  partner: {
    getMine: getMyPartnerProfileProcedure,
    updateMine: updateMyPartnerProfileProcedure,
    leads: {
      list: listMyLeadsProcedure,
      add: addLeadProcedure,
    },
    admin: {
      list: adminListPartnersProcedure,
      create: adminCreatePartnerProcedure,
      setActive: adminSetPartnerActiveProcedure,
    },
  },
});
