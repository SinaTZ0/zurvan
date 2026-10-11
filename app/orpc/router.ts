import { createCaptchaChallengeProcedure } from "~/orpc/captcha/procedure";
import { getCourseProcedure, listCoursesProcedure } from "~/orpc/course/procedure";
import { implementer } from "~/orpc/implementer.server";
import { createPetProcedure, listPetsProcedure } from "~/orpc/pet/procedure";

/*===== API Router =====*/
// Assembled with the undecorated implementer (see `implementer.server.ts`).
export const router = implementer.router({
  captcha: {
    createChallenge: createCaptchaChallengeProcedure,
  },
  course: {
    list: listCoursesProcedure,
    get: getCourseProcedure,
  },
  pet: {
    list: listPetsProcedure,
    create: createPetProcedure,
  },
});
