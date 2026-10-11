import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  /*===== Storefront =====*/
  layout("routes/layout_public/layout-public.tsx", [
    index("routes/home/home.tsx"),
    route("courses/:slug", "routes/course_detail/course-detail.tsx"),
    route("assessment", "routes/assessment/assessment.tsx"),
  ]),

  /*===== Account (customers, trainers, partners) =====*/
  route("account", "routes/layout_account/layout-account.tsx", [
    index("routes/account_home/account-home.tsx"),
    route("dogs", "routes/account_dogs/account-dogs.tsx"),
    route("dogs/:dogId", "routes/account_dog_detail/account-dog-detail.tsx"),
    // One form module for adding and editing, so each route needs its own id.
    route("dogs/new", "routes/account_dog_form/account-dog-form.tsx", { id: "account-dog-new" }),
    route("dogs/:dogId/edit", "routes/account_dog_form/account-dog-form.tsx", { id: "account-dog-edit" }),
    route("assessments", "routes/account_assessments/account-assessments.tsx"),
    route("book/:courseSlug", "routes/account_book/account-book.tsx"),
    route("checkout/:orderId", "routes/account_checkout/account-checkout.tsx"),
    route("checkout/:orderId/result", "routes/account_payment_result/account-payment-result.tsx"),
    route("training", "routes/account_training/account-training.tsx"),
    route("training/:enrollmentId", "routes/account_enrollment_detail/account-enrollment-detail.tsx"),
  ]),

  /*===== Trainer (trainers, and the Admin as head trainer) =====*/
  route("trainer", "routes/layout_trainer/layout-trainer.tsx", [
    index("routes/trainer_schedule/trainer-schedule.tsx"),
    route("assessments/:assessmentId", "routes/trainer_assessment_detail/trainer-assessment-detail.tsx"),
    route("enrollments", "routes/trainer_enrollments/trainer-enrollments.tsx"),
    route("enrollments/:enrollmentId", "routes/trainer_enrollment_detail/trainer-enrollment-detail.tsx"),
  ]),

  route("auth", "routes/auth/auth.tsx"),

  /*===== Resource Routes =====*/
  route("api/auth/*", "routes/api_auth/api-auth.ts"),
  route("rpc/*", "routes/rpc/rpc.ts"),
  route("payment/callback", "routes/payment_callback/payment-callback.ts"),
] satisfies RouteConfig;
