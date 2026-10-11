import { env } from "~/env.server";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import type { UserRole } from "~/lib/user-constants";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import {
  applyDiscountCode,
  bookCourse,
  cancelEnrollment,
  getBookingOptions,
  getOrder,
  payOrder,
  removeDiscountCode,
} from "~/orpc/order/service";

// Booking and paying are the customer's, scoped to their own dogs and orders. Cancelling an enrollment is open to the
// customer, its trainer and the Admin; the service scopes it to each.

/** Where the gateway sends the customer back. The app's public origin is the one Better-Auth already uses. */
const PAYMENT_CALLBACK_URL = `${env.BETTER_AUTH_URL}/payment/callback`;

/*===== Booking Options =====*/
export const bookingOptionsProcedure = base.order.bookingOptions
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getBookingOptions({
      db: context.db,
      customerId: context.user.id,
      courseSlug: input.courseSlug,
      kind: input.kind,
    });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.options;
  });

/*===== Book =====*/
export const bookProcedure = base.order.book
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await bookCourse({ db: context.db, customerId: context.user.id, input });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-eligible") throw errors.NOT_ELIGIBLE({ data: { errors: result.errors, fields: {} } });

    return { orderId: result.orderId };
  });

/*===== Get =====*/
export const getOrderProcedure = base.order.get
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getOrder({ db: context.db, customerId: context.user.id, id: input.id });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });

    return result.order;
  });

/*===== Discount Code =====*/
export const applyDiscountProcedure = base.order.applyDiscount
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { id, ...details } = input;
    const result = await applyDiscountCode({ db: context.db, customerId: context.user.id, id, input: details });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-payable") throw errors.NOT_PAYABLE({ data: { errors: result.errors, fields: {} } });

    return result.order;
  });

export const removeDiscountProcedure = base.order.removeDiscount
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await removeDiscountCode({ db: context.db, customerId: context.user.id, id: input.id });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-payable") throw errors.NOT_PAYABLE({ data: { errors: result.errors, fields: {} } });

    return result.order;
  });

/*===== Pay =====*/
export const payProcedure = base.order.pay
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await payOrder({
      db: context.db,
      gateway: getPaymentGateway(),
      customerId: context.user.id,
      id: input.id,
      useWallet: input.useWallet,
      callbackUrl: PAYMENT_CALLBACK_URL,
    });

    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-payable") throw errors.NOT_PAYABLE({ data: { errors: result.errors, fields: {} } });

    return result;
  });

/*===== Cancel an Enrollment =====*/
export const cancelEnrollmentProcedure = base.order.cancelEnrollment
  .use(requireRoleMiddleware("customer", "trainer", "admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const { enrollmentId, ...details } = input;
    const result = await cancelEnrollment({
      db: context.db,
      // The middleware has let only these three roles through.
      actor: { userId: context.user.id, role: context.user.role as Exclude<UserRole, "partner"> },
      id: enrollmentId,
      input: details,
    });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    if (result.kind === "not-cancellable") {
      throw errors.NOT_CANCELLABLE({ data: { errors: result.errors, fields: {} } });
    }

    return { enrollmentId: result.enrollmentId, refund: result.refund };
  });
