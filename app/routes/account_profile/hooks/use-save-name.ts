import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { authClient } from "~/lib/auth-client";
import { refreshSession } from "~/lib/session-guard";
import type { NameFormValues } from "~/routes/account_profile/schema";
import { describeNameError } from "~/routes/account_profile/server-errors";

/*===== Save Name =====*/
/**
 * Saves the first and last name through Better-Auth, the same call as the sign-in name step. Better-Auth's own `name`
 * is what it shows wherever a full name is needed, so it follows the two parts. A failure throws an `Error` whose
 * message is already the Persian sentence to show.
 *
 * On success the session is asked for again and the router re-runs the account guard, whose `user` is the route
 * context the header greets by name, so the header's first name changes without a reload.
 */
export function useSaveName() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ firstName, lastName }: NameFormValues) => {
      let result: Awaited<ReturnType<typeof authClient.updateUser>>;
      try {
        result = await authClient.updateUser({ firstName, lastName, name: `${firstName} ${lastName}` });
      } catch {
        // A dropped connection can reject instead of answering with an error object.
        throw new Error(describeNameError(null));
      }
      if (result.error) throw new Error(describeNameError(result.error));
    },
    onSuccess: async () => {
      await refreshSession(queryClient);
      await router.invalidate();
    },
  });
}
