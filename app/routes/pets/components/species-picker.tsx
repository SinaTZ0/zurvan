import { PET_SPECIES, PET_SPECIES_LABELS, type PetSpecies } from "~/orpc/pet/constants";
import { SpeciesIcon } from "~/routes/pets/components/species-icon";

type SpeciesPickerProps = {
  name: string;
  value: PetSpecies | undefined;
  onChange: (value: PetSpecies) => void;
  onBlur: () => void;
  invalid: boolean;
  /** Id of the element holding the error message, linked for screen readers. */
  errorId: string;
};

/*===== Species Picker =====*/
/**
 * Icon tiles for choosing a species. Built on native radio inputs, so arrow keys, labels, and form
 * semantics work without extra code; the inputs are visually hidden and the tiles show their state.
 */
export function SpeciesPicker({ name, value, onChange, onBlur, invalid, errorId }: SpeciesPickerProps) {
  return (
    <fieldset aria-describedby={invalid ? errorId : undefined} className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">گونه حیوان</legend>
      <div className="grid grid-cols-5 gap-2">
        {PET_SPECIES.map((species) => (
          <label
            key={species}
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-transparent bg-muted px-1 py-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-accent has-checked:border-primary has-checked:bg-card has-checked:text-primary has-checked:ring-1 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50 data-invalid:border-destructive/50"
            data-invalid={invalid || undefined}
          >
            <input
              type="radio"
              name={name}
              value={species}
              checked={value === species}
              onChange={() => onChange(species)}
              onBlur={onBlur}
              className="sr-only"
            />
            <SpeciesIcon species={species} className="size-6" />
            {PET_SPECIES_LABELS[species]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
