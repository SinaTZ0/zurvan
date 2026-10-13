import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { createServerClient } from "~/orpc/server-client.server";
import { DogForm } from "~/routes/account_dog_form/components/dog-form";

import type { Route } from "./+types/account-dog-form";

// One module for two routes (see `routes.ts`): `/account/dogs/new` and `/account/dogs/:dogId/edit`.

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.dog ? `ویرایش ${loaderData.dog.name} | آموزش K9` : "معرفی سگ تازه | آموزش K9" },
];

/*===== Loader =====*/
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

/*===== Page =====*/
export default function DogFormPage({ loaderData }: Route.ComponentProps) {
  const { dog, redirectTo } = loaderData;

  return (
    <div className="site-container py-8 lg:py-12">
      {/*===== Header =====*/}
      <header className="mb-8 lg:mb-12">
        <Link
          to={dog ? `/account/dogs/${dog.id}` : "/account"}
          className="rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          {dog ? dog.name : "سگ‌های من"}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-balance lg:text-3xl">
          {dog ? `ویرایش ${dog.name}` : "معرفی سگ تازه"}
        </h1>
        {!dog && (
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            چند دقیقه بیشتر طول نمی‌کشد. هر چه را دقیق نمی‌دانی، تقریبی بنویس؛ بعداً هم می‌شود عوضش کرد.
          </p>
        )}
      </header>

      <DogForm dog={dog} redirectTo={redirectTo} />
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="dog-form-error-title" className="site-container py-16">
      <h1 id="dog-form-error-title" className="text-2xl font-extrabold">
        {notFound ? "این سگ پیدا نشد" : "فرم باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید از حسابت برداشته شده باشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to="/account" className="mt-6 inline-block font-bold text-primary underline-offset-4 hover:underline">
        برگرد به سگ‌های من
      </Link>
    </section>
  );
}
