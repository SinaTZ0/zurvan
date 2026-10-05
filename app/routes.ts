import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth/auth.tsx"),
  route("pets", "routes/pets/pets.tsx"),

  /*===== Resource Routes =====*/
  route("api/auth/*", "routes/api_auth/api-auth.ts"),
  route("rpc/*", "routes/rpc/rpc.ts"),
] satisfies RouteConfig;
