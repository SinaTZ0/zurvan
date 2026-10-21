import { useParams } from "react-router";

import { createServerClient } from "~/orpc/server-client.server";
import { CertificateAsk } from "~/routes/certificate/components/certificate-ask";
import { CertificateHero } from "~/routes/certificate/components/certificate-hero";

import type { Route } from "./+types/certificate";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "بررسی گواهی | زروان" },
  { name: "robots", content: "noindex" },
];

/*===== Headers =====*/
// A certificate can be revoked, so a cached «valid» would be a lie: no cache keeps this answer.
export const headers: Route.HeadersFunction = ({ parentHeaders }) => {
  const result = new Headers(parentHeaders);
  result.set("Cache-Control", "no-store");
  return result;
};

/*===== Loader =====*/
/** Public. The API answers valid, revoked or unknown for any text, so there is nothing to refuse here. */
export async function loader({ request, params }: Route.LoaderArgs) {
  return { verification: await createServerClient(request).certificate.verify({ number: params.number }) };
}

/*===== Page =====*/
/**
 * What a stranger who scans a certificate's QR code sees: whether it is valid, and for which course and day. Nothing about
 * the dog's owner, and the dog's name only if its owner made the record public (F14; no record can be yet).
 *
 * The verdict comes first (its scene, h1 and what the answer shows), then one closing card for a question. The hero is
 * keyed by the number in the address: the unknown state's retry form navigates to another number, and the new answer
 * mounts afresh so its words rise in and its scene plays again.
 */
export default function CertificatePage({ loaderData }: Route.ComponentProps) {
  const { number } = useParams();

  return (
    <>
      <CertificateHero key={number} verification={loaderData.verification} />
      <div className="site-container pt-section-sm pb-4 lg:pb-6">
        <CertificateAsk />
      </div>
    </>
  );
}
