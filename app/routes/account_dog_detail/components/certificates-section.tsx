import { CertificateCard } from "~/components/certificate-card";
import type { Qr } from "~/lib/qr.server";
import type { Certificate } from "~/orpc/certificate/contract";

/*===== Certificates Section =====*/
/**
 * F14 on the dog's page: the certificates the head trainer issued for courses the dog finished, each with the link and QR
 * code that let anyone check it. Nothing is shown when there are none: a finished course does not promise one.
 */
export function CertificatesSection({
  certificates,
}: {
  certificates: { certificate: Certificate; link: string; qr: Qr }[];
}) {
  if (certificates.length === 0) return null;

  return (
    <section aria-labelledby="certificates-title">
      <h2 id="certificates-title" className="font-sans text-xl font-extrabold">
        گواهی‌ها
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {certificates.map((entry) => (
          <CertificateCard key={entry.certificate.id} {...entry} />
        ))}
      </ul>
    </section>
  );
}
