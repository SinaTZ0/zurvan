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
import { getCourseProcedure, listCoursesProcedure } from "~/orpc/course/procedure";
import {
  createDogProcedure,
  getDogProcedure,
  listDogsProcedure,
  removeDogProcedure,
  updateDogProcedure,
} from "~/orpc/dog/procedure";
import { implementer } from "~/orpc/implementer.server";
import { uploadMediaProcedure } from "~/orpc/media/procedure";

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
  media: {
    upload: uploadMediaProcedure,
  },
});
