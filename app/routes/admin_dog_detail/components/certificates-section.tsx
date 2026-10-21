import { cn } from "cn";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { certificatePath } from "~/lib/certificate";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Certificate } from "~/orpc/certificate/contract";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { IssueCertificateDialog } from "~/routes/admin_dog_detail/components/issue-certificate-dialog";
import { RevokeCertificateDialog } from "~/routes/admin_dog_detail/components/revoke-certificate-dialog";
import { useHasChanged } from "~/routes/admin_dog_detail/hooks/use-has-changed";
import { QUIET_LINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Certificates Section =====*/
/**
 * A row per **completed** enrollment (a certificate is for a finished course), saying whether a certificate has been
 * issued: «صدور گواهی» (gold, the row's one main button) if not; if so its number (a link to its public check), its
 * state, and «باطل کردن» while it is valid. Issuing and revoking each ask first (F14).
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
        <p className={QUIET_LINE}>هنوز دوره‌ی تمام‌شده‌ای نداره؛ بعد از «تمام شد» می‌شه گواهی صادر کرد.</p>
      ) : (
        <ul className={cn(ADMIN_PLATE, "divide-y px-4 sm:px-5", ADMIN_HAIRLINE)}>
          {completed.map((enrollment) => (
            <CertificateRow
              key={enrollment.id}
              enrollment={enrollment}
              certificate={certificates.find((entry) => entry.enrollmentId === enrollment.id) ?? null}
              onIssue={() => {
                setIssuing(enrollment);
                setIssueOpen(true);
              }}
              onRevoke={(certificate) => {
                setRevoking(certificate);
                setRevokeOpen(true);
              }}
            />
          ))}
        </ul>
      )}

      <IssueCertificateDialog enrollment={issuing} open={issueOpen} onOpenChange={setIssueOpen} />
      <RevokeCertificateDialog certificate={revoking} open={revokeOpen} onOpenChange={setRevokeOpen} />
    </DetailSection>
  );
}

/*===== Certificate Row =====*/
/**
 * One finished course and its certificate. The number is pressed onto the row when it is issued here (`dd-press`), and
 * the «باطل شده» chip is stamped when it is revoked here (`dd-stamp-late`); neither plays on load. A revoked number
 * stays readable but quiet: the certificate is still on record.
 */
function CertificateRow({
  enrollment,
  certificate,
  onIssue,
  onRevoke,
}: {
  enrollment: AdminEnrollment;
  certificate: Certificate | null;
  onIssue: () => void;
  onRevoke: (certificate: Certificate) => void;
}) {
  const issuedHere = useHasChanged(certificate?.id ?? null);
  const revokedHere = useHasChanged(certificate?.revokedAt?.getTime() ?? null);

  return (
    <li className="flex flex-col gap-2.5 py-3.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      {/*------ Course ------*/}
      <div className="min-w-0">
        <p className="text-sm font-bold text-pretty">{enrollment.course.title}</p>
        {enrollment.completedAt && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            تمام شد {formatJalaliTimestamp(enrollment.completedAt)}
          </p>
        )}
      </div>

      {/*------ Certificate ------*/}
      {certificate ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
          <a
            key={certificate.id}
            href={certificatePath(certificate.number)}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            aria-label={`گواهی ${certificate.number}، صفحه‌ی بررسی‌اش`}
            className={cn(
              "inline-flex h-10 items-center rounded-sm text-sm font-bold tracking-wider tabular-nums underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              certificate.revokedAt
                ? "text-muted-foreground line-through decoration-muted-foreground/60"
                : "text-foreground",
              issuedHere && "dd-press",
            )}
          >
            {certificate.number}
          </a>

          {certificate.revokedAt ? (
            <span
              key={certificate.revokedAt.getTime()}
              className={cn(
                "inline-flex h-6 items-center rounded-full border border-destructive/40 bg-destructive/10 px-2.5 text-xs font-bold whitespace-nowrap text-destructive",
                revokedHere && "dd-stamp-late",
              )}
            >
              باطل شده {formatJalaliTimestamp(certificate.revokedAt)}
            </span>
          ) : (
            <>
              <span className="inline-flex h-6 items-center rounded-full border border-success/40 bg-success/10 px-2.5 text-xs font-bold text-success">
                معتبر
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRevoke(certificate)}
              >
                باطل کردن
              </Button>
            </>
          )}
        </div>
      ) : (
        <Button type="button" variant="solid" size="sm" className="w-full px-4 max-sm:h-11 sm:w-fit" onClick={onIssue}>
          صدور گواهی
        </Button>
      )}
    </li>
  );
}
