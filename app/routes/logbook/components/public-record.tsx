import type { PublicRecord as PublicRecordData } from "~/orpc/logbook/contract";
import { COLUMN } from "~/routes/logbook/column";
import { CertificateRows } from "~/routes/logbook/components/certificate-rows";
import { CourseMedals } from "~/routes/logbook/components/course-medals";
import { DiaryTimeline } from "~/routes/logbook/components/diary-timeline";
import { PublicHeader } from "~/routes/logbook/components/public-header";

/*===== Public Record =====*/
/**
 * A dog's record, made public by its owner (docs/app-spec.md, F14): the name, breed and age, the courses it finished, its
 * valid certificates, and the diary entries the trainer marked as showable. It is exactly what the API sent: nothing
 * about the owner, no photo, no private note ever reaches this page. Empty sections keep the old behaviour: the courses
 * say «هنوز دوره‌ای تموم نکرده.», the certificates and the diary hide.
 *
 * The page's last section carries its own bottom padding: the public record has no brick band to run into the footer.
 */
export function PublicRecord({ record }: { record: PublicRecordData }) {
  return (
    <>
      <PublicHeader record={record} />

      <div className={`${COLUMN} pb-section-md`}>
        <CourseMedals courses={record.courses} />
        {record.certificates.length > 0 && <CertificateRows certificates={record.certificates} />}
        {record.entries.length > 0 && <DiaryTimeline entries={record.entries} />}
      </div>

      <style>{`
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            .lb-card-2 { animation-range: entry 10% entry 80%; }
            .lb-card-3 { animation-range: entry 15% entry 85%; }
            .lb-draw {
              animation: lb-draw linear both;
              animation-timeline: view();
              animation-range: entry 20% cover 60%;
            }
          }
        }
        @keyframes lb-draw {
          from { clip-path: inset(0 0 100% 0); }
          to { clip-path: inset(0); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .lb-row { transition: transform .2s ease-out, border-color .2s; }
          .lb-row:hover, .lb-row:focus-visible { transform: translateY(-3px); border-color: rgb(255 194 26 / .5); }
        }
      `}</style>
    </>
  );
}
