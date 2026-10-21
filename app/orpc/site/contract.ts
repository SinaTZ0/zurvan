import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";

/*===== Schemas =====*/
export const siteConfigSchema = z.object({
  /** The site's public origin (no trailing slash), for links people copy or share, e.g. a partner's `/?ref=` link. */
  origin: z.string(),
  /** Showcase mode: no SMS goes out and one fixed code signs anyone in (`SHOWCASE_SIGN_IN_CODE`). */
  showcase: z.boolean(),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

/*===== Procedures =====*/
/** Public: nothing secret, only what pages need from the server's environment. */
export const siteConfigContract = oc.errors(commonErrors).output(siteConfigSchema);

export const siteContract = {
  config: siteConfigContract,
};
