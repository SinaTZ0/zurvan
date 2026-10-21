import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { HEAD_TRAINER } from "~/lib/head-trainer";
import { getDogStatus } from "~/lib/dog-status";
import { PUBLIC_RECORD_CONSENT } from "~/lib/public-record";
import { createServerClient } from "~/orpc/server-client.server";
import { COLUMN } from "~/routes/account_dog_detail/column";
import { BuddyCorner } from "~/routes/account_dog_detail/components/buddy-corner";
import { CertificatesSection } from "~/routes/account_dog_detail/components/certificates-section";
import { DogDetailError } from "~/routes/account_dog_detail/components/dog-detail-error";
import { DogHero } from "~/routes/account_dog_detail/components/dog-hero";
import { DogProfile } from "~/routes/account_dog_detail/components/dog-profile";
import { EnrollmentsSection } from "~/routes/account_dog_detail/components/enrollments-section";
import { EvaluationsSection } from "~/routes/account_dog_detail/components/evaluations-section";
import { FileCard } from "~/routes/account_dog_detail/components/file-card";
import { LogbookSection } from "~/routes/account_dog_detail/components/logbook-section";
import { MedalsBand } from "~/routes/account_dog_detail/components/medals-band";
import { PageMotion } from "~/routes/account_dog_detail/components/page-motion";
import { PublicRecordCard } from "~/routes/account_dog_detail/components/public-record-card";
import type { AccountLayoutHandle } from "~/routes/layout_account/layout-account";

import type { Route } from "./+types/account-dog-detail";

/*===== Handle =====*/
// The page ends on the medals' brick band, which runs into the footer, so the shell drops its bottom padding.
export const handle: AccountLayoutHandle = { flushFooter: true };

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

  const [dog, evaluations, enrollments, logbook, certificates, publicStatus] = await Promise.all([
    client.dog.get({ id: dogId }),
    client.evaluation.listMine({ dogId }),
    client.enrollment.listMine({ dogId }),
    client.logbook.list({ dogId }),
    client.certificate.listMine({ dogId }),
    client.logbook.publicStatus({ dogId }),
  ]).catch((error: unknown) => {
    if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
    throw error;
  });

  return {
    dog,
    evaluations,
    enrollments,
    logbook,
    certificates: certificates.map(({ link, qr, ...certificate }) => ({ certificate, link, qr })),
    publicStatus,
    // The approved wording the owner agrees to, present only once the owner has approved one.
    wording: PUBLIC_RECORD_CONSENT,
    fileCard: dog.fileCard,
    // The hero's three numbers, from what is already read. A revoked certificate isn't counted: it proves nothing.
    counts: {
      active: enrollments.filter((enrollment) => enrollment.status === "active").length,
      passed: dog.passedCourses.length,
      certificates: certificates.filter((certificate) => certificate.revokedAt === null).length,
    },
  };
}

/*===== Dog Detail =====*/
/**
 * F2, F3, F6 and F14 on one dog, as the dog's own room: its photo pinned as a big print beside its name (the hero), then
 * its courses, certificates, diary and evaluations in the main column and its profile and file card in a sticky side
 * column (phones: one column, main first), and at the end the medals of the courses it passed on a brick wall.
 *
 * The customer's dog is the photo and speaks its state; the center's dog keeps his buddy's file down the page (the
 * clipboard on the courses, the diploma by the certificates, writing the diary, waiting by the phone for the evaluation
 * call, the tag on the file card, the medals on the wall). He never stands on the photo.
 */
export default function AccountDogDetailPage({ loaderData }: Route.ComponentProps) {
  const { dog, evaluations, enrollments, logbook, certificates, publicStatus, wording, fileCard, counts } = loaderData;
  const status = getDogStatus({ dog, evaluations, enrollments });

  return (
    <div className="overflow-x-clip">
      <PageMotion />

      {/*===== Hero =====*/}
      <DogHero dog={dog} status={status} counts={counts} />

      {/*===== The File =====*/}
      <div
        className={`${COLUMN} grid grid-cols-[minmax(0,1fr)] gap-y-16 pt-section-sm lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-12 xl:gap-x-16`}
      >
        {/*------ Courses, Certificates, Diary, Evaluations ------*/}
        <div className="flex flex-col gap-16 lg:self-stretch">
          <EnrollmentsSection enrollments={enrollments} isEvaluated={dog.isEvaluated} />
          <CertificatesSection certificates={certificates} />
          <LogbookSection entries={logbook} />
          <EvaluationsSection evaluations={evaluations} status={status} />
          <BuddyCorner />
        </div>

        {/*------ Profile and File Card ------*/}
        <div className="flex flex-col gap-16 lg:sticky lg:top-24">
          <DogProfile dog={dog} />
          <FileCard
            dogName={dog.name}
            fileNumber={dog.fileNumber}
            link={fileCard.link}
            qr={fileCard.qr}
            note={
              publicStatus.isPublic
                ? "پرونده عمومیه: هر کی این کد رو اسکن کنه، پرونده‌ی عمومی‌ش رو می‌بینه."
                : `هر کی این کد رو اسکن کنه، فقط می‌بینه که پرونده خصوصیه. پرونده رو فقط تو و ${HEAD_TRAINER.firstName} می‌بینید.`
            }
          />
          <PublicRecordCard dogId={dog.id} dogName={dog.name} status={publicStatus} wording={wording} />
        </div>
      </div>

      {/*===== Medals =====*/}
      <MedalsBand
        dogName={dog.name}
        courses={dog.passedCourses}
        active={enrollments
          .filter((enrollment) => enrollment.status === "active")
          .map((enrollment) => enrollment.course)}
      />
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DogDetailError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}
