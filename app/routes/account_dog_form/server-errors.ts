import { ORPCError } from "@orpc/client";
import type { UseFormSetError } from "react-hook-form";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { errorDataSchema } from "~/orpc/errors";
import { type DogFormInput, SERVER_FIELD_TO_FORM } from "~/routes/account_dog_form/schema";

/*===== Form Fields =====*/
/** Server field names that are also form field names, so the server's message lands on the field of the same name. */
const FORM_FIELDS = new Set<string>([
  "photoMediaId",
  "name",
  "breed",
  "sex",
  "isNeutered",
  "vaccinationStatus",
  "microchipNumber",
  "behaviorNotes",
  "medicalNotes",
]);

/*===== Server Errors =====*/
/**
 * Puts the server's messages next to their fields, and anything else in the form-level alert. The two procedures
 * (`dog.create` and `dog.update`) share one mutation, so its error isn't typed per procedure; the shared error shape
 * is checked here instead. Never throws: every failure ends as a field error or as `root`.
 */
export function applyServerError({ error, setError }: { error: Error; setError: UseFormSetError<DogFormInput> }) {
  const parsed = error instanceof ORPCError ? errorDataSchema.safeParse(error.data) : null;
  const code = error instanceof ORPCError ? error.code : null;

  if (code === "INVALID_INPUT" && parsed?.success) {
    for (const [field, message] of Object.entries(parsed.data.fields)) {
      const target = SERVER_FIELD_TO_FORM[field] ?? (FORM_FIELDS.has(field) ? (field as keyof DogFormInput) : null);
      if (target) setError(target, { message });
    }
    const [general] = parsed.data.errors;
    if (general) {
      setError("root", { message: general });
    } else if ("birthDate" in parsed.data.fields || "breed" in parsed.data.fields) {
      // Only reachable when the dog was evaluated after this form opened, so the fields were still editable. The page
      // is stale, and the locked version shows after a refresh.
      setError("root", {
        message: `همین حالا ارزیابی ${HEAD_TRAINER.firstName} ثبت شد و تاریخ تولد و نژاد قفل شدند. صفحه را تازه کن تا فرم را قفل‌شده ببینی، بعد دوباره ذخیره کن.`,
      });
    }
    return;
  }
  if (code === "UNAUTHORIZED") {
    setError("root", { message: "از حسابت خارج شده‌ای. صفحه را تازه کن و دوباره وارد شو." });
    return;
  }
  if (code === "NOT_FOUND") {
    setError("root", { message: "این سگ دیگر در حسابت نیست." });
    return;
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    const errorId = error instanceof ORPCError && typeof error.data?.errorId === "string" ? error.data.errorId : null;
    setError("root", { message: `ذخیره نشد. دوباره امتحان کن.${errorId ? ` کد پیگیری: ${errorId}` : ""}` });
    return;
  }
  setError("root", { message: "ذخیره نشد. اتصال اینترنتت را بررسی کن و دوباره امتحان کن." });
}
