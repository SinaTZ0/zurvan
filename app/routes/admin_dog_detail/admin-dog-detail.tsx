import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";
import { useRef, useState } from "react";

import { getDogEvaluationState } from "~/components/dog-evaluation-stamp";
import { AdminPageHeader } from "~/components/admin-page-header";
import { DogFileCard } from "~/components/dog-file-card";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { orNotFound } from "~/lib/not-found";
import { PUBLIC_RECORD_CONSENT } from "~/lib/public-record";
import { orpc } from "~/orpc/client";
import { CertificatesSection } from "~/routes/admin_dog_detail/components/certificates-section";
import { CourseLadder } from "~/routes/admin_dog_detail/components/course-ladder";
import { DetailMotion } from "~/routes/admin_dog_detail/components/detail-motion";
import { DetailsSection } from "~/routes/admin_dog_detail/components/details-section";
import { DogHeader } from "~/routes/admin_dog_detail/components/dog-header";
import { EditSheet } from "~/routes/admin_dog_detail/components/edit-sheet";
import { EnrollmentsSection } from "~/routes/admin_dog_detail/components/enrollments-section";
import { EvaluateDialog } from "~/routes/admin_dog_detail/components/evaluate-dialog";
import { EvaluationCard } from "~/routes/admin_dog_detail/components/evaluation-card";
import { EvaluationsSection } from "~/routes/admin_dog_detail/components/evaluations-section";
import { IdentityPanel } from "~/routes/admin_dog_detail/components/identity-panel";
import { LogbookSection } from "~/routes/admin_dog_detail/components/logbook-section";
import { SessionSheet } from "~/routes/admin_dog_detail/components/session-sheet";
import { useStickyColumn } from "~/routes/admin_dog_detail/hooks/use-sticky-column";
import { summarizeEvaluations } from "~/routes/admin_dog_detail/evaluation-summary";
import { buildLadder } from "~/routes/admin_dog_detail/ladder";
import { adminDogDetailSearchSchema } from "~/routes/admin_dog_detail/search-params";

/*===== Constants =====*/
// Whether an owner can make a record public at all (approved wording exists); the session form offers its mark only then.
const PUBLIC_RECORDS_AVAILABLE = PUBLIC_RECORD_CONSENT !== null;

/*===== Queries =====*/
/** Everything the file shows, one query per procedure, for the loader and the page alike. */
function dogFileQueries(dogId: string) {
  return {
    dog: orpc.dog.admin.get.queryOptions({ input: { id: dogId } }),
    eligibility: orpc.checkout.admin.dogEligibility.queryOptions({ input: { dogId } }),
    evaluations: orpc.evaluation.admin.list.queryOptions({ input: { dogId } }),
    enrollments: orpc.enrollment.admin.list.queryOptions({ input: { dogId } }),
    logbook: orpc.logbook.admin.list.queryOptions({ input: { dogId } }),
    certificates: orpc.certificate.admin.list.queryOptions({ input: { dogId } }),
  };
}

