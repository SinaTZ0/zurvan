import type { Pet } from "~/orpc/pet/contract";
import { PET_SPECIES, type PetSpecies } from "~/orpc/pet/constants";
import type { PetRecord } from "~/orpc/pet/repository";

/*===== Public Pet =====*/
/**
 * Converts a stored pet into its public shape: drops `ownerId` and narrows `species`, which is
 * plain text in the database.
 */
export function toPublicPet(record: PetRecord): Pet {
  return {
    id: record.id,
    name: record.name,
    // A species removed from the list later falls back to "other" instead of failing output validation.
    species: isPetSpecies(record.species) ? record.species : "other",
    breed: record.breed,
    ageYears: record.ageYears,
    createdAt: record.createdAt,
  };
}

function isPetSpecies(value: string): value is PetSpecies {
  return (PET_SPECIES as readonly string[]).includes(value);
}
