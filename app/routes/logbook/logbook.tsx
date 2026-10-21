import { redirect } from "react-router";

import { normalizeFileNumber } from "~/lib/dog-file";
import { createServerClient } from "~/orpc/server-client.server";
import { LookupHero } from "~/routes/logbook/components/lookup-hero";
import { PrivateRecord } from "~/routes/logbook/components/private-record";
import { PublicRecord } from "~/routes/logbook/components/public-record";
import { WhoSees } from "~/routes/logbook/components/who-sees";
import type { PublicLayoutHandle } from "~/routes/layout_public/layout-public";

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

/*===== Handle =====*/
// The lookup and the private state end on the brick band, which runs into the footer, so the shell drops its bottom
// padding; the public record, which has no band, carries its own.
export const handle: PublicLayoutHandle = { flushFooter: true };

/*===== Loader =====*/
/**
 * `/logbook` asks for a file number; `/logbook/:fileNumber` is what a dog's QR code opens.
 *
 * A signed-in owner who scans their own dog's code (or the Admin, any dog's) is sent on to their own page for the dog.
 * Everyone else, signed in or not, gets one answer, whatever the number: the record is private, and nothing says whether
 * the number exists (docs/app-spec.md, F14), **unless the dog's owner made the record public** (which needs approved
 * consent wording, so for now it never is): then the page shows what the API says a public record may show. The lookup
 * behind the redirect runs only for a signed-in person, and it answers with a path or with nothing.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  if (params.fileNumber === undefined) return { mode: "lookup" as const };

  const fileNumber = normalizeFileNumber(params.fileNumber);
  const client = createServerClient(request);
  const session = await client.session.get();

  if (fileNumber && session.status === "active") {
    const located = await client.logbook.locate({ fileNumber }).catch(() => null);
    if (located) throw redirect(located.path);
  }

  if (fileNumber) {
    const answer = await client.logbook.record({ fileNumber });
    if (answer.kind === "public") return { mode: "public" as const, record: answer.record };
  }

  // The sign-in page returns here, so an owner who wasn't signed in can reach their dog's page from the code.
  const signInPath =
    session.status !== "anonymous" ? null : `/auth?redirectTo=${encodeURIComponent(`/logbook/${fileNumber ?? ""}`)}`;
  return { mode: "private" as const, signInPath: fileNumber ? signInPath : null };
}

/*===== Page =====*/
export default function LogbookPage({ loaderData }: Route.ComponentProps) {
  if (loaderData.mode === "public") return <PublicRecord record={loaderData.record} />;

  return (
    <>
      {loaderData.mode === "lookup" ? <LookupHero /> : <PrivateRecord signInPath={loaderData.signInPath} />}
      <WhoSees />
    </>
  );
}
