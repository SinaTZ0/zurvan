import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { EARLY_AGE_EXCEPTION } from "~/lib/early-age-exception";
import { checkEligibility, type Ineligibility } from "~/lib/eligibility";
import { calculateDeposit } from "~/lib/business-rules";
import { findAdminPhoneNumber, notify } from "~/lib/notify.server";
import { readDepositPercent } from "~/lib/platform-settings.server";
import type { PaymentGateway } from "~/lib/payment-gateway.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import { utcToTehranParts } from "~/lib/tehran-time";
import { normalizeWhenFree } from "~/lib/when-free-format";
import type {
  AdminPayment,
  CartReview,
  DogEligibility,
  MyDogCourse,
  Payment,
  ReviewedItem,
} from "~/orpc/checkout/contract";
import {
  findActiveEnrollmentKeys,
  findPaymentByAuthority,
  findPaymentItems,
  findPaymentsWithItems,
  insertEnrollmentUnlessActive,
  insertPayment,
  insertPaymentItems,
  lockPaymentByAuthority,
  settlePendingPayment,
  type PaymentItemRow,
  type PaymentRecord,
} from "~/orpc/checkout/repository";
import { cartItemsSchema } from "~/orpc/checkout/validation";
import { removePaidItemsFromCart } from "~/orpc/cart/service";
import { hasAcceptedSiteRules } from "~/orpc/consent/service";
import { recordFirstPurchaseCommission } from "~/orpc/commission/service";
import {
  findApprovedCourseBySlug,
  findApprovedCourses,
  findCoursesByIds,
  findCoursesBySlugs,
  findPrerequisitesByCourseIds,
  type CourseRecord,
} from "~/orpc/course/repository";
import { courseTitle, prerequisiteTitle } from "~/orpc/course/mapper";
import {
  findDogsByOwner,
  findDogWithPhoto,
  findPassedCourses,
  lockDogById,
  type DogRecord,
} from "~/orpc/dog/repository";
import { isDogId } from "~/orpc/dog/validation";
import { toPublicMedia } from "~/orpc/media/mapper";
import { m } from "~/paraglide/messages";
import { getLocale, type Locale } from "~/paraglide/runtime";

/*===== Types =====*/
type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

/** What an eligibility check reads: filled by {@link judge}. */
type Judged = { dog: DogRecord; course: CourseRecord; problems: Ineligibility[] };

/*===== Eligibility =====*/
/**
 * F4: judges each dog against its course, as of `now`. The one place that reads the facts the pure check needs, so the
 * cart, «پرداخت», the callback and the Admin's Dog Detail all ask the same question the same way.
 */
async function judge({
  db,
  pairs,
  now,
  locale = getLocale(),
}: {
  db: DatabaseOrTransaction;
  pairs: { dog: DogRecord; course: CourseRecord }[];
  now: Date;
  /**
   * The language the reasons are worded in: the request's by default (inside `/rpc`, the page's; the Admin's pages are
   * Persian).
   */
  locale?: Locale;
}): Promise<Judged[]> {
  const dogIds = [...new Set(pairs.map((pair) => pair.dog.id))];
  const courseIds = [...new Set(pairs.map((pair) => pair.course.id))];

  const [prerequisites, passed, active] = await Promise.all([
    findPrerequisitesByCourseIds({ db, courseIds }),
    findPassedCourses({ db, dogIds }),
    findActiveEnrollmentKeys({ db, dogIds, courseIds }),
  ]);
  const today = utcToTehranParts(now).date;

  return pairs.map(({ dog, course }) => ({
    dog,
    course,
    problems: checkEligibility({
      dog,
      isEvaluated: dog.isEvaluated,
      course,
      prerequisites: prerequisites
        .filter((entry) => entry.courseId === course.id)
        .map((entry) => ({
          id: entry.requiredCourseId,
          slug: entry.slug,
          title: prerequisiteTitle({ locale, prerequisite: entry }),
        })),
      passedCourseIds: new Set(passed.filter((entry) => entry.dogId === dog.id).map((entry) => entry.courseId)),
      hasActiveEnrollment: active.has(`${dog.id}:${course.id}`),
      today,
      earlyAgeException: EARLY_AGE_EXCEPTION,
      locale,
    }),
  }));
}

