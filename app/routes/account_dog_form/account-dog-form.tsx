import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { DogForm } from "~/routes/account_dog_form/components/dog-form";
import { DogFormError } from "~/routes/account_dog_form/components/dog-form-error";
import { PageHeader } from "~/routes/account_dog_form/components/page-header";

import type { Route } from "./+types/account-dog-form";

// One module for two routes (see `routes.ts`): `/account/dogs/new` and `/account/dogs/:dogId/edit`.

/*===== Guard =====*/
// Customers only: the dogs are a customer's. A partner has none, and the Admin edits dogs in his own area
// (docs/app-spec.md, F2).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.dog ? `ویرایش ${loaderData.dog.name} | آموزش K9` : "معرفی سگ تازه | آموزش K9" },
];

/*===== Loader =====*/
// The API answers NOT_FOUND for another owner's dog too, so a made-up id and someone else's dog look the same.
export async function loader({ request, params }: Route.LoaderArgs) {
  const redirectTo = safeRedirect(new URL(request.url).searchParams.get("redirectTo"));
  if (!params.dogId) return { dog: null, redirectTo };

  const dog = await createServerClient(request)
    .dog.get({ id: params.dogId })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    });
  return { dog, redirectTo };
}

/** Only same-site paths, so a crafted link can't send someone to another site after saving. */
function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

/*===== Dog Form =====*/
/**
 * F2's form for adding a dog and for editing one: the buddy's file being written. The customer's dog's print fills in
 * beside the form as it is typed, and the center's dog looks after each of its three plates; the form is `DogForm`.
 */
export default function DogFormPage({ loaderData }: Route.ComponentProps) {
  const { dog, redirectTo } = loaderData;

  return <DogForm dog={dog} redirectTo={redirectTo} header={<PageHeader dog={dog} />} />;
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DogFormError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}
