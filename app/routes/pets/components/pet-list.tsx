import { useAtom } from "jotai";
import { useEffect } from "react";

import type { Pet } from "~/orpc/pet/contract";
import { lastAddedPetIdAtom } from "~/routes/pets/atoms";
import { PetRow } from "~/routes/pets/components/pet-row";

const HIGHLIGHT_MS = 2_500;

/*===== Pet List =====*/
/** The user's pets, newest first. Renders nothing when empty: the hero carries the empty state. */
export function PetList({ pets }: { pets: Pet[] }) {
  const [lastAddedPetId, setLastAddedPetId] = useAtom(lastAddedPetIdAtom);

  // The highlight answers the user's action, then fades so the list returns to calm.
  useEffect(() => {
    if (!lastAddedPetId) return;
    const timer = setTimeout(() => setLastAddedPetId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [lastAddedPetId, setLastAddedPetId]);

  if (pets.length === 0) return null;

  return (
    <section aria-labelledby="pet-list-title" className="flex flex-col gap-3">
      <h2 id="pet-list-title" className="text-lg">
        حیوان‌های من
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {pets.map((pet) => (
          <PetRow key={pet.id} pet={pet} highlighted={pet.id === lastAddedPetId} />
        ))}
      </ul>
    </section>
  );
}