/*===== Dog Eligibility =====*/
type DogEligibilityResult = { kind: "success"; dogs: DogEligibility[] } | NotFoundResult;

/** Which of the customer's dogs can take a course, and why not (F4), for Course Detail. */
export async function getDogEligibility({
  db,
  customerId,
  courseSlug,
  now = new Date(),
  locale = getLocale(),
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  courseSlug: string;
  now?: Date;
  /** The language of the reasons: Course Detail's, which is public and has an English page. */
  locale?: Locale;
}): Promise<DogEligibilityResult> {
  const course = await findApprovedCourseBySlug({ db, slug: courseSlug });
  if (!course) return { kind: "not-found" };

  const dogs = await findDogsByOwner({ db, ownerId: customerId });
  const judged = await judge({ db, pairs: dogs.map((dog) => ({ dog, course })), now, locale });

  return {
    kind: "success",
    dogs: judged.map(({ dog, problems }) => ({
      dog: toDogSummary(dog),
      eligible: problems.length === 0,
      problems,
    })),
  };
}

function toDogSummary(dog: DogRecord) {
  return { id: dog.id, name: dog.name, photo: dog.photo ? toPublicMedia(dog.photo) : null };
}

/**
 * Every approved course against one of the customer's own dogs (F4), for the purchase page that starts from the dog. The
 * same `judge` as the cart and «پرداخت», so what is offered here is what can be bought. Another owner's dog reads as
 * `not-found`.
 */
export async function getMyDogCourses({
  db,
  customerId,
  dogId,
  now = new Date(),
  locale = getLocale(),
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  dogId: string;
  now?: Date;
  /** The language of the reasons: `/buy`'s, which has an English page. */
  locale?: Locale;
}): Promise<{ kind: "success"; courses: MyDogCourse[] } | NotFoundResult> {
  if (!isDogId(dogId)) return { kind: "not-found" };
  const dog = (await findDogsByOwner({ db, ownerId: customerId })).find((candidate) => candidate.id === dogId);
  if (!dog) return { kind: "not-found" };

  const courses = await findApprovedCourses({ db });
  const judged = await judge({ db, pairs: courses.map((course) => ({ dog, course })), now, locale });
  return {
    kind: "success",
    courses: judged.map(({ course, problems }) => ({
      courseSlug: course.slug,
      eligible: problems.length === 0,
      problems,
    })),
  };
}

/** The Admin's Dog Detail: every approved course against one dog. */
export async function adminGetDogEligibility({
  db,
  dogId,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  dogId: string;
  now?: Date;
}): Promise<
  | {
      kind: "success";
      courses: { course: { slug: string; title: string }; eligible: boolean; problems: Ineligibility[] }[];
    }
  | NotFoundResult
> {
  if (!isDogId(dogId)) return { kind: "not-found" };
  const dog = await findDogWithPhoto({ db, id: dogId });
  if (!dog) return { kind: "not-found" };

  const courses = await findApprovedCourses({ db });
  const judged = await judge({ db, pairs: courses.map((course) => ({ dog, course })), now });
  return {
    kind: "success",
    courses: judged.map(({ course, problems }) => ({
      course: { slug: course.slug, title: course.title },
      eligible: problems.length === 0,
      problems,
    })),
  };
}

/*===== Cart =====*/
/**
 * Reads a cart's items against the customer's dogs and the catalogue, each with its price and verdict. An item whose
 * course is gone or whose dog isn't the customer's comes back unavailable instead of being dropped, so the cart can
 * show it and let the customer remove it.
 */
