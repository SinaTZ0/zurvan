import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  /*===== Storefront =====*/
  layout("routes/layout_public/layout-public.tsx", [
    index("routes/home/home.tsx"),
    route("courses", "routes/course_catalogue/course-catalogue.tsx"),
    route("courses/:slug", "routes/course_detail/course-detail.tsx"),
    route("assessment", "routes/assessment/assessment.tsx"),
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
  ]),

  route("auth", "routes/auth/auth.tsx"),

  /*===== Resource Routes =====*/
  route("api/auth/*", "routes/api_auth/api-auth.ts"),
  route("rpc/*", "routes/rpc/rpc.ts"),
  route("api/evaluation-videos", "routes/api_evaluation_videos/api-evaluation-videos.ts"),
  route("api/evaluation-videos/:id", "routes/api_evaluation_video/api-evaluation-video.ts"),
  route("payment/callback", "routes/payment_callback/payment-callback.ts"),
] satisfies RouteConfig;
