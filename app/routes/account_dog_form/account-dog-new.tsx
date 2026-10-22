import { createFileRoute } from "@tanstack/react-router";

import { requireSession } from "~/lib/session-guard";
import {
  DogFormFailed,
  DogFormNotFound,
  DogFormPage,
  dogFormSearchSchema,
} from "~/routes/account_dog_form/account-dog-form";

/*===== Route =====*/
// Customers only: the dogs are a customer's. A partner has none, and the Admin edits dogs in his own area
// (docs/app-spec.md, F2).
export const Route = createFileRoute("/account/dogs/new")({
  beforeLoad: ({ context, location }) =>
    requireSession({ queryClient: context.queryClient, location, roles: ["customer"] }),
  validateSearch: dogFormSearchSchema,
  head: () => ({ meta: [{ title: "معرفی سگ تازه | آموزش K9" }] }),
  component: NewDogPage,
  notFoundComponent: DogFormNotFound,
  errorComponent: DogFormFailed,
});

/*===== Page =====*/
function NewDogPage() {
  const { redirectTo } = Route.useSearch();
  return <DogFormPage dog={null} redirectTo={redirectTo} />;
}