async function reviewItems({
  db,
  customerId,
  items,
  now,
  locale = getLocale(),
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  items: { courseSlug: string; dogId: string }[];
  now: Date;
  /** The language of the reasons and the course names: the cart's page. */
  locale?: Locale;
}): Promise<ReviewedItem[]> {
  const [courses, dogs] = await Promise.all([
    findCoursesBySlugs({ db, slugs: [...new Set(items.map((item) => item.courseSlug))] }),
    findDogsByOwner({ db, ownerId: customerId }),
  ]);

  const pairs = items.flatMap((item) => {
    const course = courses.find((candidate) => candidate.slug === item.courseSlug);
    const dog = dogs.find((candidate) => candidate.id === item.dogId);
    return course && dog ? [{ item, course, dog }] : [];
  });
  const judged = await judge({ db, pairs, now, locale });

  return items.map((item): ReviewedItem => {
    const index = pairs.findIndex((pair) => pair.item === item);
    const verdict = judged[index];
    if (!verdict) {
      return {
        ...item,
        course: null,
        dog: null,
        price: null,
        eligible: false,
        problems: [{ kind: "not-for-sale", message: m.server_cart_item_gone({}, { locale }), courseSlug: null }],
      };
    }
    const { course, dog, problems } = verdict;
    return {
      ...item,
      course: { slug: course.slug, title: courseTitle({ locale, course }), latinName: course.latinName },
      dog: toDogSummary(dog),
      price: course.price,
      eligible: problems.length === 0,
      problems,
    };
  });
}

/** The cart with current prices and eligibility. The total is the sum of the eligible items (F5). */
export async function reviewCart({
  db,
  customerId,
  input,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  input: { items: { courseSlug: string; dogId: string }[] };
  now?: Date;
}): Promise<CartReview> {
  // An empty, oversized or malformed cart reviews as empty: «پرداخت» reports it properly.
  const parsed = cartItemsSchema.safeParse(input.items);
  if (!parsed.success) return { items: [], total: 0, depositPercent: 100, dueNow: 0 };

  const items = await reviewItems({ db, customerId, items: parsed.data, now });
  const total = items.reduce((sum, item) => sum + (item.eligible ? (item.price ?? 0) : 0), 0);
  const depositPercent = await readDepositPercent({ db });
  return { items, total, depositPercent, dueNow: calculateDeposit({ total, percent: depositPercent }) };
}

/*===== Pay =====*/
type PayResult =
  | { kind: "redirect"; url: string }
  | InvalidResult
  | { kind: "not-eligible"; errors: string[] }
  | { kind: "rules-not-accepted" };

/**
 * «پرداخت» (F5): checks every item again and reads its price, saves a **pending payment** listing the items (dog,
 * course, price) and starts the gateway for the total. Nothing is enrolled until the gateway calls back.
 *
 * All or nothing: if any item can't be bought any more, nothing is saved and the reasons come back, so the customer
 * looks at the cart again instead of paying a different total from the one they saw.
 *
 * @returns `redirect` with where to send the customer; `invalid` for an empty or oversized cart; `not-eligible` with a
 * line for each item that fails, in the request's language; `rules-not-accepted` when site rules are published and this customer has not
 * accepted the version in force.
 */
