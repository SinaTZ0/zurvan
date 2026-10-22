import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orNotFound } from "~/lib/not-found";
import { requireSession } from "~/lib/session-guard";
import {
  DogFormFailed,
  DogFormNotFound,
  DogFormPage,
  dogFormSearchSchema,
  editDogQuery,
} from "~/routes/account_dog_form/account-dog-form";

/*===== Route =====*/
// Customers only: the dogs are a customer's. A partner has none, and the Admin edits dogs in his own area
// (docs/app-spec.md, F2). The API answers NOT_FOUND for another owner's dog too, so a made-up id and someone else's dog
// look the same.
export const Route = createFileRoute("/account/dogs/$dogId/edit")({
  beforeLoad: ({ context, location }) =>
    requireSession({ queryClient: context.queryClient, location, roles: ["customer"] }),
  validateSearch: dogFormSearchSchema,
  loader: async ({ context: { queryClient }, params }) => {
    const dog = await orNotFound(queryClient.ensureQueryData(editDogQuery(params.dogId)));
    return { name: dog.name };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `ویرایش ${loaderData.name} | آموزش K9` : "معرفی سگ تازه | آموزش K9" }],
  }),
  component: EditDogPage,
  notFoundComponent: DogFormNotFound,
  errorComponent: DogFormFailed,
});

/*===== Page =====*/
function EditDogPage() {
  const { dogId } = Route.useParams();
  const { redirectTo } = Route.useSearch();
  const { data: dog } = useSuspenseQuery(editDogQuery(dogId));
  return <DogFormPage dog={dog} redirectTo={redirectTo} />;
}
