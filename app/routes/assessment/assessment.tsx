import { RebuildNotice } from "~/components/rebuild-notice";

/*===== Evaluation Request Placeholder =====*/
// The free evaluation request (F3) replaces the old slot booking here (docs/legacy-pages.md, "Rebuild"). Every
// «ارزیابی رایگان» button on the storefront links to this URL, so it stays until the page is rebuilt.
export default function EvaluationRequestPlaceholder() {
  return <RebuildNotice title="ارزیابی رایگان" />;
}
