import { redirect } from "react-router";

import { auth } from "~/lib/auth.server";

import type { Route } from "./+types/home";

/*===== Entry Redirect =====*/
// The app has no landing page yet: signed-in users go to their pets, everyone else to sign-in.
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  throw redirect(session ? "/pets" : "/auth");
}
