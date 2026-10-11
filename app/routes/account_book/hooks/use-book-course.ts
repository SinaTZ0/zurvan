import { useMutation } from "@tanstack/react-query";

import { client } from "~/orpc/client";

/*===== Book Course =====*/
/**
 * Books the course (or its test) and creates a pending order. The caller maps the errors; they differ by what to do
 * next. Nothing to invalidate: no list on any page shows a pending order.
 */
export function useBookCourse() {
  return useMutation({
    // Wrapped, so TanStack's mutation context isn't passed on as the call's options.
    mutationFn: (input: Parameters<typeof client.order.book>[0]) => client.order.book(input),
  });
}
