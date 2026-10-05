/*===== Pet Constants =====*/
// Browser-safe values shared by the API and the add-pet form.

export const PET_SPECIES = ["dog", "cat", "bird", "fish", "other"] as const;

export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: "سگ",
  cat: "گربه",
  bird: "پرنده",
  fish: "ماهی",
  other: "سایر",
};

export const PET_NAME_MAX_LENGTH = 40;
export const PET_BREED_MAX_LENGTH = 60;
export const PET_AGE_MAX_YEARS = 50;
