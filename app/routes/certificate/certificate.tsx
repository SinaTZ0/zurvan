import { BadgeCheckIcon, BanIcon, SearchXIcon } from "lucide-react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { createServerClient } from "~/orpc/server-client.server";

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
 */
export default function CertificatePage({ loaderData }: Route.ComponentProps) {
  const { verification } = loaderData;

  return (
    <section aria-labelledby="certificate-title" className="site-container pt-section-sm pb-section-md">
      <div className="max-w-xl">
        {verification.kind === "valid" && (
          <>
            <BadgeCheckIcon aria-hidden strokeWidth={1.5} className="size-10 text-primary" />
            <h1 id="certificate-title" className="mt-4 font-display text-h1 font-black text-balance">
              این گواهی معتبر است
            </h1>
            <dl className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6">
              <div>
                <dt className="text-sm text-muted-foreground">دوره</dt>
                <dd className="mt-1 font-bold text-pretty">{verification.course.title}</dd>
                <dd dir="ltr" className="mt-0.5 text-start text-sm text-muted-foreground">
                  {verification.course.latinName}
                </dd>
              </div>
              {verification.dogName && (
                <div>
                  <dt className="text-sm text-muted-foreground">سگ</dt>
                  <dd className="mt-1 font-bold">{verification.dogName}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted-foreground">تاریخ صدور</dt>
                <dd className="mt-1 font-bold">{formatJalaliTimestamp(verification.issuedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">صادرشده توسط</dt>
                <dd className="mt-1 font-bold">{HEAD_TRAINER.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">شماره‌ی گواهی</dt>
                <dd dir="ltr" className="mt-1 text-start font-mono font-bold tracking-wider">
                  {verification.number}
                </dd>
              </div>
            </dl>
          </>
        )}

        {verification.kind === "revoked" && (
          <>
            <BanIcon aria-hidden strokeWidth={1.5} className="size-10 text-destructive" />
            <h1 id="certificate-title" className="mt-4 font-display text-h1 font-black text-balance">
              این گواهی باطل شده
            </h1>
            <p className="mt-4 text-lead text-pretty text-muted-foreground">
              گواهی شماره‌ی <bdi dir="ltr">{verification.number}</bdi> در{" "}
              {formatJalaliTimestamp(verification.revokedAt)} باطل شد و دیگر اعتبار ندارد.
            </p>
          </>
        )}

        {verification.kind === "unknown" && (
          <>
            <SearchXIcon aria-hidden strokeWidth={1.5} className="size-10 text-muted-foreground" />
            <h1 id="certificate-title" className="mt-4 font-display text-h1 font-black text-balance">
              گواهی‌ای با این شماره پیدا نشد
            </h1>
            <p className="mt-4 text-lead text-pretty text-muted-foreground">
              شماره را دوباره از روی گواهی بخوان. اگه باز پیدا نشد، با {HEAD_TRAINER.firstName} تماس بگیر.
            </p>
          </>
        )}

        <Link to="/contact" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-8" })}>
          تماس با ما
        </Link>
      </div>
    </section>
  );
}
