import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useNavigate } from "react-router";

import { resetCartAtom } from "~/atoms/cart";
import { toast } from "~/components/ui/toast";
import { authClient } from "~/lib/auth-client";

/*===== Sign Out =====*/
/**
 * Signs out and goes to the sign-in page, then forgets this account's cached data. `redirectTo`, a path on this site, is
 * where the sign-in page sends the person once they are back in (the password card asks for a fresh sign-in).
 */
export function useSignOut({ redirectTo }: { redirectTo?: string } = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetCart = useSetAtom(resetCartAtom);

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Sign-out failed");
    },
    onSuccess: async () => {
      await navigate(redirectTo ? `/auth?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth", {
        viewTransition: true,
      });
      // The next account on this device must not see this one's cached dogs. Cleared after leaving: clearing while a
      // page is mounted would refetch its queries without a session.
      queryClient.clear();
      // The account keeps its cart; this browser must not show it to the next person, or merge it into their account.
      resetCart();
    },
    onError: () => {
      toast.add({ title: "خروج انجام نشد. دوباره امتحان کن.", type: "error" });
    },
  });
}
