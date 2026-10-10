import { PawPrintIcon } from "lucide-react";

import { formatNumberFa } from "~/lib/digits";
import type { Pet } from "~/orpc/pet/contract";
import { formatPetNames } from "~/routes/pets/describe-pet";
import { SpeciesIcon } from "~/routes/pets/components/species-icon";

const MAX_AVATARS = 4;

/*===== Family Hero =====*/
/**
 * The page's one bold element: a hero card (ivory by day, ink by night) that names the user's pets, with their species
 * as an overlapping row of gold-ringed avatars, like a family portrait.
 */
export function FamilyHero({ pets }: { pets: Pet[] }) {
  const isEmpty = pets.length === 0;
  const shownPets = pets.slice(0, MAX_AVATARS);
  const hiddenCount = pets.length - shownPets.length;

  return (
    <section
      aria-labelledby="family-hero-title"
      className="relative isolate overflow-hidden rounded-2xl surface-inverse p-6 sm:p-8 lg:flex lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-8 lg:p-10"
    >
      {/* Brand motif as a single accent, not a pattern. */}
      <PawPrintIcon
        aria-hidden
        strokeWidth={1.2}
        className="absolute -end-8 -bottom-10 -z-10 size-48 -rotate-12 text-saffron/10"
      />

      {/*------ Avatars ------*/}
      {/* First in the DOM so phones show the portrait above the names; desktop reverses the row to
          put the names at the start and the portrait at the end. */}
      <div className="flex shrink-0">
        {isEmpty ? (
          <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-saffron/60 text-saffron lg:size-16">
            <PawPrintIcon strokeWidth={1.7} className="size-6 lg:size-7" aria-hidden />
          </span>
        ) : (
          <>
            {shownPets.map((pet, index) => (
              <span
                key={pet.id}
                className="flex size-14 items-center justify-center rounded-full bg-inverse text-saffron ring-2 ring-saffron not-first:-ms-3 lg:size-16"
                style={{ zIndex: shownPets.length - index }}
              >
                <SpeciesIcon species={pet.species} className="size-6 lg:size-7" />
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="-ms-3 flex size-14 items-center justify-center rounded-full bg-saffron text-sm font-extrabold text-inverse ring-2 ring-inverse lg:size-16">
                {formatNumberFa(hiddenCount)}+
              </span>
            )}
          </>
        )}
      </div>

      {/*------ Copy ------*/}
      <div className="mt-5 lg:mt-0">
        <h2 id="family-hero-title" className="text-2xl leading-snug text-balance sm:text-[1.75rem]">
          {isEmpty ? "خانواده‌ات اینجا جمع می‌شود" : formatPetNames(pets.map((pet) => pet.name))}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isEmpty
            ? "اولین حیوانت را با فرم «حیوانت را اضافه کن» ثبت کن."
            : `${formatNumberFa(pets.length)} حیوان در پرونده‌ی تو`}
        </p>
      </div>
    </section>
  );
}
