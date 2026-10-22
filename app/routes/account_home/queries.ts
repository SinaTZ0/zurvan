import { getDogStatus } from "~/lib/dog-status";
import { orpc } from "~/orpc/client";
import type { Dog } from "~/orpc/dog/contract";
import type { Enrollment } from "~/orpc/enrollment/contract";
import type { Evaluation } from "~/orpc/evaluation/contract";

/*===== Queries =====*/
// The page's reads, shared by the loader (which fills the cache) and the page (which reads it), so the two never ask
// with different options. A dog's status is the Admin's answer, so these are fresh for 30 seconds instead of the
// default 5 minutes (docs/tanstack-start/tanstack-start-migration-plan.md, decision 2); the customer's own changes
// (a new dog, a withdrawn request) invalidate them anyway.
const FRESH_FOR = 30_000;

export const dogsQuery = () => orpc.dog.list.queryOptions({ staleTime: FRESH_FOR });
export const evaluationsQuery = () => orpc.evaluation.listMine.queryOptions({ input: {}, staleTime: FRESH_FOR });
export const enrollmentsQuery = () => orpc.enrollment.listMine.queryOptions({ input: {}, staleTime: FRESH_FOR });

/*===== Cards =====*/
/** One panel per dog, waiting requests first, and the hero's three numbers. */
export function buildCards({
  dogs,
  evaluations,
  enrollments,
}: {
  dogs: readonly Dog[];
  evaluations: readonly Evaluation[];
  enrollments: readonly Enrollment[];
}) {
  /*------ One Card per Dog ------*/
  const cards = dogs.map((dog) => ({
    dog,
    status: getDogStatus({ dog, evaluations, enrollments }),
    activeEnrollments: enrollments.filter(
      (enrollment) => enrollment.dog.id === dog.id && enrollment.status === "active",
    ),
  }));

  /*------ Order ------*/
  // A request waiting for the Admin goes first; it is the dog the owner is most likely to look for. Then newest first.
  cards.sort(
    (a, b) =>
      Number(b.status.waitingEvaluation !== null) - Number(a.status.waitingEvaluation !== null) ||
      b.dog.createdAt.getTime() - a.dog.createdAt.getTime(),
  );

  /*------ Tally ------*/
  // The hero's three numbers, from what was read above: only the customer's own dogs' courses.
  const tally = {
    dogs: cards.length,
    training: cards.reduce((sum, card) => sum + card.activeEnrollments.length, 0),
    passed: cards.reduce((sum, card) => sum + card.dog.passedCourses.length, 0),
  };

  return { cards, tally };
}
