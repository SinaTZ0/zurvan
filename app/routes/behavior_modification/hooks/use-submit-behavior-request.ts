import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client, orpc } from "~/orpc/client";

/*===== Submit Behavior Request =====*/
/** Sends the request. The caller maps the errors; they differ by what the person has to change. */
export function useSubmitBehaviorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    // Wrapped, so TanStack's mutation context isn't passed on as the call's options.
    mutationFn: (input: Parameters<typeof client.behaviorRequest.submit>[0]) => client.behaviorRequest.submit(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.behaviorRequest.key() }),
  });
}
