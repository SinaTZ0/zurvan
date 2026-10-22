import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { normalizeFileNumber } from "~/lib/dog-file";
import { orpc } from "~/orpc/client";
import { LookupHero } from "~/routes/logbook/components/lookup-hero";
import { PrivateRecord } from "~/routes/logbook/components/private-record";
import { PublicRecord } from "~/routes/logbook/components/public-record";
import { WhoSees } from "~/routes/logbook/components/who-sees";

/*===== Route =====*/
/**
 * `/logbook` asks for a file number; `/logbook/:fileNumber` is what a dog's QR code opens.
 *
 * A signed-in owner who scans their own dog's code (or the Admin, any dog's) is sent on to their own page for the dog.
 * Everyone else, signed in or not, gets one answer, whatever the number: the record is private, and nothing says whether
 * the number exists (docs/app-spec.md, F14), **unless the dog's owner made the record public** (which needs approved
 * consent wording, so for now it never is): then the page shows what the API says a public record may show. The lookup
 * behind the redirect runs only for a signed-in person, and it answers with a path or with nothing.
 */
export const Route = createFileRoute("/_public/logbook/{-$fileNumber}")({
  loader: async ({ context: { queryClient }, params }) => {
    if (params.fileNumber === undefined) return;

    const fileNumber = normalizeFileNumber(params.fileNumber);
    const session = await queryClient.ensureQueryData(orpc.session.get.queryOptions());

    if (fileNumber && session.status === "active") {
      const located = await queryClient
        .ensureQueryData(orpc.logbook.locate.queryOptions({ input: { fileNumber } }))
        .catch(() => null);
      // A path the API built (the owner's or the Admin's page for the dog).
      if (located) throw redirect({ href: located.path });
    }

    if (fileNumber) await queryClient.ensureQueryData(orpc.logbook.record.queryOptions({ input: { fileNumber } }));
  },
  // Never in a search engine: a dog's record is for the people the owner chose.
  head: () => ({ meta: [{ title: "پرونده‌ی سگ | زروان" }, { name: "robots", content: "noindex" }] }),
  // What this page shows depends on who asks, so no cache (a browser's, a proxy's) may keep one person's answer for
  // another.
  headers: () => ({ "Cache-Control": "no-store" }),
  // The lookup and the private state end on the brick band, which runs into the footer, so the shell drops its bottom
  // padding; the public record, which has no band, carries its own.
  staticData: { flushFooter: true },
  component: LogbookPage,
});

/*===== Page =====*/
function LogbookPage() {
  const { fileNumber: param } = Route.useParams();

  if (param === undefined) {
    return (
      <>
        <LookupHero />
        <WhoSees />
      </>
    );
  }

  // A number that isn't one gets the private answer, the same as any other.
  const fileNumber = normalizeFileNumber(param);
  return fileNumber ? <RecordAnswer fileNumber={fileNumber} /> : <Private fileNumber={null} />;
}

/*===== Record =====*/
/** The record behind a well-formed number: public if its owner made it so, private otherwise. */
function RecordAnswer({ fileNumber }: { fileNumber: string }) {
  const { data: answer } = useSuspenseQuery(orpc.logbook.record.queryOptions({ input: { fileNumber } }));
  if (answer.kind === "public") return <PublicRecord record={answer.record} />;
  return <Private fileNumber={fileNumber} />;
}

/**
 * The private answer. A visitor gets a sign-in link that returns here, so an owner who wasn't signed in can reach their
 * dog's page from the code.
 */
function Private({ fileNumber }: { fileNumber: string | null }) {
  const { data: session } = useSuspenseQuery(orpc.session.get.queryOptions());
  const signInRedirectTo = fileNumber && session.status === "anonymous" ? `/logbook/${fileNumber}` : null;

  return (
    <>
      <PrivateRecord signInRedirectTo={signInRedirectTo} />
      <WhoSees />
    </>
  );
}
