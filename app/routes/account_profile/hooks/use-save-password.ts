import { useMutation, useQueryClient } from "@tanstack/react-query";

import { orpc } from "~/orpc/client";

/*===== Save Password =====*/
/**
 * Sets or replaces the signed-in person's password. The server checks the rules again and may refuse a stale session.
 *
 * The card shows the change from its own state, so the cached `password.status` is only marked stale
 * (`refetchType: "none"`), for the next visit: refetching it now would change the card's `hasPassword` under its
 * arriving words and cut their animation short.
 */
export function useSavePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.password.set.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.password.key(), refetchType: "none" }),
  });
}
