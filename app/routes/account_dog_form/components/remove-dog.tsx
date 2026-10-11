import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
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
import { client, orpc } from "~/orpc/client";

/*===== Remove Dog =====*/
/**
 * The edit page's last, quiet action: removes the dog from the account after a confirmation that names it. Its
 * history stays on the server (soft delete), so the wording says "from your account", not "delete".
 */
export function RemoveDog({ dogId, name }: { dogId: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => client.dog.remove({ id: dogId }),
    onSuccess: async () => {
      setOpen(false);
      toast.add({ title: `${name} از حسابت برداشته شد.`, type: "success" });
      await navigate("/account/dogs", { viewTransition: true });
      void queryClient.invalidateQueries({ queryKey: orpc.dog.key() });
    },
    onError: () => toast.add({ title: "برداشته نشد. دوباره امتحان کن.", type: "error" }),
  });

  return (
    <div className="border-t pt-6">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={<Button type="button" variant="ghost" className="text-destructive" />}>
          برداشتن {name} از حسابم
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{name} از حسابت برداشته شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              دیگر در فهرست سگ‌هایت نیست و نمی‌توانی برایش رزرو کنی. پرونده‌ی آموزشش پیش آرمان می‌ماند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>نه، بماند</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending && <Spinner data-icon="inline-start" />}
              بله، بردار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
