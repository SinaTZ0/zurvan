import { cn } from "cn";

import type { Pet } from "~/orpc/pet/contract";
import { describePet } from "~/routes/pets/describe-pet";
import { SpeciesIcon } from "~/routes/pets/components/species-icon";

type PetRowProps = {
  pet: Pet;
  /** Briefly true right after the pet is added, to show where it landed. */
  highlighted: boolean;
};

/*===== Pet Row =====*/
export function PetRow({ pet, highlighted }: PetRowProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-4 transition-[background-color,border-color,box-shadow] duration-700 motion-reduce:transition-none",
        highlighted && "border-primary/30 bg-accent ring-2 ring-primary/40",
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <SpeciesIcon species={pet.species} className="size-6" />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="truncate font-bold">{pet.name}</p>
        <p className="truncate text-sm text-muted-foreground">{describePet(pet)}</p>
      </div>
    </li>
  );
}
