import { useCallback, useState } from "react";
import { isRouteErrorResponse, useRevalidator } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { requireSession } from "~/lib/session-guard.server";
import type { Evaluation } from "~/orpc/evaluation/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { DogGuide, type GuideProgress } from "~/routes/assessment/components/dog-guide";
import type { DogChoice } from "~/routes/assessment/components/dog-picker";
import { NoDogCard } from "~/routes/assessment/components/no-dog-card";
import { RequestForm } from "~/routes/assessment/components/request-form";
import { RequestSent } from "~/routes/assessment/components/request-sent";

import type { Route } from "./+types/assessment";

/*===== Guard =====*/
// A dog owner asks for the evaluation. Signed out goes to sign in and back here; partners and the Admin go to their own
// home (docs/app-spec.md, Roles).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "ارزیابی رایگان | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [dogs, evaluations] = await Promise.all([client.dog.list(), client.evaluation.listMine({})]);

  /*------ Who Can Ask ------*/
  // F3: a dog with a waiting or an evaluated request can't ask again; one whose requests were all rejected or withdrawn
  // can. The dog's own flag counts too: it is also set for a dog the Admin marked evaluated.
  const choices: DogChoice[] = dogs.map((dog) => {
    const own = evaluations.filter((evaluation) => evaluation.dog.id === dog.id);
    const state = own.some((evaluation) => evaluation.status === "requested")
      ? "pending"
      : dog.isEvaluated || own.some((evaluation) => evaluation.status === "evaluated")
        ? "evaluated"
        : "requestable";
    return { id: dog.id, name: dog.name, breed: dog.breed, photo: dog.photo, state };
  });

  /*------ ?dog= ------*/
  // «معرفی سگ تازه» sends the owner back with the new dog's id. Only used when that dog is theirs and can ask.
  const asked = new URL(request.url).searchParams.get("dog");
  const preselectedDogId = choices.find((dog) => dog.id === asked && dog.state === "requestable")?.id ?? null;

  return { dogs: choices, preselectedDogId };
}

/*===== Evaluation Request =====*/
/**
 * F3's request page. A dog stands beside the form and talks; its words follow how far the form has got, and after
 * sending, the form card is replaced in place by what was sent and what happens next.
 */
export default function EvaluationRequestPage({ loaderData }: Route.ComponentProps) {
  const { dogs, preselectedDogId } = loaderData;
  const revalidator = useRevalidator();

  const [progress, setProgress] = useState<GuideProgress>(0);
  const [sent, setSent] = useState<Evaluation | null>(null);
  // A new key remounts the form, so «another dog» starts from a clean one.
  const [formKey, setFormKey] = useState(0);

  const requestable = dogs.filter((dog) => dog.state === "requestable");
  const defaultDogId =
    requestable.find((dog) => dog.id === preselectedDogId)?.id ?? (requestable.length === 1 ? requestable[0]!.id : "");

  /*------ Events ------*/
  // The dogs' states changed on the server (this one now has a request), so reload them for «another dog».
  const handleSent = useCallback(
    (evaluation: Evaluation) => {
      setSent(evaluation);
      void revalidator.revalidate();
    },
    [revalidator],
  );
  const handleAnotherDog = useCallback(() => {
    setSent(null);
    setProgress(0);
    setFormKey((key) => key + 1);
  }, []);
  const handleNotRequestable = useCallback(() => void revalidator.revalidate(), [revalidator]);

  /*------ What Stands in the Form's Place ------*/
  // No form without a dog to ask for: the guide says why, and one button says where to go.
  const noDogs = dogs.length === 0;
  const nothingToAsk = !noDogs && requestable.length === 0 && !sent;

  return (
    <div className="site-container py-8 lg:py-14">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
        {/*===== Header =====*/}
        <header className="pb-8 lg:col-start-1 lg:row-start-1 lg:pb-10">
          <h1 className="font-display text-h1 font-black text-balance">
            {sent
              ? `حالا منتظر ${HEAD_TRAINER.firstName} باش`
              : `عکس و فیلممو بفرست، بقیه‌ش با ${HEAD_TRAINER.firstName}`}
          </h1>
          {!sent && (
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              رایگانه و هیچ تعهدی نداره. بعد از این‌که {HEAD_TRAINER.firstName} منو دید، دوره‌هام باز می‌شن.
            </p>
          )}
        </header>

        {/*===== Dog =====*/}
        {/* Second in the document so phones see it between the heading and the card; desktop puts it at the end. */}
        <DogGuide
          progress={progress}
          sent={sent !== null}
          message={
            noDogs
              ? "اول باید منو معرفی کنی"
              : nothingToAsk
                ? `همه‌ی سگ‌هات یا منتظر جواب ${HEAD_TRAINER.firstName} هستن یا ارزیابی شدن!`
                : undefined
          }
          className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        />

        {/*===== Form, or What Stands for It =====*/}
        <div className="lg:col-start-1 lg:row-start-2">
          {noDogs ? (
            <NoDogCard
              title="اول سگت را معرفی کن"
              detail={`ارزیابی برای یک سگ مشخصه؛ اسم و نژادش را بنویس تا ${HEAD_TRAINER.firstName} بشناسدش. بعدش برمی‌گردی همین‌جا.`}
              action={{ to: "/account/dogs/new?redirectTo=/assessment", label: "معرفی سگ" }}
            />
          ) : nothingToAsk ? (
            <NoDogCard
              title="درخواستی برای فرستادن نمونده"
              detail="هر سگی فقط یک ارزیابی داره؛ سگ‌هات یا درخواستشون منتظر جواب مونده یا ارزیابی شدن. وضعیتشون را توی حسابت می‌بینی."
              action={{ to: "/account", label: "برو به حساب من" }}
              extraLink={{ to: "/account/dogs/new?redirectTo=/assessment", label: "+ معرفی سگ تازه" }}
            />
          ) : sent ? (
            <RequestSent
              dogName={sent.dog.name}
              earliestDate={sent.earliestDate ?? ""}
              availableDays={sent.availableDays}
              availablePeriods={sent.availablePeriods}
              anotherDogRequestable={requestable.some((dog) => dog.id !== sent.dog.id)}
              onAnotherDog={handleAnotherDog}
            />
          ) : (
            <RequestForm
              key={formKey}
              dogs={dogs}
              defaultDogId={defaultDogId}
              onProgressChange={setProgress}
              onSent={handleSent}
              onNotRequestable={handleNotRequestable}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="assessment-error-title" className="site-container py-16">
      <h1 id="assessment-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "صفحه‌ی ارزیابی باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به صفحه‌ی اصلی
      </Link>
    </section>
  );
}