export async function payCart({
  db,
  gateway,
  customerId,
  input,
  callbackUrl,
  rules,
  now = new Date(),
}: {
  db: Database;
  gateway: PaymentGateway;
  customerId: string;
  input: {
    items: { courseSlug: string; dogId: string }[];
    /** When the customer is usually free, for coordination (F5). Optional; unknown values are dropped. */
    availableDays?: readonly string[];
    availablePeriods?: readonly string[];
  };
  /** The absolute URL of the payment callback route. */
  callbackUrl: string;
  /** The site rules in force; the registry's by default. A test passes its own to switch the gate on. */
  rules?: Parameters<typeof hasAcceptedSiteRules>[0]["rules"];
  now?: Date;
}): Promise<PayResult> {
  const parsed = cartItemsSchema.safeParse(input.items);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  // With site rules published, money is taken only from someone who accepted the version in force (F13).
  if (!(await hasAcceptedSiteRules({ db, userId: customerId, ...(rules === undefined ? {} : { rules }) }))) {
    return { kind: "rules-not-accepted" };
  }

  const items = await reviewItems({ db, customerId, items: parsed.data, now });
  const failing = items.filter((item) => !item.eligible);
  if (failing.length > 0) {
    return {
      kind: "not-eligible",
      errors: failing.flatMap((item) =>
        item.problems.map((problem) =>
          item.course && item.dog
            ? m.server_checkout_item_problem({
                course: item.course.title,
                dog: item.dog.name,
                problem: problem.message,
              })
            : problem.message,
        ),
      ),
    };
  }

  // Every item is eligible, so each has a course, a dog and a price.
  const priced = items.map((item) => ({ ...item, price: item.price ?? 0 }));
  const total = priced.reduce((sum, item) => sum + item.price, 0);
  // The Admin's deposit setting (100 until the owner approves one): the gateway is charged the deposit, the items keep their
  // full prices, and the balance is settled when the lessons are arranged, outside the app.
  const depositPercent = await readDepositPercent({ db });
  const amount = calculateDeposit({ total, percent: depositPercent });
  const courses = await findCoursesBySlugs({ db, slugs: priced.map((item) => item.courseSlug) });
  // A preference for the call that arranges the lessons: kept in the week's order, once each, never a booked time.
  const whenFree = normalizeWhenFree({ days: input.availableDays ?? [], periods: input.availablePeriods ?? [] });

  /*------ Gateway ------*/
  // Started outside the database transaction: a real gateway is an HTTP call, and no lock should wait on it.
  const started = await gateway.start({ amount, callbackUrl });

  await db.transaction(async (tx) => {
    const saved = await insertPayment({
      db: tx,
      values: {
        customerId,
        amount,
        totalAmount: total,
        depositPercent,
        availableDays: whenFree.days,
        availablePeriods: whenFree.periods,
        gateway: gateway.name,
        authority: started.authority,
        createdAt: now,
      },
    });
    await insertPaymentItems({
      db: tx,
      values: priced.map((item) => ({
        paymentId: saved.id,
        // `reviewItems` found the course by this slug.
        courseId: courses.find((course) => course.slug === item.courseSlug)?.id ?? "",
        dogId: item.dogId,
        price: item.price,
      })),
    });
  });

  return { kind: "redirect", url: started.redirectUrl };
}

/*===== Gateway Callback =====*/
type CallbackResult =
  | { kind: "unknown" }
  | { kind: "already-settled"; paymentId: string; status: string }
  | { kind: "failed"; paymentId: string }
  | { kind: "paid"; paymentId: string; enrolled: number; notEnrolled: number };

type Settled = {
  result: CallbackResult;
  payment?: PaymentRecord;
  enrolledTitles?: { course: string; dog: string }[];
  notEnrolled?: number;
};

/** Not reachable while the payment row is locked and pending; kept so a lost update can never enroll twice. */
function settledElsewhere(payment: PaymentRecord): CallbackResult {
  return { kind: "already-settled", paymentId: payment.id, status: "paid" };
}

/**
 * Handles the gateway's callback (F5): verifies the payment server-side, then, in one database transaction, settles it
 * once, creates an enrollment for each item that is still eligible, and writes the partner's commission when it is due.
 *
 * Idempotent: the payment is locked and must still be pending, and settling is a conditional update, so a repeated or
 * concurrent callback finds it settled and changes nothing (the unique `authority` is the other guard).
 *
 * An item that stopped being eligible between checkout and now (the same course bought for the same dog in another
 * tab, the Admin archived the course) gets no enrollment but the payment stays `paid`: the Admin sees the item flagged
 * as "paid, not enrolled" and gives the money back outside the app.
 */
