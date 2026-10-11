import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client, orpc } from "~/orpc/client";
import type { Dog } from "~/orpc/dog/contract";
import type { toDogInput } from "~/routes/account_dog_form/schema";

/*===== Save Dog =====*/
/**
 * Creates a dog, or updates it when `dogId` is given. Either way the dogs' cached queries are dropped, so the list and
 * the dog's page show the saved values.
 */
export function useSaveDog({ dogId }: { dogId: string | null }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReturnType<typeof toDogInput>): Promise<Dog> =>
      dogId ? client.dog.update({ id: dogId, ...input }) : client.dog.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.dog.key() }),
  });
}
