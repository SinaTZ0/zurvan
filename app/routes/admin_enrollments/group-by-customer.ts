import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import type { EnrollmentFilter } from "~/routes/admin_enrollments/search-params";

/*===== Types =====*/
/** One person to call, with every enrollment of theirs that the current filter shows. */
export type CustomerBlockData = {
  customer: AdminEnrollment["customer"];
  lines: AdminEnrollment[];
};

/*===== Filter =====*/
export function filterByStatus({
  enrollments,
  status,
}: {
  enrollments: readonly AdminEnrollment[];
  status: EnrollmentFilter;
}): AdminEnrollment[] {
  return status === "all" ? [...enrollments] : enrollments.filter((enrollment) => enrollment.status === status);
}

/*===== Group =====*/
/**
 * One block per customer, so a customer who bought two courses for two dogs is dialled once. The API already sends
 * active first and then newest; a block takes the place of its first line, and lines keep the API order.
 */
export function groupByCustomer(enrollments: readonly AdminEnrollment[]): CustomerBlockData[] {
  const blocks = new Map<string, CustomerBlockData>();

  for (const enrollment of enrollments) {
    const block = blocks.get(enrollment.customer.id);
    if (block) block.lines.push(enrollment);
    else blocks.set(enrollment.customer.id, { customer: enrollment.customer, lines: [enrollment] });
  }

  return [...blocks.values()];
}
