import type { Certificate } from "~/orpc/certificate/contract";
import type { CertificateRow } from "~/orpc/certificate/repository";
import { courseTitle } from "~/orpc/course/mapper";
import type { Locale } from "~/paraglide/runtime";

/*===== Certificate =====*/
/**
 * A stored certificate as the API shows it: no issuer id, no revocation reason (that is the Admin's). The course's name
 * is in `locale` (Persian where the English isn't written); the Admin's lists stay Persian.
 */
export function toCertificate(
  { certificate, course, dog }: CertificateRow,
  { locale = "fa" }: { locale?: Locale } = {},
): Certificate {
  return {
    id: certificate.id,
    number: certificate.number,
    enrollmentId: certificate.enrollmentId,
    course: { slug: course.slug, title: courseTitle({ locale, course }), latinName: course.latinName },
    dog,
    issuedAt: certificate.issuedAt,
    revokedAt: certificate.revokedAt,
  };
}
