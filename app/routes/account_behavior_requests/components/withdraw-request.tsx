import { useMutation } from "@tanstack/react-query";
import { useRevalidator } from "react-router";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { client } from "~/orpc/client";
import type { CustomerBehaviorRequest } from "~/orpc/behavior-request/contract";

/*===== Withdraw Request =====*/
/**
 * «پس گرفتن درخواست»: a quiet ghost button that asks in a dialog naming the dog. The dialog stays open while the call is
 * in flight, so the person sees the answer before it closes. A refusal (the request was answered meanwhile) is a toast,
 * and the list reloads underneath so the card shows its new state.
 */
export function WithdrawRequest({ request }: { request: CustomerBehaviorRequest }) {
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);

  const withdraw = useMutation({
    mutationFn: () => client.behaviorRequest.withdraw({ id: request.id }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: "درخواست پس گرفته شد", type: "success" });
      await revalidator.revalidate();
    },
    onError: async (error) => {
      setOpen(false);
      toast.add({
        title: describeApiFailure({ error, fallback: "پس گرفته نشد. دوباره امتحان کن." }).message ?? "",
        type: "error",
      });
      await revalidator.revalidate();
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (withdraw.isPending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger render={<Button type="button" variant="ghost" className="text-muted-foreground" />}>
        پس گرفتن درخواست
        <span className="sr-only"> برای {request.dog.name}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>درخواست {request.dog.name} پس گرفته شود؟</AlertDialogTitle>
          <AlertDialogDescription>
            آرمان دیگر این درخواست را نمی‌بیند. اگر خواستی، بعداً می‌توانی درخواست تازه بفرستی.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={withdraw.isPending}>نه، بماند</AlertDialogCancel>
          {/* Not `AlertDialogAction`: it closes on click, and the dialog should wait for the answer. */}
          <Button type="button" variant="destructive" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
            {withdraw.isPending && <Spinner data-icon="inline-start" />}
            بله، پس بگیر
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
