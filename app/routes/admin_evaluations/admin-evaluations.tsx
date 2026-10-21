import { cn } from "cn";
import { CheckCheckIcon, ClipboardCheckIcon, type LucideIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills, type AdminFilterOption } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { EvaluateDialog } from "~/routes/admin_evaluations/components/evaluate-dialog";
import { EvaluationDrawer } from "~/routes/admin_evaluations/components/evaluation-drawer";
import { EvaluationRow } from "~/routes/admin_evaluations/components/evaluation-row";
import { LEAVE_MS, PageMotion } from "~/routes/admin_evaluations/components/page-motion";
import { RejectDialog } from "~/routes/admin_evaluations/components/reject-dialog";
import { describeDay } from "~/routes/admin_evaluations/dates";
import { groupByDay } from "~/routes/admin_evaluations/day-groups";
import { type LeavingRow, withLeavingRows } from "~/routes/admin_evaluations/leaving";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";
import {
  ADMIN_EVALUATIONS_PATH,
  adminEvaluationsSearchParams,
  EVALUATION_FILTERS,
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

/** What a status filter says when it has no rows. «درخواستی منتظر نیست» is the good news he hopes for. */
const EMPTY_VIEWS: Record<EvaluationFilter, { title: string; body?: string; icon?: LucideIcon }> = {
  requested: {
    title: "درخواستی منتظر نیست",
    body: "به همه‌ی درخواست‌ها جواب دادی. درخواست بعدی که بیاد، پیامکش رو می‌گیری.",
    icon: CheckCheckIcon,
  },
  evaluated: { title: "هنوز سگی ارزیابی نشده" },
  rejected: { title: "درخواستی رد نشده" },
  withdrawn: { title: "کسی درخواستش رو پس نگرفته" },
  all: { title: "موردی نیست" },
};

/** The stagger between rows as a list arrives under a new filter; from the sixth they come together. */
const RISE_STEP_S = 0.05;
const MAX_STAGGERED = 5;

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
 * F3 from the Admin's side: the queue of free-evaluation requests, waiting ones first. Each row is a contact sheet (the
 * dog, the customer to call, a strip of the prints they sent), grouped by the day it came in; the drawer holds
 * everything for the phone call and the two answers, «ارزیابی شد» and «رد».
 *
 * A request he answers in «در انتظار» doesn't just vanish when the list reloads: the page keeps a copy of it for under
 * a second (`leaving`), put back where it stood, so it can be stamped and fold away.
 */
