import { BirdIcon, CatIcon, DogIcon, FishIcon, type LucideProps, PawPrintIcon } from "lucide-react";

import type { PetSpecies } from "~/orpc/pet/constants";

const ICONS = {
  dog: DogIcon,
  cat: CatIcon,
  bird: BirdIcon,
  fish: FishIcon,
  other: PawPrintIcon,
} satisfies Record<PetSpecies, React.ComponentType<LucideProps>>;

/*===== Species Icon =====*/
/** Line icon for a species, using the app's 1.7 stroke. Decorative: the species is always also written out. */
export function SpeciesIcon({ species, ...props }: LucideProps & { species: PetSpecies }) {
  const Icon = ICONS[species];
  return <Icon strokeWidth={1.7} aria-hidden {...props} />;
}