/*===== Route =====*/
// The admin layout guards the route. The API answers NOT_FOUND for a made-up or malformed id, which becomes a 404.
// The sheets' search params aren't loader deps.
export const Route = createFileRoute("/admin/dogs/$dogId")({
  validateSearch: adminDogDetailSearchSchema,
  loader: async ({ context: { queryClient }, params }) => {
    const queries = dogFileQueries(params.dogId);
    const [dog] = await orNotFound(
      Promise.all([
        queryClient.ensureQueryData(queries.dog),
        queryClient.ensureQueryData(queries.eligibility),
        queryClient.ensureQueryData(queries.evaluations),
        queryClient.ensureQueryData(queries.enrollments),
        queryClient.ensureQueryData(queries.logbook),
        queryClient.ensureQueryData(queries.certificates),
      ]),
    );
    return { name: dog.name };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? "سگ"} | مدیریت آموزش K9` }] }),
  component: AdminDogDetailPage,
  notFoundComponent: () => <DogDetailError notFound />,
  errorComponent: () => <DogDetailError notFound={false} />,
});

/*===== Admin Dog Detail =====*/
/**
 * One dog, for the Admin (F2, F3, F4, F6, F14): its file. Everything about the dog in one place (who owns it, where it
 * is on the ladder, its enrollments, certificates, diary and evaluations) and the few things he does here.
 *
 * - From `xl`: two columns. The start one (22rem, sticky) holds the photo and owner, the evaluation card and the file
 *   card; the end one the ladder, then the sections.
 * - Below `xl`: one column in the order he reads it: the photo and owner, the evaluation card, the ladder, the sections,
 *   and the file card last. The start column's wrapper is `display: contents` there, so its cards are items of the one
 *   grid and the file card can move to the end with `order` (it is rendered once).
 */
function AdminDogDetailPage() {
  const { dogId } = Route.useParams();
  const queries = dogFileQueries(dogId);
  const { data: dog, isFetching: dogFetching } = useSuspenseQuery(queries.dog);
  const { data: eligibility, isFetching: eligibilityFetching } = useSuspenseQuery(queries.eligibility);
  const { data: evaluations, isFetching: evaluationsFetching } = useSuspenseQuery(queries.evaluations);
  const { data: enrollments, isFetching: enrollmentsFetching } = useSuspenseQuery(queries.enrollments);
  const { data: logbook, isFetching: logbookFetching } = useSuspenseQuery(queries.logbook);
  const { data: certificates, isFetching: certificatesFetching } = useSuspenseQuery(queries.certificates);
  const { fileCard } = dog;

  /*------ URL State ------*/
  const search = Route.useSearch();
  const edit = search.edit ?? false;
  const session = search.session ?? null;
  const navigate = useNavigate({ from: Route.fullPath });
  // Opening a sheet pushes a history entry, so Back closes it.
  const openSheet = (next: { edit: true } | { session: string }) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), resetScroll: false });
  // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
  // forward entry that reopens it.
  const closeSheet = (key: "edit" | "session") =>
    void navigate({ search: (prev) => ({ ...prev, [key]: undefined }), replace: true, resetScroll: false });
  // `session` is `new`, an entry's id, or nothing; an id that is no entry (deleted meanwhile) shows nothing.
  const editingEntry = session && session !== "new" ? (logbook.find((entry) => entry.id === session) ?? null) : null;
  const sessionOpen = session === "new" || editingEntry !== null;

  /*------ Evaluate Dialog ------*/
  const [evaluating, setEvaluating] = useState(false);

  /*------ Busy ------*/
  // Leaving for another page, or the file refetching after something he did here. Opening or closing a sheet only
  // changes the search, which shouldn't dim the page.
  const leavingPage = useRouterState({
    select: (state) => state.status === "pending" && state.location.pathname !== state.resolvedLocation?.pathname,
  });
  const busy =
    leavingPage ||
    dogFetching ||
    eligibilityFetching ||
    evaluationsFetching ||
    enrollmentsFetching ||
    logbookFetching ||
    certificatesFetching;

  /*------ Sticky Column ------*/
  const startColumn = useRef<HTMLDivElement>(null);
  useStickyColumn(startColumn);

  /*------ Derived ------*/
  const { waiting, evaluated } = summarizeEvaluations(evaluations);
  const stamp = getDogEvaluationState({ isEvaluated: dog.isEvaluated, hasWaitingRequest: waiting !== null });
  const rungs = buildLadder({ eligibility, passedCourses: dog.passedCourses });

  return (
    <div>
      <DetailMotion />
      <DogHeader dog={dog} onEdit={() => openSheet({ edit: true })} />

      <div
        aria-busy={busy}
        className={cn(
          "grid grid-cols-1 gap-6 transition-opacity xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start xl:gap-8",
          busy && "opacity-60",
        )}
      >
        {/*===== Start Column: Who, Evaluation, File =====*/}
        <div ref={startColumn} className="contents xl:sticky xl:top-20 xl:flex xl:min-w-0 xl:flex-col xl:gap-6">
          <IdentityPanel dog={dog} state={stamp} />
          <EvaluationCard
            isEvaluated={dog.isEvaluated}
            evaluated={evaluated}
            waiting={waiting}
            onEvaluate={() => setEvaluating(true)}
          />

          {/*------ File Card ------*/}
          {/* The shared card, framed in the plate: its own card surface and gold copy button give way to the Admin's
              ink, since nothing waits for him here. */}
          <div
            className={cn(
              ADMIN_PLATE,
              "order-last min-w-0 xl:order-none",
              "[&>section]:rounded-3xl [&>section]:border-0 [&>section]:bg-transparent",
              "[&_button.border-primary]:border-foreground/20 [&_button.text-primary]:text-foreground [&_h2]:font-display [&_h2]:text-xl",
            )}
          >
            <DogFileCard
              dogName={dog.name}
              fileNumber={dog.fileNumber}
              link={fileCard.link}
              qr={fileCard.qr}
              note="هر کسی جز تو و صاحبش این کد رو اسکن کنه، «پرونده‌ی خصوصی» رو می‌بینه."
            />
          </div>
        </div>

        {/*===== End Column: Ladder and Sections =====*/}
        <div className="flex min-w-0 flex-col gap-8">
          <CourseLadder dog={dog} rungs={rungs} />
          <EnrollmentsSection enrollments={enrollments} />
          <CertificatesSection enrollments={enrollments} certificates={certificates} />
          <LogbookSection
            entries={logbook}
            publicRecordsAvailable={PUBLIC_RECORDS_AVAILABLE}
            onAdd={() => openSheet({ session: "new" })}
            onEdit={(entry) => openSheet({ session: entry.id })}
          />
          <EvaluationsSection evaluations={evaluations} />
          <DetailsSection dog={dog} />
        </div>
      </div>

      {/*===== Edit Sheet =====*/}
      <EditSheet dog={dog} open={edit} onClose={() => closeSheet("edit")} />

      {/*===== Session Sheet =====*/}
      <SessionSheet
        dog={dog}
        enrollments={enrollments}
        entry={editingEntry}
        publicRecordsAvailable={PUBLIC_RECORDS_AVAILABLE}
        open={sessionOpen}
        onClose={() => closeSheet("session")}
      />

      {/*===== Evaluate Dialog =====*/}
      <EvaluateDialog dog={dog} hasWaitingRequest={waiting !== null} open={evaluating} onOpenChange={setEvaluating} />
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the admin layout, so the rail and the way back stay on screen.
function DogDetailError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این سگ پیدا نشد" : "پرونده‌ی سگ باز نشد"}
        summary={
          notFound
            ? "شاید از فهرست برداشته شده، یا لینکش درست نیست."
            : "یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
        }
      />
      <Link to={notFound ? "/admin/dogs" : "/admin"} className={buttonVariants({ variant: "outline" })}>
        {notFound ? "همه‌ی سگ‌ها" : "برگرد به نمای کلی"}
      </Link>
    </div>
  );
}
