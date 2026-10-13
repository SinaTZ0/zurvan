import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { DogEmptyState } from "~/components/dog-empty-state";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { DogForm } from "~/routes/account_dog_form/components/dog-form";
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
 * F2's form for adding a dog and for editing one. The dog stands beside the form as it will look on its own page and
 * talks as the owner moves through it; the form itself is `DogForm`.
 */
export default function DogFormPage({ loaderData }: Route.ComponentProps) {
  const { dog, redirectTo } = loaderData;

  return <DogForm dog={dog} redirectTo={redirectTo} header={<PageHeader dog={dog} />} />;
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  if (notFound) {
    return (
      <div className="site-container py-8 lg:py-14">
        <DogEmptyState
          bubble="من توی حساب تو نیستم!"
          title="این سگ پیدا نشد"
          action={{ label: "سگ‌های من", to: "/account" }}
        >
          شاید از حسابت برداشته شده باشد.
        </DogEmptyState>
      </div>
    );
  }

  return (
    <section aria-labelledby="dog-form-error-title" className="site-container py-16">
      <h1 id="dog-form-error-title" className="text-2xl font-extrabold">
        فرم باز نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/account" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به سگ‌های من
      </Link>
    </section>
  );
}
