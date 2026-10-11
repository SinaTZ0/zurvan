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
import { createPetProcedure, listPetsProcedure } from "~/orpc/pet/procedure";

/*===== API Router =====*/
// Assembled with the undecorated implementer (see `implementer.server.ts`).
export const router = implementer.router({
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
  pet: {
    list: listPetsProcedure,
    create: createPetProcedure,
  },
});
