import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "~/orpc/client";
import { CertificateAsk } from "~/routes/certificate/components/certificate-ask";
import { CertificateHero } from "~/routes/certificate/components/certificate-hero";

/*===== Route =====*/
// Public. The API answers valid, revoked or unknown for any text, so there is nothing to refuse here.
export const Route = createFileRoute("/_public/certificate/$number")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(orpc.certificate.verify.queryOptions({ input: { number: params.number } })),
  head: () => ({ meta: [{ title: "بررسی گواهی | زروان" }, { name: "robots", content: "noindex" }] }),
  // A certificate can be revoked, so a cached «valid» would be a lie: no cache keeps this answer.
  headers: () => ({ "Cache-Control": "no-store" }),
  component: CertificatePage,
});

/*===== Page =====*/
/**
 * What a stranger who scans a certificate's QR code sees: whether it is valid, and for which course and day. Nothing about
 * the dog's owner, and the dog's name only if its owner made the record public (F14; no record can be yet).
 *
 * The verdict comes first (its scene, h1 and what the answer shows), then one closing card for a question. The hero is
 * keyed by the number in the address: the unknown state's retry form navigates to another number, and the new answer
 * mounts afresh so its words rise in and its scene plays again.
 */
function CertificatePage() {
  const { number } = Route.useParams();
  const { data: verification } = useSuspenseQuery(orpc.certificate.verify.queryOptions({ input: { number } }));

  return (
    <>
      <CertificateHero key={number} verification={verification} />
      <div className="site-container pt-section-sm pb-4 lg:pb-6">
        <CertificateAsk />
      </div>
    </>
  );
}
