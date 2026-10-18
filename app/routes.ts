import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  /*===== Storefront =====*/
  layout("routes/layout_public/layout-public.tsx", [
    index("routes/home/home.tsx"),
    route("courses", "routes/course_catalogue/course-catalogue.tsx"),
    route("courses/:slug", "routes/course_detail/course-detail.tsx"),
    route("assessment", "routes/assessment/assessment.tsx"),
    route("help", "routes/help/help.tsx"),
    route("about", "routes/about/about.tsx"),
    route("contact", "routes/contact/contact.tsx"),
    route("privacy", "routes/privacy/privacy.tsx"),
    // A 404 until the owner approves the rules' wording (`app/lib/site-rules.ts`).
    route("rules", "routes/rules/rules.tsx"),
    // A dog's record: the lookup, and what its QR code opens (private unless its owner says otherwise).
    route("logbook/:fileNumber?", "routes/logbook/logbook.tsx"),
    route("join/partner", "routes/join_partner/join-partner.tsx"),
  ]),

  /*===== Account (customers and partners) =====*/
  route("account", "routes/layout_account/layout-account.tsx", [
    index("routes/account_home/account-home.tsx"),
    route("cart", "routes/account_cart/account-cart.tsx"),
    route("purchases", "routes/account_purchases/account-purchases.tsx"),
    route("profile", "routes/account_profile/account-profile.tsx"),
    route("dogs/:dogId", "routes/account_dog_detail/account-dog-detail.tsx"),
    // One form module for adding and editing, so each route needs its own id.
    route("dogs/new", "routes/account_dog_form/account-dog-form.tsx", { id: "account-dog-new" }),
    route("dogs/:dogId/edit", "routes/account_dog_form/account-dog-form.tsx", { id: "account-dog-edit" }),
    // The partner's pages (F7), under the same shell; their loaders guard to partners only.
    route("partner", "routes/account_partner/account-partner.tsx"),
    route("partner/leads", "routes/account_partner_leads/account-partner-leads.tsx"),
  ]),

  /*===== Admin =====*/
  route("admin", "routes/layout_admin/layout-admin.tsx", [
    // The Admin Dashboard (F11).
    index("routes/admin_index/admin-index.tsx"),
    route("evaluations", "routes/admin_evaluations/admin-evaluations.tsx"),
    route("enrollments", "routes/admin_enrollments/admin-enrollments.tsx"),
    route("payments", "routes/admin_payments/admin-payments.tsx"),
    route("dogs", "routes/admin_dogs/admin-dogs.tsx"),
    route("dogs/:dogId", "routes/admin_dog_detail/admin-dog-detail.tsx"),
    route("partners", "routes/admin_partners/admin-partners.tsx"),
    route("users", "routes/admin_users/admin-users.tsx"),
    route("courses", "routes/admin_courses/admin-courses.tsx"),
    // One form module for adding and editing, so each route needs its own id.
    route("courses/new", "routes/admin_course_form/admin-course-form.tsx", { id: "admin-course-new" }),
    route("courses/:slug/edit", "routes/admin_course_form/admin-course-form.tsx", { id: "admin-course-edit" }),
    route("settings", "routes/admin_settings/admin-settings.tsx"),
    route("sms", "routes/admin_sms/admin-sms.tsx"),
  ]),

  route("auth", "routes/auth/auth.tsx"),

  /*===== Resource Routes =====*/
  route("api/auth/*", "routes/api_auth/api-auth.ts"),
  route("rpc/*", "routes/rpc/rpc.ts"),
  route("api/evaluation-videos", "routes/api_evaluation_videos/api-evaluation-videos.ts"),
  route("api/evaluation-videos/:id", "routes/api_evaluation_video/api-evaluation-video.ts"),
  route("payment/callback", "routes/payment_callback/payment-callback.ts"),
] satisfies RouteConfig;
