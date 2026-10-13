import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { client, orpc } from "~/orpc/client";
import { errorDataSchema } from "~/orpc/errors";

const FALLBACK_MESSAGE = "انجام نشد. دوباره تلاش کن.";

/*===== Withdraw Evaluation Button =====*/
/**
 * A quiet button that, after a confirmation, takes back the customer's pending evaluation request (F3). `withdrawn`
 * is final, which is why it asks first; the customer can simply request again afterwards.
 *
 * Both a success and a "no longer pending" conflict reload the route loaders: in the conflict case the Admin has
 * answered in the meantime, and the page must show that answer instead of a stale button.
 */
export function WithdrawEvaluationButton({
  evaluationId,
  dogName,
  className,
  onWithdrawn,
}: {
  evaluationId: string;
  dogName: string;
  className?: string;
  /** Called after a successful withdrawal, once the data is reloading. */
  onWithdrawn?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const revalidator = useRevalidator();

  /*------ Mutation ------*/
  const withdraw = useMutation({
    mutationFn: () => client.evaluation.withdraw({ id: evaluationId }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: "درخواست پس گرفته شد.", type: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.evaluation.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.dog.key() }),
      ]);
      await revalidator.revalidate();
      onWithdrawn?.();
    },
    onError: (error) => {
      setOpen(false);
      toast.add({ title: describeFailure(error), type: "error" });
      // The request was answered or removed meanwhile: show the page as it is now.
      if (error instanceof ORPCError && (error.code === "NOT_WITHDRAWABLE" || error.code === "NOT_FOUND")) {
        void revalidator.revalidate();
      }
    },
  });

  return (
    // A pending request can't be dismissed: closing mid-flight would hide the outcome.
    <AlertDialog open={open} onOpenChange={(next) => !withdraw.isPending && setOpen(next)}>
      <Button type="button" variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        پس گرفتن درخواست
      </Button>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>درخواست ارزیابی {dogName} پس گرفته بشه؟</AlertDialogTitle>
          <AlertDialogDescription>بعدش می‌تونی دوباره درخواست بدی.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={withdraw.isPending}>نه، بمونه</AlertDialogCancel>
          <AlertDialogAction disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
            {withdraw.isPending && <Spinner aria-hidden />}
            پس بگیر
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/*===== Error Message =====*/
/** The API's own Persian message for the two expected conflicts; a fixed line for everything else. */
function describeFailure(error: unknown): string {
  if (error instanceof ORPCError && (error.code === "NOT_WITHDRAWABLE" || error.code === "NOT_FOUND")) {
    const parsed = errorDataSchema.safeParse(error.data);
    if (parsed.success && parsed.data.errors[0]) return parsed.data.errors[0];
  }
  return FALLBACK_MESSAGE;
}
