import { z } from "zod";

import { orpc } from "~/orpc/client";
import type { Dog } from "~/orpc/dog/contract";
import { DogForm } from "~/routes/account_dog_form/components/dog-form";
import { DogFormError } from "~/routes/account_dog_form/components/dog-form-error";
import { PageHeader } from "~/routes/account_dog_form/components/page-header";

// What the two routes share (`account-dog-new.tsx` at `/account/dogs/new`, `account-dog-edit.tsx` at
// `/account/dogs/$dogId/edit`). Each route file has its own guard, loader and title; which file rendered the page is
// what says whether a dog is being added or edited.

/*===== Search Params =====*/
/** Only same-site paths, so a crafted link can't send someone to another site after saving. */
function isSamePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

/**
 * `?redirectTo=` is where to go after saving (and on «انصراف»), when another page sent the owner here (the assessment
 * page, a course's buy card). Anything but a same-site path is ignored.
 */
export const dogFormSearchSchema = z.object({
  redirectTo: z.string().refine(isSamePath).optional().catch(undefined),
});

/*===== Queries =====*/
/**
 * The dog being edited. Fresh for 30 seconds rather than 5 minutes: whether its birth date and breed are locked is the
 * Admin's evaluation (docs/tanstack-start/tanstack-start-migration-plan.md, decision 2).
 */
export const editDogQuery = (dogId: string) => orpc.dog.get.queryOptions({ input: { id: dogId }, staleTime: 30_000 });

/*===== Dog Form =====*/
/**
 * F2's form for adding a dog and for editing one: the buddy's file being written. The customer's dog's print fills in
 * beside the form as it is typed, and the center's dog looks after each of its three plates; the form is `DogForm`.
 */
export function DogFormPage({ dog, redirectTo }: { dog: Dog | null; redirectTo: string | undefined }) {
  return <DogForm dog={dog} redirectTo={redirectTo ?? null} header={<PageHeader dog={dog} />} />;
}

/*===== Errors =====*/
// Inside the account shell, so the header and its way back stay on screen. The API answers NOT_FOUND for another
// owner's dog too, so a made-up id and someone else's dog both get the 404 look.
export const DogFormNotFound = () => <DogFormError notFound />;

export const DogFormFailed = () => <DogFormError notFound={false} />;
