import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { orpc } from "~/orpc/client";
import type { Pet } from "~/orpc/pet/contract";
import { lastAddedPetIdAtom } from "~/routes/pets/atoms";

/*===== Create Pet =====*/
/**
 * Mutation for adding a pet. On success the new pet is put at the top of the cached list right
 * away (so the highlight shows on a row that already exists), then the list is refetched.
 */
export function useCreatePet() {
  const queryClient = useQueryClient();
  const setLastAddedPetId = useSetAtom(lastAddedPetIdAtom);

  return useMutation(
    orpc.pet.create.mutationOptions({
      onSuccess: (pet) => {
        queryClient.setQueryData<Pet[]>(orpc.pet.list.queryKey(), (pets) => [pet, ...(pets ?? [])]);
        setLastAddedPetId(pet.id);
        void queryClient.invalidateQueries({ queryKey: orpc.pet.key() });
      },
    }),
  );
}
