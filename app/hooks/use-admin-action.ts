import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { toast } from "~/components/ui/toast";
import { type ApiFailure, describeApiFailure } from "~/lib/api-error";
import { orpc } from "~/orpc/client";

/*===== Constants =====*/
// The API answers these when the row changed under the Admin's hands: another tab, or the customer withdrawing (F12,
// "statuses only move forward"). They aren't failures to retry; the list is simply stale.
const CONFLICT_CODES = new Set(["NOT_ANSWERABLE", "NOT_ACTIVE", "NOT_FOUND", "ALREADY_PAID"]);

/*===== Admin Action =====*/
/**
 * A one-click Admin button wired to a mutation: a success toast, then every API query is marked stale, so the list, the
 * dashboard's counts and the nav badges on screen refetch and show the new state (an Admin action can change any of
 * them). Used by «ارزیابی شد», «رد», «تمام شد» and «لغو».
 *
 * - **Success:** toasts `success`, refetches, then calls `onSuccess` (close the dialog, keep the drawer).
 * - **Already changed** (`NOT_ANSWERABLE`, `NOT_ACTIVE`, `NOT_FOUND`): toasts the API's own Persian message, refetches
 *   so the stale row updates, then calls `onConflict` (close the dialog).
 * - **Anything else:** `failure` holds the message and per-field messages for the dialog to show. A toast says it too
 *   unless the failure belongs to a field (`INVALID_INPUT` with `fields`) or the caller shows `failure` itself
 *   (`toastFailure: false`, for a dialog with its own alert). The caller's input is kept.
 */
export function useAdminAction<Vars, Out>({
  mutationFn,
  success,
  failureFallback = "انجام نشد. دوباره امتحان کن.",
  toastFailure = true,
  onSuccess,
  onConflict,
}: {
  mutationFn: (vars: Vars) => Promise<Out>;
  /** The toast on success, or a function of the result when it names the dog or course. */
  success: string | ((result: Out, vars: Vars) => string);
  failureFallback?: string;
  /** Set to false when the caller shows `failure` in the dialog itself, so the message isn't said twice. */
  toastFailure?: boolean;
  onSuccess?: (result: Out, vars: Vars) => void;
  onConflict?: () => void;
}) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: orpc.key() });
  const [failure, setFailure] = useState<ApiFailure | null>(null);

  const mutation = useMutation({
    mutationFn,
    onSuccess: async (result, vars) => {
      setFailure(null);
      toast.add({ title: typeof success === "function" ? success(result, vars) : success, type: "success" });
      await refresh();
      onSuccess?.(result, vars);
    },
    onError: (error) => {
      const described = describeApiFailure({ error, fallback: failureFallback });

      if (error instanceof ORPCError && CONFLICT_CODES.has(error.code)) {
        toast.add({ title: described.message ?? failureFallback, type: "error" });
        void refresh();
        onConflict?.();
        return;
      }

      setFailure(described);
      if (toastFailure && Object.keys(described.fields).length === 0) {
        toast.add({ title: described.message ?? failureFallback, type: "error" });
      }
    },
  });

  return {
    run: (vars: Vars) => mutation.mutate(vars),
    isPending: mutation.isPending,
    failure,
    /** Clears a shown failure, e.g. when the dialog is reopened. */
    reset: () => setFailure(null),
  };
}
