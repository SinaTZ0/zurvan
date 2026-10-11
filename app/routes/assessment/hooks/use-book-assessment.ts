import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client, orpc } from "~/orpc/client";

/*===== Book Assessment =====*/
/** Books the chosen time for the chosen dog. The caller maps the errors; they differ by what to do next. */
export function useBookAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    // Wrapped, so TanStack's mutation context isn't passed on as the call's options.
    mutationFn: (input: Parameters<typeof client.assessment.book>[0]) => client.assessment.book(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.assessment.key() }),
  });
}
