import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { DogFileCard } from "~/components/dog-file-card";
import { DogProfile } from "~/components/dog-profile";
import { Link } from "~/components/link";
import { buildCertificateCard } from "~/lib/certificate.server";
import { buildDogFileCard } from "~/lib/dog-file.server";
import { getDogStatus } from "~/lib/dog-status";
import { createServerClient } from "~/orpc/server-client.server";
import { DogHeader } from "~/routes/account_dog_detail/components/dog-header";
import { CertificatesSection } from "~/routes/account_dog_detail/components/certificates-section";
import { EnrollmentsSection } from "~/routes/account_dog_detail/components/enrollments-section";
import { EvaluationsSection } from "~/routes/account_dog_detail/components/evaluations-section";
import { LogbookSection } from "~/routes/account_dog_detail/components/logbook-section";

import type { Route } from "./+types/account-dog-detail";

/*===== Meta =====*/
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.dog ? `${loaderData.dog.name} | آموزش K9` : "سگ من | آموزش K9" },
];

/*===== Loader =====*/
// The account shell guards the route. The API answers NOT_FOUND for another owner's dog too, so a made-up id and
// someone else's dog look the same.
export async function loader({ request, params }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const dogId = params.dogId;

  const [dog, evaluations, enrollments, logbook, certificates] = await Promise.all([
    client.dog.get({ id: dogId }),
    client.evaluation.listMine({ dogId }),
    client.enrollment.listMine({ dogId }),
    client.logbook.list({ dogId }),
    client.certificate.listMine({ dogId }),
  ]).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  return {
    dog,
    evaluations,
    enrollments,
    logbook,
    certificates: certificates.map((certificate) => ({
      certificate,
      ...buildCertificateCard({ number: certificate.number }),
    })),
    fileCard: buildDogFileCard({ fileNumber: dog.fileNumber }),
  };
}

/*===== Dog Detail =====*/
/**
 * F2, F3, F6 and F14 on one dog: evaluated or not, the courses it passed, its evaluation requests with their photos and
 * videos, its enrollments, and the diary the trainer writes. Phones read courses, evaluations, profile; desktop puts the profile in a sticky end
 * column.
 */
export default function AccountDogDetailPage({ loaderData }: Route.ComponentProps) {
  const { dog, evaluations, enrollments, logbook, certificates, fileCard } = loaderData;
  const status = getDogStatus({ dog, evaluations, enrollments });

  return (
    <div className="site-container flex flex-col gap-8 py-6 lg:gap-12 lg:py-10">
      {/*===== Header =====*/}
      <DogHeader dog={dog} status={status} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
        {/*===== Courses and Evaluations =====*/}
        <div className="flex flex-col gap-8 lg:gap-10">
          <EnrollmentsSection enrollments={enrollments} isEvaluated={dog.isEvaluated} />
          <CertificatesSection certificates={certificates} />
          <LogbookSection entries={logbook} />
          <EvaluationsSection evaluations={evaluations} />
        </div>

        {/*===== Profile =====*/}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24">
          <DogProfile dog={dog} />
          <DogFileCard
            dogName={dog.name}
            fileNumber={dog.fileNumber}
            link={fileCard.link}
            qr={fileCard.qr}
            note="هر کس این کد را اسکن کند «پرونده‌ی خصوصی» را می‌بیند. فقط تو و مربی پرونده را می‌بینید."
          />
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
    <section aria-labelledby="dog-detail-error-title" className="site-container py-16">
      <h1 id="dog-detail-error-title" className="text-2xl font-extrabold">
        {notFound ? "این سگ پیدا نشد" : "صفحه‌ی سگ باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "شاید از حسابت برداشته شده باشد."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن."}
      </p>
      <Link to="/account" className="mt-6 inline-block font-bold text-primary underline-offset-4 hover:underline">
        سگ‌های من
      </Link>
    </section>
  );
}
