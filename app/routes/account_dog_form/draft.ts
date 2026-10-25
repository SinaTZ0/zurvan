import type { DeepPartial } from "react-hook-form";

import { DOG_TRAINING_GOALS, type DogTrainingGoal } from "~/orpc/dog/constants";
import type { DogFormInput } from "~/routes/account_dog_form/schema";

/*===== New Dog Draft =====*/
// What the owner has typed into the new-dog steps, kept in `sessionStorage` so a reload, a slip of the back button
// past the first step or a look at another tab doesn't lose it. Only typed values: the uploaded photos' ids are left
// out (an upload is claimed by its dog on save, and a stale id would only bring a "upload it again" error), and so is
// `locked`. Storage can be missing or throw (a private window, blocked site data), so every access is guarded and the
// form simply starts empty.

const DRAFT_KEY = "zurvan:dog-draft:new";

/** The text fields a draft keeps (each a string in the form). */
const TEXT_FIELDS = [
  "name",
  "sex",
  "birthMode",
  "birthDay",
  "birthMonth",
  "birthYear",
  "ageYears",
  "ageMonths",
  "breedPurity",
  "breed",
  "breedSecondary",
  "weight",
  "isNeutered",
  "height",
  "coatColor",
  "markings",
  "vaccinationStatus",
  "vaccinationNotes",
  "microchipNumber",
  "implantDay",
  "implantMonth",
  "implantYear",
  "behaviorProblems",
  "behaviorNotes",
  "medicalNotes",
] as const satisfies readonly (keyof DogFormInput)[];

export type DogFormDraft = Partial<Pick<DogFormInput, (typeof TEXT_FIELDS)[number] | "trainingGoals">>;

/** The saved draft, or null when there is none, it can't be read, or it isn't a draft. */
export function readDraft(): DogFormDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    // Only known keys with the right type, so an old or tampered entry can't put odd values in the form.
    const source = parsed as Record<string, unknown>;
    const draft: Record<string, unknown> = {};
    for (const field of TEXT_FIELDS) {
      if (typeof source[field] === "string") draft[field] = source[field];
    }
    if (Array.isArray(source.trainingGoals)) {
      draft.trainingGoals = source.trainingGoals.filter((goal): goal is DogTrainingGoal =>
        DOG_TRAINING_GOALS.includes(goal as DogTrainingGoal),
      );
    }
    return Object.keys(draft).length > 0 ? (draft as DogFormDraft) : null;
  } catch {
    return null;
  }
}

/** Keeps the typed values (never the photo ids). */
export function writeDraft(values: DeepPartial<DogFormInput>): void {
  const draft: Record<string, unknown> = {};
  for (const field of TEXT_FIELDS) {
    if (typeof values[field] === "string") draft[field] = values[field];
  }
  if (Array.isArray(values.trainingGoals)) draft.trainingGoals = values.trainingGoals.filter(Boolean);
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Full or blocked storage: the form works without its draft.
  }
}

/** Forgets the draft, once the dog is saved. */
export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}
