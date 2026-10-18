import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { certificatePath } from "~/lib/certificate";
import type { Certificate } from "~/orpc/certificate/contract";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { IssueCertificateDialog } from "~/routes/admin_dog_detail/components/issue-certificate-dialog";
import { RevokeCertificateDialog } from "~/routes/admin_dog_detail/components/revoke-certificate-dialog";

/*===== Certificates Section =====*/
/**
 * A row per **completed** enrollment (a certificate is for a finished course), saying whether a certificate has been
 * issued: «صدور گواهی» if not; if so its number (a link to its public check), its state, and «باطل کردن» while it is
 * valid. Issuing and revoking each ask first (F14).
 */
export function CertificatesSection({
  enrollments,
  certificates,
}: {
  enrollments: AdminEnrollment[];
  certificates: Certificate[];
}) {
  const completed = enrollments.filter((enrollment) => enrollment.status === "completed");
  const [issuing, setIssuing] = useState<AdminEnrollment | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [revoking, setRevoking] = useState<Certificate | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <DetailSection id="certificates" title="گواهی‌ها">
      {completed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-pretty text-muted-foreground">
          هنوز دوره‌ی تمام‌شده‌ای ندارد؛ بعد از «تمام شد» می‌شود گواهی صادر کرد.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
          {completed.map((enrollment) => {
            const certificate = certificates.find((entry) => entry.enrollmentId === enrollment.id);
            return (
              <li
                key={enrollment.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-pretty">{enrollment.course.title}</p>
                  {enrollment.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      تمام شد · {formatJalaliTimestamp(enrollment.completedAt)}
                    </p>
                  )}
                </div>

                {certificate ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <a
                      href={certificatePath(certificate.number)}
                      target="_blank"
                      rel="noreferrer"
                      dir="ltr"
                      className="font-mono text-sm font-bold tracking-wider text-primary underline-offset-4 hover:underline"
                    >
                      {certificate.number}
                    </a>
                    {certificate.revokedAt ? (
                      <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
                        باطل شده · {formatJalaliTimestamp(certificate.revokedAt)}
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full border border-primary/50 px-3 py-1 text-xs font-bold text-primary">
                          معتبر
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRevoking(certificate);
                            setRevokeOpen(true);
                          }}
                        >
                          باطل کردن
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setIssuing(enrollment);
                      setIssueOpen(true);
                    }}
                  >
                    صدور گواهی
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <IssueCertificateDialog enrollment={issuing} open={issueOpen} onOpenChange={setIssueOpen} />
      <RevokeCertificateDialog certificate={revoking} open={revokeOpen} onOpenChange={setRevokeOpen} />
    </DetailSection>
  );
}
