import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  /*===== Storefront =====*/
  layout("routes/layout_public/layout-public.tsx", [
    index("routes/home/home.tsx"),
    route("courses/:slug", "routes/course_detail/course-detail.tsx"),
  ]),

  /*===== Account (customers, trainers, partners) =====*/
  route("account", "routes/layout_account/layout-account.tsx", [
    index("routes/account_home/account-home.tsx"),
    route("dogs", "routes/account_dogs/account-dogs.tsx"),
    route("dogs/:dogId", "routes/account_dog_detail/account-dog-detail.tsx"),
    // One form module for adding and editing, so each route needs its own id.
    route("dogs/new", "routes/account_dog_form/account-dog-form.tsx", { id: "account-dog-new" }),
    route("dogs/:dogId/edit", "routes/account_dog_form/account-dog-form.tsx", { id: "account-dog-edit" }),
  ]),

  route("auth", "routes/auth/auth.tsx"),

  /*===== Resource Routes =====*/
  route("api/auth/*", "routes/api_auth/api-auth.ts"),
  route("rpc/*", "routes/rpc/rpc.ts"),
] satisfies RouteConfig;
