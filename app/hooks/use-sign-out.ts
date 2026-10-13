import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { toast } from "~/components/ui/toast";
import { authClient } from "~/lib/auth-client";

/*===== Sign Out =====*/
/** Signs out and goes to the sign-in page, then forgets this account's cached data. */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Sign-out failed");
    },
    onSuccess: async () => {
      await navigate("/auth", { viewTransition: true });
      // The next account on this device must not see this one's cached dogs. Cleared after leaving: clearing while a
      // page is mounted would refetch its queries without a session.
      queryClient.clear();
    },
    onError: () => {
      toast.add({ title: "خروج انجام نشد. دوباره امتحان کن.", type: "error" });
    },
  });
}
