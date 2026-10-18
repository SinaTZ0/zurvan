import { redirect } from "react-router";

import { authForHeaders } from "~/lib/auth.server";
import { normalizeFileNumber } from "~/lib/dog-file";
import { createServerClient } from "~/orpc/server-client.server";
import { LookupForm } from "~/routes/logbook/components/lookup-form";
import { PrivateRecord } from "~/routes/logbook/components/private-record";

import type { Route } from "./+types/logbook";

/*===== Meta =====*/
// Never in a search engine: a dog's record is for the people the owner chose.
export const meta: Route.MetaFunction = () => [
  { title: "پرونده‌ی سگ | زروان" },
  { name: "robots", content: "noindex" },
];

/*===== Headers =====*/
// What this page shows depends on who asks, so no cache (a browser's, a proxy's) may keep one person's answer for another.
export const headers: Route.HeadersFunction = ({ parentHeaders }) => {
  const result = new Headers(parentHeaders);
  result.set("Cache-Control", "no-store");
  return result;
};

/*===== Loader =====*/
/**
 * `/logbook` asks for a file number; `/logbook/:fileNumber` is what a dog's QR code opens.
 *
 * A signed-in owner who scans their own dog's code (or the Admin, any dog's) is sent on to their own page for the dog.
 * Everyone else, signed in or not, gets one answer, whatever the number: the record is private, and nothing says whether
 * the number exists (docs/app-spec.md, F14). The lookup runs only for a signed-in person, and it answers with a path or
 * with nothing.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  if (params.fileNumber === undefined) return { mode: "lookup" as const, signInPath: null };

  const fileNumber = normalizeFileNumber(params.fileNumber);
  const session = await authForHeaders(request.headers).api.getSession({ headers: request.headers });
  const user = session?.user;

  if (fileNumber && user && user.status !== "blocked" && user.firstName) {
    const located = await createServerClient(request)
      .logbook.locate({ fileNumber })
      .catch(() => null);
    if (located) throw redirect(located.path);
  }

  // The sign-in page returns here, so an owner who wasn't signed in can reach their dog's page from the code.
  const signInPath = user ? null : `/auth?redirectTo=${encodeURIComponent(`/logbook/${fileNumber ?? ""}`)}`;
  return { mode: "private" as const, signInPath: fileNumber ? signInPath : null };
}

/*===== Page =====*/
export default function LogbookPage({ loaderData }: Route.ComponentProps) {
  return (
    <section aria-labelledby="logbook-title" className="site-container pt-section-sm pb-section-md">
      {loaderData.mode === "lookup" ? <LookupForm /> : <PrivateRecord signInPath={loaderData.signInPath} />}
    </section>
  );
}
