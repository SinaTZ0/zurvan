import { cn } from "cn";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills, type AdminFilterOption } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { EvaluateDialog } from "~/routes/admin_evaluations/components/evaluate-dialog";
import { EvaluationDrawer } from "~/routes/admin_evaluations/components/evaluation-drawer";
import { EvaluationRow } from "~/routes/admin_evaluations/components/evaluation-row";
import { RejectDialog } from "~/routes/admin_evaluations/components/reject-dialog";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";
import {
  ADMIN_EVALUATIONS_PATH,
  adminEvaluationsSearchParams,
  type EvaluationFilter,
  serializeAdminEvaluationsSearchParams,
} from "~/routes/admin_evaluations/search-params";

import type { Route } from "./+types/admin-evaluations";

/*===== Constants =====*/
const FILTER_LABELS: Record<EvaluationFilter, string> = {
  requested: "در انتظار",
  evaluated: "ارزیابی شد",
  rejected: "رد شد",
  withdrawn: "پس گرفته شد",
  all: "همه",
};

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "ارزیابی‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The whole list, once: the status filter, the counts and the open drawer are shallow URL state applied in the component
// (docs/nuqs.md), so none of them runs this again. The admin layout guards the route.
export async function loader({ request }: Route.LoaderArgs) {
  return { evaluations: await createServerClient(request).evaluation.admin.list({}) };
}

/*===== Admin Evaluations =====*/
/**
 * F3 from the Admin's side: the people who asked for a free evaluation, waiting ones first. Each row is a contact sheet
 * (the dog, the customer to call, thumbnails of what they sent); the drawer holds everything for the phone call and the
 * two answers, «ارزیابی شد» and «رد».
 */
export default function AdminEvaluationsPage({ loaderData }: Route.ComponentProps) {
  const { evaluations } = loaderData;

  /*------ URL State ------*/
  const [{ status, evaluation: openId }, setParams] = useQueryStates(adminEvaluationsSearchParams);

  /*------ Answers ------*/
  // One pair of dialogs for every button. `target` outlives the dialog's closing so its text doesn't blank mid-fade.
  const [target, setTarget] = useState<AdminEvaluation | null>(null);
  const [dialog, setDialog] = useState<AnswerKind | null>(null);

  function answer({ kind, evaluation }: { kind: AnswerKind; evaluation: AdminEvaluation }) {
    setTarget(evaluation);
    setDialog(kind);
  }

  /*------ Busy ------*/
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== "idle" || revalidator.state !== "idle";

  /*------ Counts and Rows ------*/
  const counts: Record<EvaluationFilter, number> = {
    requested: evaluations.filter((item) => item.status === "requested").length,
    evaluated: evaluations.filter((item) => item.status === "evaluated").length,
    rejected: evaluations.filter((item) => item.status === "rejected").length,
    withdrawn: evaluations.filter((item) => item.status === "withdrawn").length,
    all: evaluations.length,
  };
  const options: AdminFilterOption<EvaluationFilter>[] = (Object.keys(FILTER_LABELS) as EvaluationFilter[]).map(
    (value) => ({ value, label: FILTER_LABELS[value], count: counts[value] }),
  );
  const rows = status === "all" ? evaluations : evaluations.filter((item) => item.status === status);

  // The drawer looks in the full list, so an answer that moves the row out of this filter doesn't close it.
  const opened = openId === null ? null : (evaluations.find((item) => item.id === openId) ?? null);

  return (
    <div>
      <AdminPageHeader
        title="ارزیابی‌ها"
        summary={
          counts.requested > 0
            ? `${formatNumberFa(counts.requested)} درخواست منتظر جواب است`
            : "درخواستی منتظر جواب نیست"
        }
      />

      {evaluations.length === 0 ? (
        /*===== Nothing At All =====*/
        <AdminEmptyState title="درخواستی نیست">
          وقتی صاحب سگی ارزیابی رایگان بخواهد، اینجا می‌بینی‌اش و پیامک هم می‌گیری.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Filter =====*/}
          <AdminFilterPills
            label="وضعیت"
            options={options}
            value={status}
            // Replace, not push: a filter isn't a place to go Back to.
            onChange={(value) => setParams({ status: value }, { history: "replace" })}
          />

          {/*===== List =====*/}
          {rows.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {status === "requested" ? "کسی منتظر ارزیابی نیست" : "موردی نیست"}
            </p>
          ) : (
            <ul
              aria-label="فهرست ارزیابی‌ها"
              aria-busy={busy}
              className={cn("mt-4 flex flex-col gap-3 transition-opacity", busy && "opacity-60")}
            >
              {rows.map((evaluation) => (
                <EvaluationRow
                  key={evaluation.id}
                  evaluation={evaluation}
                  href={serializeAdminEvaluationsSearchParams(ADMIN_EVALUATIONS_PATH, {
                    status,
                    evaluation: evaluation.id,
                  })}
                  onOpen={() => setParams({ evaluation: evaluation.id })}
                  onAnswer={(kind) => answer({ kind, evaluation })}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {/*===== Drawer =====*/}
      <EvaluationDrawer
        evaluationId={openId}
        evaluation={opened}
        // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
        // forward entry that reopens it.
        onClose={() => setParams({ evaluation: null }, { history: "replace" })}
        onAnswer={(kind) => opened && answer({ kind, evaluation: opened })}
      />

      {/*===== Answers =====*/}
      <EvaluateDialog
        evaluation={target}
        open={dialog === "evaluate"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <RejectDialog evaluation={target} open={dialog === "reject"} onOpenChange={(open) => !open && setDialog(null)} />
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-evaluations-error-title" className="py-10">
      <h1 id="admin-evaluations-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "ارزیابی‌ها باز نشدند"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/admin" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به مدیریت
      </Link>
    </section>
  );
}
