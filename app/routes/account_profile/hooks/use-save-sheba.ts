import { useMutation } from "@tanstack/react-query";

import { orpc } from "~/orpc/client";

/*===== Save Sheba =====*/
/** Saves the partner's Sheba. The input is the normalized text; the server checks it again (it is the authority). */
export function useSaveSheba() {
  return useMutation(orpc.partner.updateMine.mutationOptions());
}