export async function completeGatewayPayment({
  db,
  gateway,
  authority,
  callbackParams,
  now = new Date(),
}: {
  db: Database;
  gateway: PaymentGateway;
  authority: string;
  callbackParams: URLSearchParams;
  now?: Date;
}): Promise<CallbackResult> {
  const known = await findPaymentByAuthority({ db, authority });
  if (!known) return { kind: "unknown" };
  if (known.status !== "pending") return { kind: "already-settled", paymentId: known.id, status: known.status };

  const verification = await gateway.verify({ authority, amount: known.amount, callbackParams });

  const settled = await db.transaction(async (tx): Promise<Settled> => {
    const payment = await lockPaymentByAuthority({ db: tx, authority });
    // Another callback settled it while this one waited for the lock.
    if (!payment) return { result: { kind: "unknown" } };
    if (payment.status !== "pending") {
      return { result: { kind: "already-settled", paymentId: payment.id, status: payment.status } };
    }

    /*------ Failed ------*/
    if (!verification.ok) {
      const done = await settlePendingPayment({
        db: tx,
        id: payment.id,
        values: {
          status: "failed",
          failureReason: verification.reason,
          referenceId: null,
          cardNumberMasked: null,
          paidAt: null,
        },
      });
      return { result: done ? { kind: "failed", paymentId: payment.id } : settledElsewhere(payment) };
    }

    /*------ Paid ------*/
    const done = await settlePendingPayment({
      db: tx,
      id: payment.id,
      values: {
        status: "paid",
        referenceId: verification.referenceId,
        cardNumberMasked: verification.cardNumberMasked,
        failureReason: null,
        paidAt: now,
      },
    });
    if (!done) return { result: settledElsewhere(payment) };

    /*------ Enrollments ------*/
    const items = await findPaymentItems({ db: tx, paymentId: payment.id });
    // Dogs are locked in a fixed order, so two callbacks touching the same dogs can't deadlock.
    // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from the spread.
    for (const dogId of [...new Set(items.map((item) => item.dogId))].sort()) {
      await lockDogById({ db: tx, id: dogId });
    }
    const courses = await findCoursesByIds({ db: tx, ids: [...new Set(items.map((item) => item.courseId))] });

    let enrolledTotal = 0;
    const enrolled: { course: string; dog: string }[] = [];
    for (const item of items) {
      const course = courses.find((candidate) => candidate.id === item.courseId);
      const dog = await findDogWithPhoto({ db: tx, id: item.dogId });
      if (!course || !dog) continue;

      // One at a time: an enrollment made a moment ago for this same payment counts for the next item's check.
      const [verdict] = await judge({ db: tx, pairs: [{ dog, course }], now });
      if (!verdict || verdict.problems.length > 0) continue;

      const enrollmentId = await insertEnrollmentUnlessActive({
        db: tx,
        // The price paid, as saved at checkout: the course may have changed since.
        values: {
          courseId: course.id,
          dogId: dog.id,
          customerId: payment.customerId,
          paymentItemId: item.id,
          price: item.price,
          createdAt: now,
        },
      });
      if (!enrollmentId) continue;
      enrolledTotal += item.price;
      enrolled.push({ course: course.title, dog: dog.name });
    }

    /*------ Commission ------*/
    await recordFirstPurchaseCommission({
      db: tx,
      customerId: payment.customerId,
      paymentId: payment.id,
      baseAmount: enrolledTotal,
    });

    const notEnrolled = items.length - enrolled.length;
    return {
      result: { kind: "paid", paymentId: payment.id, enrolled: enrolled.length, notEnrolled },
      payment,
      enrolledTitles: enrolled,
      notEnrolled,
    };
  });

  // The items it bought leave the customer's cart, on whichever device it was filled. After the commit and best-effort:
  // a cart left untidy changes no money, and an item already enrolled shows as not buyable.
  if (settled.result.kind === "paid") {
    try {
      await removePaidItemsFromCart({ db, userId: known.customerId, paymentId: known.id });
    } catch (error) {
      console.error(`[checkout] could not take payment ${known.id}'s items out of the cart`, error);
    }
  }

  if (settled.payment && settled.enrolledTitles) {
    await notifyPaid({
      db,
      payment: settled.payment,
      enrolled: settled.enrolledTitles,
      notEnrolled: settled.notEnrolled ?? 0,
    });
  }
  return settled.result;
}

