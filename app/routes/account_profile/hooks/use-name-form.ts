import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { toast } from "~/components/ui/toast";
import { useSaveName } from "~/routes/account_profile/hooks/use-save-name";
import { type NameFormValues, nameFormSchema } from "~/routes/account_profile/schema";

/*===== Name Form =====*/
/**
 * The name form's state, held by the page rather than the card so the tag can follow what is typed.
 *
 * `saved` starts from the loader and moves to the submitted values on success, so the tag and the disabled save button
 * are right at once, without waiting for the route to reload (which still happens: the headers need the new name).
 * `onFailed` runs for a refused submit, the form's own checks or the server's, so the card's dog can say so.
 */
export function useNameForm({
  initial,
  onSaved,
  onFailed,
}: {
  initial: NameFormValues;
  onSaved: () => void;
  onFailed: () => void;
}) {
  const [saved, setSaved] = useState(initial);
  const saveName = useSaveName();
  const form = useForm<NameFormValues>({ resolver: zodResolver(nameFormSchema), defaultValues: initial });

  /*------ Live Values ------*/
  const values = useWatch({ control: form.control });
  const live = { firstName: values.firstName?.trim() ?? "", lastName: values.lastName?.trim() ?? "" };
  // Blank fields fall back to the saved name, so the tag is never empty while someone is rewriting a field.
  const preview = {
    firstName: live.firstName || saved.firstName,
    lastName: live.lastName || saved.lastName,
  };
  const isDirty = live.firstName !== saved.firstName || live.lastName !== saved.lastName;

  /*------ Submit ------*/
  const onSubmit = form.handleSubmit((submitted) => {
    saveName.mutate(submitted, {
      onSuccess: () => {
        setSaved(submitted);
        form.reset(submitted);
        toast.add({ title: "ذخیره شد.", type: "success" });
        onSaved();
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
        onFailed();
      },
    });
  }, onFailed);

  return { form, onSubmit, isPending: saveName.isPending, isDirty, preview };
}