export default function AdminEvaluationsPage({ loaderData }: Route.ComponentProps) {
  const { evaluations } = loaderData;

  /*------ URL State ------*/
  const [{ status, evaluation: openId }, setParams] = useQueryStates(adminEvaluationsSearchParams);

  /*------ Answers ------*/
  // One dialog for every button. The target stays after closing so the exit animation keeps its words, and `session`
  // remounts the dialog for each opening so an old failure doesn't come back.
  const [answer, setAnswer] = useState<{ evaluation: AdminEvaluation; kind: AnswerKind; session: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function startAnswer({ kind, evaluation }: { kind: AnswerKind; evaluation: AdminEvaluation }) {
    setAnswer((previous) => ({ evaluation, kind, session: (previous?.session ?? 0) + 1 }));
    setDialogOpen(true);
  }

  /*------ Busy ------*/
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== "idle" || revalidator.state !== "idle";

  /*------ Leaving Rows ------*/
  const [leaving, setLeaving] = useState<LeavingRow[]>([]);
  const batchRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  // A removal timer must not fire into an unmounted page.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  /*------ List Arrival ------*/
  // `arrival` counts the filter changes he makes, so the new list rises in (never on load); `settled` counts the exits
  // that finished, so an empty queue left by his last answer rises in too instead of snapping into place.
  const [arrival, setArrival] = useState(0);
  const [settled, setSettled] = useState(0);

  /*------ Counts ------*/
  const counts = useMemo(() => {
    const byStatus = { requested: 0, evaluated: 0, rejected: 0, withdrawn: 0 };
    for (const evaluation of evaluations) byStatus[evaluation.status] += 1;
    return { ...byStatus, all: evaluations.length };
  }, [evaluations]);

  const options: AdminFilterOption<EvaluationFilter>[] = EVALUATION_FILTERS.map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: counts[value],
  }));

  /*------ Rows and Days ------*/
  // Only «در انتظار» puts answered rows back for their exit: elsewhere an answer keeps the row (only its chip changes).
  const rows = useMemo(() => {
    const shown = status === "all" ? evaluations : evaluations.filter((item) => item.status === status);
    return status === "requested" ? withLeavingRows({ rows: shown, leaving }) : shown;
  }, [evaluations, status, leaving]);

  const groups = useMemo(() => groupByDay(rows), [rows]);
  // A label per day only when the list spans more than one; a list of one day needs none.
  const labelled = useMemo(() => new Set(groups.map((group) => group.day)).size > 1, [groups]);

  const leavingKinds = new Map(leaving.map((row) => [row.evaluation.id, row.kind]));
  const playing = new Set(leaving.filter((row) => row.batch !== undefined).map((row) => row.evaluation.id));

  // The drawer looks in the full list, so an answer that moves the row out of this filter doesn't close it.
  const opened = openId === null ? null : (evaluations.find((item) => item.id === openId) ?? null);

  const listRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  /*------ Handlers ------*/
  /** A new filter: drops every kept row (a new view never shows another view's exit) and lets the list rise in. */
  function changeFilter(next: EvaluationFilter) {
    if (next === status) return;
    setLeaving([]);
    setArrival((previous) => previous + 1);
    // Replace, not push: a filter isn't a place to go Back to.
    void setParams({ status: next }, { history: "replace" });
  }

  /** The API accepted an answer: in «در انتظار», keep the row, in its place, until its exit has played. */
  function keepLeavingRow({ evaluation, kind }: { evaluation: AdminEvaluation; kind: AnswerKind }) {
    if (status !== "requested") return;
    // Under reduced motion there is no exit to play: the reload simply takes the row away.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const index = rows.findIndex((row) => row.id === evaluation.id);
    const before = rows
      .slice(0, Math.max(index, 0))
      .map((row) => row.id)
      // oxlint-disable-next-line unicorn/no-array-reverse -- a fresh array from `map`; the project's lib has no `toReversed`
      .reverse();
    setLeaving((previous) => [
      ...previous.filter((row) => row.evaluation.id !== evaluation.id),
      { evaluation, kind, before },
    ]);
  }

  /** The dialog closed: the rows it answered start their exit now (not under its backdrop), and leave when it's done. */
  function closeDialog() {
    setDialogOpen(false);

    const batch = ++batchRef.current;
    let started = false;
    setLeaving((previous) => {
      if (!previous.some((row) => row.batch === undefined)) return previous;
      started = true;
      return previous.map((row) => (row.batch === undefined ? { ...row, batch } : row));
    });
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setLeaving((previous) => previous.filter((row) => row.batch !== batch));
      if (started) setSettled((previous) => previous + 1);
    }, LEAVE_MS);
    timersRef.current.add(timer);
  }

  /*------ Rendering Helpers ------*/
  let riseIndex = 0;
  const nextRise = () => (arrival > 0 ? Math.min(riseIndex++, MAX_STAGGERED) * RISE_STEP_S : null);
  const emptyView = EMPTY_VIEWS[status];

  return (
    <div>
      <PageMotion />

      {/*===== Header =====*/}
      <AdminPageHeader
        title="ارزیابی‌ها"
        summary={
          counts.requested > 0 ? `${formatNumberFa(counts.requested)} درخواست منتظر جوابته` : "درخواستی منتظر نیست"
        }
      />

      {evaluations.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="درخواستی نیست" icon={ClipboardCheckIcon}>
          وقتی صاحب سگی ارزیابی رایگان بخواد، این‌جا می‌بینیش و پیامکش هم برات میاد.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Filter =====*/}
          {/* A count that changes under him pops inside the pills themselves. */}
          <div className="mb-5">
            <AdminFilterPills label="وضعیت" options={options} value={status} onChange={changeFilter} />
          </div>

          {/*===== The Queue =====*/}
          {/* Focusable so focus has somewhere to land when the row he just answered leaves. */}
          <div
            ref={listRef}
            tabIndex={-1}
            aria-busy={busy}
            aria-label="فهرست ارزیابی‌ها"
            className={cn("scroll-mt-24 rounded-3xl transition-opacity outline-none", busy && "opacity-60")}
          >
            {rows.length === 0 ? (
              <div key={`${arrival}-${settled}`} className={cn((arrival > 0 || settled > 0) && "answer-in")}>
                <AdminEmptyState title={emptyView.title} icon={emptyView.icon}>
                  {emptyView.body}
                </AdminEmptyState>
              </div>
            ) : (
              <div key={arrival} className={cn(ADMIN_PLATE, "overflow-hidden")}>
                {groups.map((group, groupIndex) => {
                  const allLeaving = group.rows.every((row) => leavingKinds.has(row.id));
                  const folding = allLeaving && group.rows.every((row) => playing.has(row.id));
                  const labelId = `evaluations-day-${group.day}-${groupIndex}`;
                  // The day's label rises with its first request.
                  const labelRise = labelled && arrival > 0 ? Math.min(riseIndex, MAX_STAGGERED) * RISE_STEP_S : null;

                  return (
                    <div
                      key={`${group.day}-${groupIndex}`}
                      inert={allLeaving}
                      // A grid of one row, so a day whose last request left can fold, its label with it.
                      className={cn(
                        "grid grid-rows-[1fr]",
                        groupIndex > 0 && ["border-t", ADMIN_HAIRLINE],
                        folding && "ev-leaving ev-fold",
                      )}
                    >
                      <div className={cn("min-h-0", folding && "overflow-hidden")}>
                        {/*------ Day ------*/}
                        {labelled && (
                          <p
                            id={labelId}
                            style={
                              labelRise !== null
                                ? ({ "--answer-delay": `${labelRise}s` } as React.CSSProperties)
                                : undefined
                            }
                            className={cn(
                              "px-4 pt-3.5 pb-0.5 text-xs font-bold text-muted-foreground sm:px-5 xl:px-6",
                              labelRise !== null && "answer-in",
                            )}
                          >
                            {describeDay({ day: group.day })}
                          </p>
                        )}

                        {/*------ Requests ------*/}
                        <ul
                          aria-labelledby={labelled ? labelId : undefined}
                          aria-label={labelled ? undefined : "درخواست‌ها"}
                          className={cn("divide-y", ADMIN_HAIRLINE)}
                        >
                          {group.rows.map((evaluation) => {
                            const kind = leavingKinds.get(evaluation.id);
                            return (
                              <EvaluationRow
                                key={evaluation.id}
                                evaluation={evaluation}
                                href={serializeAdminEvaluationsSearchParams(ADMIN_EVALUATIONS_PATH, {
                                  status,
                                  evaluation: evaluation.id,
                                })}
                                leaving={kind !== undefined}
                                exit={kind && playing.has(evaluation.id) ? { kind, fold: !folding } : null}
                                rise={nextRise()}
                                quietChip={status === "requested"}
                                onOpen={() => void setParams({ evaluation: evaluation.id })}
                                onAnswer={(next) => startAnswer({ kind: next, evaluation })}
                              />
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/*===== Drawer =====*/}
      <EvaluationDrawer
        evaluationId={openId}
        evaluation={opened}
        footerRef={footerRef}
        // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
        // forward entry that reopens it.
        onClose={() => void setParams({ evaluation: null }, { history: "replace" })}
        onAnswer={(kind) => opened && startAnswer({ kind, evaluation: opened })}
      />

      {/*===== Answers =====*/}
      {answer &&
        (answer.kind === "evaluate" ? (
          <EvaluateDialog
            key={answer.session}
            evaluation={answer.evaluation}
            open={dialogOpen}
            onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
            onConfirmed={(evaluation) => keepLeavingRow({ evaluation, kind: "evaluate" })}
            returnFocus={() => (openId !== null ? footerRef.current : listRef.current)}
          />
        ) : (
          <RejectDialog
            key={answer.session}
            evaluation={answer.evaluation}
            open={dialogOpen}
            onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
            onConfirmed={(evaluation) => keepLeavingRow({ evaluation, kind: "reject" })}
            returnFocus={() => (openId !== null ? footerRef.current : listRef.current)}
          />
        ))}
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "ارزیابی‌ها باز نشدن"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline", size: "default" })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
