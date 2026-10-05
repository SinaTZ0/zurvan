import { atom } from "jotai";

/*===== Source State =====*/
// Set by the add-pet form, read by the pet list to briefly highlight the new row. The form and the
// list are separate branches of the page, so this is shared client state rather than a prop.
export const lastAddedPetIdAtom = atom<string | null>(null);
