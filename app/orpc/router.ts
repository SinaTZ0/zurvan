import {
  availableSlotsProcedure,
  bookAssessmentProcedure,
  cancelAssessmentProcedure,
  listMyAssessmentsProcedure,
  trainerCancelAssessmentProcedure,
  trainerCloseSlotProcedure,
  trainerCompleteAssessmentProcedure,
  trainerGetAssessmentProcedure,
  trainerMarkNoShowProcedure,
  trainerOpenSlotsProcedure,
  trainerScheduleProcedure,
} from "~/orpc/assessment/procedure";
import {
  behaviorRequestOptionsProcedure,
  checkoutBehaviorPlanProcedure,
  listMyBehaviorRequestsProcedure,
  submitBehaviorRequestProcedure,
  trainerDeclineBehaviorRequestProcedure,
  trainerGetBehaviorRequestProcedure,
  trainerListBehaviorRequestsProcedure,
  trainerProposeBehaviorPlanProcedure,
  withdrawBehaviorRequestProcedure,
} from "~/orpc/behavior-request/procedure";
import { getCourseProcedure, listCoursesProcedure } from "~/orpc/course/procedure";
import {
  createDogProcedure,
  getDogProcedure,
  listDogsProcedure,
  removeDogProcedure,
  updateDogProcedure,
} from "~/orpc/dog/procedure";
import {
  getMyEnrollmentProcedure,
  listMyEnrollmentsProcedure,
  trainerCancelSessionProcedure,
  trainerGetEnrollmentProcedure,
  trainerListEnrollmentsProcedure,
  trainerMarkSessionProcedure,
  trainerRecordResultProcedure,
  trainerRescheduleSessionProcedure,
  trainerScheduleSessionProcedure,
  trainerSessionsProcedure,
  trainerSetPlannedSessionsProcedure,
  trainerUpdateSessionNoteProcedure,
} from "~/orpc/enrollment/procedure";
import { implementer } from "~/orpc/implementer.server";
import { uploadMediaProcedure } from "~/orpc/media/procedure";
import {
  applyDiscountProcedure,
  bookingOptionsProcedure,
  bookProcedure,
  cancelEnrollmentProcedure,
  getOrderProcedure,
  payProcedure,
  removeDiscountProcedure,
} from "~/orpc/order/procedure";
import { myWalletProcedure } from "~/orpc/wallet/procedure";

/*===== API Router =====*/
// Assembled with the undecorated implementer (see `implementer.server.ts`).
export const router = implementer.router({
  assessment: {
    availableSlots: availableSlotsProcedure,
    book: bookAssessmentProcedure,
    listMine: listMyAssessmentsProcedure,
    cancel: cancelAssessmentProcedure,
    trainer: {
      schedule: trainerScheduleProcedure,
      openSlots: trainerOpenSlotsProcedure,
      closeSlot: trainerCloseSlotProcedure,
      get: trainerGetAssessmentProcedure,
      complete: trainerCompleteAssessmentProcedure,
      markNoShow: trainerMarkNoShowProcedure,
      cancel: trainerCancelAssessmentProcedure,
    },
  },
  behaviorRequest: {
    options: behaviorRequestOptionsProcedure,
    submit: submitBehaviorRequestProcedure,
    listMine: listMyBehaviorRequestsProcedure,
    withdraw: withdrawBehaviorRequestProcedure,
    checkout: checkoutBehaviorPlanProcedure,
    trainer: {
      list: trainerListBehaviorRequestsProcedure,
      get: trainerGetBehaviorRequestProcedure,
      propose: trainerProposeBehaviorPlanProcedure,
      decline: trainerDeclineBehaviorRequestProcedure,
    },
  },
  course: {
    list: listCoursesProcedure,
    get: getCourseProcedure,
  },
  dog: {
    list: listDogsProcedure,
    get: getDogProcedure,
    create: createDogProcedure,
    update: updateDogProcedure,
    remove: removeDogProcedure,
  },
  enrollment: {
    listMine: listMyEnrollmentsProcedure,
    get: getMyEnrollmentProcedure,
    trainer: {
      list: trainerListEnrollmentsProcedure,
      get: trainerGetEnrollmentProcedure,
      sessions: trainerSessionsProcedure,
      scheduleSession: trainerScheduleSessionProcedure,
      rescheduleSession: trainerRescheduleSessionProcedure,
      cancelSession: trainerCancelSessionProcedure,
      markSession: trainerMarkSessionProcedure,
      updateSessionNote: trainerUpdateSessionNoteProcedure,
      setPlannedSessions: trainerSetPlannedSessionsProcedure,
      recordResult: trainerRecordResultProcedure,
    },
  },
  media: {
    upload: uploadMediaProcedure,
  },
  order: {
    bookingOptions: bookingOptionsProcedure,
    book: bookProcedure,
    get: getOrderProcedure,
    applyDiscount: applyDiscountProcedure,
    removeDiscount: removeDiscountProcedure,
    pay: payProcedure,
    cancelEnrollment: cancelEnrollmentProcedure,
  },
  wallet: {
    mine: myWalletProcedure,
  },
});
