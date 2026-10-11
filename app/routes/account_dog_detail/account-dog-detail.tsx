import { ORPCError } from "@orpc/client";
import { ChevronRightIcon, PencilIcon } from "lucide-react";
import { data, isRouteErrorResponse } from "react-router";

import { DogPortrait } from "~/components/dog-portrait";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { describeDog } from "~/lib/dog-format";
import { createServerClient } from "~/orpc/server-client.server";
import { DogNotes } from "~/routes/account_dog_detail/components/dog-notes";
import { DogProfile } from "~/routes/account_dog_detail/components/dog-profile";
import { DogRecord } from "~/routes/account_dog_detail/components/dog-record";
import { NextStepPanel } from "~/routes/account_dog_detail/components/next-step-panel";

import type { Route } from "./+types/account-dog-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.dog ? `${loaderData.dog.name} | آموزش K9` : "سگ‌های من | آموزش K9" },
];

/*===== Loader =====*/
export async function loader({ request, params }: Route.LoaderArgs) {
  // The API answers NOT_FOUND for a missing, removed or someone else's dog alike, so the page never confirms that a
  // dog exists.
  const dog = await createServerClient(request)
    .dog.get({ id: params.dogId })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    });
  return { dog };
}

/*===== Page =====*/
export default function DogDetailPage({ loaderData }: Route.ComponentProps) {
  const { dog } = loaderData;
  const editPath = `/account/dogs/${dog.id}/edit`;
  const details = [dog.breed, describeDog(dog)].filter(Boolean).join("، ");

  return (
    <div className="site-container py-8 lg:py-12">
      <Link
        to="/account/dogs"
        className="inline-flex items-center gap-1 rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        <ChevronRightIcon aria-hidden className="size-4" />
        سگ‌های من
      </Link>

      {/*===== Page =====*/}
      {/* Desktop: the start column is the dog itself (portrait, profile, notes), the end column its story (name, next
          step, record), so the next step sits beside the tag on the first screen. Phones read it as one column in the
          briefed order: each desktop column becomes `contents`, and `order` interleaves their parts. */}
      <div className="mt-6 flex flex-col gap-10 lg:mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
        {/*------ The Dog ------*/}
        <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-12">
          <DogPortrait
            name={dog.name}
            microchipNumber={dog.microchipNumber}
            photo={dog.photo}
            finish="leaf"
            priority
            className="order-1 mx-auto w-full max-w-80 lg:max-w-none"
          />
          <div className="order-5 flex flex-col gap-10">
            <DogProfile dog={dog} />
            <DogNotes dog={dog} editPath={editPath} />
          </div>
        </div>

        {/*------ Its Story ------*/}
        <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-10">
          <header className="order-2 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-display text-4xl leading-tight font-bold text-balance lg:text-5xl">{dog.name}</h1>
              <p className="mt-3 text-pretty text-muted-foreground">{details}</p>
            </div>
            <Link to={editPath} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}>
              <PencilIcon aria-hidden data-icon="inline-start" />
              ویرایش
            </Link>
          </header>
          <div className="order-3">
            <NextStepPanel dog={dog} />
          </div>
          <div className="order-4">
            <DogRecord dog={dog} />
          </div>
        </div>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="dog-error-title" className="site-container py-16">
      <h1 id="dog-error-title" className="text-2xl font-extrabold">
        {notFound ? "این سگ پیدا نشد" : "صفحه‌ی سگ باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید از حسابت برداشته شده باشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to="/account/dogs" className="mt-6 inline-block font-bold text-primary underline-offset-4 hover:underline">
        برگرد به سگ‌های من
      </Link>
    </section>
  );
}
