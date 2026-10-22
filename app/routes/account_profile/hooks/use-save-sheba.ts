import { useMutation, useQueryClient } from "@tanstack/react-query";

import { orpc } from "~/orpc/client";

/*===== Save Sheba =====*/
/**
 * Saves the partner's Sheba. The input is the normalized text; the server checks it again (it is the authority). The
 * partner's profile is read again afterwards: the card keeps its own copy, but the partner dashboard's notice about a
 * missing Sheba reads the profile.
 */
export function useSaveSheba() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.partner.updateMine.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.partner.key() }),
  });
}
