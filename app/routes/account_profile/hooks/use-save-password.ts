import { useMutation } from "@tanstack/react-query";

import { orpc } from "~/orpc/client";

/*===== Save Password =====*/
/** Sets or replaces the signed-in person's password. The server checks the rules again and may refuse a stale session. */
export function useSavePassword() {
  return useMutation(orpc.password.set.mutationOptions());
}
