import type { Certificate } from "~/orpc/certificate/contract";
import type { CertificateRow } from "~/orpc/certificate/repository";

/*===== Certificate =====*/
/** A stored certificate as the API shows it: no issuer id, no revocation reason (that is the Admin's). */
export function toCertificate({ certificate, course, dog }: CertificateRow): Certificate {
  return {
    id: certificate.id,
    number: certificate.number,
    enrollmentId: certificate.enrollmentId,
    course,
    dog,
    issuedAt: certificate.issuedAt,
    revokedAt: certificate.revokedAt,
  };
}