/** F9: the customer's receipt, and the Admin's call to make. Sent after the payment is committed. */
async function notifyPaid({
  db,
  payment,
  enrolled,
  notEnrolled,
}: {
  db: Database;
  payment: PaymentRecord;
  enrolled: { course: string; dog: string }[];
  notEnrolled: number;
}) {
  const [row] = await findPaymentsWithItems({ db, customerId: payment.customerId }).then((rows) =>
    rows.filter((entry) => entry.payment.id === payment.id),
  );
  const what = enrolled.map((entry) => `${entry.course} برای ${entry.dog}`).join("، ");

  await notify({
    phoneNumber: row?.customer.phoneNumber,
    kind: "payment-paid",
    body:
      `آموزش K9: پرداخت انجام شد${what ? ` (${what})` : ""}؛ برای هماهنگی با شما تماس می‌گیریم.` +
      (notEnrolled > 0 ? " برای بخشی از خرید ثبت‌نام انجام نشد؛ با شما تماس می‌گیریم." : ""),
  });
  await notify({
    phoneNumber: await findAdminPhoneNumber({ db }),
    kind: "payment-paid-admin",
    body:
      `آموزش K9: خرید تازه از ${row?.customer.name ?? "یک مشتری"}${what ? `: ${what}` : ""}. با او تماس بگیر.` +
      (notEnrolled > 0 ? ` ${notEnrolled} مورد پرداخت شد ولی ثبت‌نام نشد.` : ""),
  });
}

/*===== Payments =====*/
function toPayment({
  row,
  locale,
}: {
  row: { payment: PaymentRecord; items: PaymentItemRow[] };
  locale: Locale;
}): Payment {
  const { payment } = row;
  if (payment.status !== "pending" && payment.status !== "paid" && payment.status !== "failed") {
    throw new Error(`Payment ${payment.id} has an unknown status: ${payment.status}`);
  }
  // Read back through the filter that wrote them, so a stray value in the column can't reach a page.
  const whenFree = normalizeWhenFree({ days: payment.availableDays, periods: payment.availablePeriods });
  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    // A payment made before deposits existed was the whole price.
    totalAmount: payment.totalAmount ?? payment.amount,
    depositPercent: payment.depositPercent,
    availableDays: whenFree.days,
    availablePeriods: whenFree.periods,
    referenceId: payment.referenceId,
    cardNumberMasked: payment.cardNumberMasked,
    failureReason: payment.failureReason,
    items: row.items.map((entry) => ({
      id: entry.item.id,
      course: { slug: entry.course.slug, title: courseTitle({ locale, course: entry.course }) },
      dog: entry.dog,
      price: entry.item.price,
      enrollment: entry.enrollment,
    })),
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
  };
}

/** The customer's payments, newest first, each with the enrollments its items bought (the Purchases page). */
export async function listMyPayments({
  db,
  customerId,
}: {
  db: DatabaseOrTransaction;
  customerId: string;
}): Promise<Payment[]> {
  return (await findPaymentsWithItems({ db, customerId })).map((row) => toPayment({ row, locale: getLocale() }));
}

/** Every payment, newest first; an item of a paid payment with no enrollment is flagged (F5). */
export async function adminListPayments({
  db,
  status,
}: {
  db: DatabaseOrTransaction;
  status?: string;
}): Promise<AdminPayment[]> {
  const rows = await findPaymentsWithItems({ db, status });
  return rows.map((row) => {
    // The Admin is Persian: the stored title, whatever language the request carries.
    const payment = toPayment({ row, locale: "fa" });
    const items = payment.items.map((item) => ({
      ...item,
      paidNotEnrolled: payment.status === "paid" && item.enrollment === null,
    }));
    return {
      ...payment,
      customer: row.customer,
      items,
      paidNotEnrolledCount: items.filter((item) => item.paidNotEnrolled).length,
    };
  });
}
