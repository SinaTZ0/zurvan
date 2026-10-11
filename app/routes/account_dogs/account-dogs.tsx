import { PlusIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import { DogRow } from "~/routes/account_dogs/components/dog-row";
import { DogsEmpty } from "~/routes/account_dogs/components/dogs-empty";

import type { Route } from "./+types/account-dogs";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "سگ‌های من | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  // The API lists the oldest dog first, so the list reads like a ledger that grows at the bottom and a dog never jumps
  // when another is added.
  const client = createServerClient(request);
  // One call for every dog's assessments, matched up below, instead of one per dog.
  const [dogs, assessments] = await Promise.all([client.dog.list(), client.assessment.listMine({})]);
  // A dog has at most one booked assessment at a time (the API refuses a second).
  const bookedByDog = Object.fromEntries(
    assessments
      .filter((assessment) => assessment.status === "booked")
      .map((assessment) => [assessment.dog.id, assessment]),
  );
  return { dogs, bookedByDog };
}

/*===== Page =====*/
export default function DogsPage({ loaderData }: Route.ComponentProps) {
  const { dogs, bookedByDog } = loaderData;
  const isEmpty = dogs.length === 0;

  return (
    <div className="site-container py-8 lg:py-12">
      {/*===== Header =====*/}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">سگ‌های من</h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            هر سگ پرونده‌ی خودش را دارد. از اینجا قدم بعدی‌اش را بردار.
          </p>
        </div>

        {/* The empty state has its own, gold-leaf button; two calls to the same action would compete. */}
        {!isEmpty && (
          <Link to="/account/dogs/new" className={buttonVariants({ variant: "outline", className: "sm:shrink-0" })}>
            <PlusIcon aria-hidden data-icon="inline-start" />
            سگ تازه اضافه کن
          </Link>
        )}
      </header>

      {isEmpty ? (
        <DogsEmpty />
      ) : (
        <>
          {/*===== Dogs =====*/}
          <section
            aria-labelledby="dogs-list-title"
            className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border"
          >
            <h2 id="dogs-list-title" className="sr-only">
              فهرست سگ‌ها
            </h2>
            <ul className="divide-y">
              {dogs.map((dog) => (
                <DogRow key={dog.id} dog={dog} booked={bookedByDog[dog.id] ?? null} />
              ))}
            </ul>
          </section>

          <p className="mt-4 text-sm text-pretty text-muted-foreground">
            هر سگ جدا ارزیابی می‌شود؛ ارزیابی رایگان است.
          </p>
        </>
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the tabs and the way out stay on screen.
export function ErrorBoundary() {
  return (
    <section aria-labelledby="dogs-error-title" className="site-container py-16">
      <h1 id="dogs-error-title" className="text-2xl font-extrabold">
        سگ‌هایت بالا نیامد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد و فهرست باز نشد. چیزی از پرونده‌ها گم نشده؛ دوباره امتحان کن.
      </p>
      <Link to="/account/dogs" reloadDocument className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        دوباره امتحان کن
      </Link>
    </section>
  );
}
