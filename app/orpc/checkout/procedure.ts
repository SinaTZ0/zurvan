import { env } from "~/env.server";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { resolvePublicOrigin } from "~/lib/public-origin";
import {
  adminGetDogEligibility,
  adminListPayments,
  getDogEligibility,
  listMyPayments,
  payCart,
  reviewCart,
} from "~/orpc/checkout/service";
import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";

// The customer's procedures are scoped to the signed-in customer's own dogs and payments; `admin` ones are for the
// Admin.

/*===== Dog Eligibility =====*/
export const dogEligibilityProcedure = base.checkout.eligibility
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await getDogEligibility({
      db: context.db,
      customerId: context.user.id,
      courseSlug: input.courseSlug,
    });
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    return result.dogs;
  });

/*===== Review =====*/
export const reviewCartProcedure = base.checkout.review
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context, input }) => reviewCart({ db: context.db, customerId: context.user.id, input }));

/*===== Pay =====*/
export const payCartProcedure = base.checkout.pay
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await payCart({
      db: context.db,
      gateway: getPaymentGateway(),
      customerId: context.user.id,
      input,
      callbackUrl: `${resolvePublicOrigin(context.headers, env.BETTER_AUTH_URL, env.HTTP_IP)}/payment/callback`,
    });

    if (result.kind === "invalid") {
      throw errors.INVALID_INPUT({ data: { errors: result.errors, fields: result.fields } });
    }
    if (result.kind === "not-eligible") {
      throw errors.NOT_ELIGIBLE({ data: { errors: result.errors, fields: {} } });
    }

    return { url: result.url };
  });

/*===== Payments =====*/
export const listMyPaymentsProcedure = base.checkout.payments
  .use(requireRoleMiddleware("customer"))
  .use(provideDbMiddleware)
  .handler(({ context }) => listMyPayments({ db: context.db, customerId: context.user.id }));

/*===== Admin =====*/
export const adminListPaymentsProcedure = base.checkout.admin.payments
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(({ context, input }) => adminListPayments({ db: context.db, status: input.status }));

export const adminDogEligibilityProcedure = base.checkout.admin.dogEligibility
  .use(requireRoleMiddleware("admin"))
  .use(provideDbMiddleware)
  .handler(async ({ context, input, errors }) => {
    const result = await adminGetDogEligibility({ db: context.db, dogId: input.dogId });
    if (result.kind === "not-found") throw errors.NOT_FOUND({ data: { errors: [], fields: {} } });
    return result.courses;
  });
