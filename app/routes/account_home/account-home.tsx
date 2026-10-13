import { RebuildNotice } from "~/components/rebuild-notice";

/*===== Account Placeholder =====*/
// One module for `/account`, `/account/dogs` and `/account/dogs/:dogId` (see `routes.ts`). The customer Dashboard and
// Dog Detail are rebuilt for the evaluation-and-enrollment model (docs/legacy-pages.md, "Rebuild"); until then these
// URLs, which the dog form and the sign-in redirect still use, show a notice.
export default function AccountPlaceholder() {
  return <RebuildNotice title="سگ‌های من" />;
}
