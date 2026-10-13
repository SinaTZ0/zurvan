import { redirect } from "react-router";

import { ADMIN_EVALUATIONS_PATH } from "~/routes/layout_admin/admin-nav";

/*===== Loader =====*/
// The Admin Dashboard (docs/app-spec.md, F11) needs API that doesn't exist yet. Until it does, `/admin` opens the page
// he answers first. The layout's guard has already run by the time this does.
export function loader() {
  return redirect(ADMIN_EVALUATIONS_PATH);
}
