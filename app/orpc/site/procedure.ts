import { env } from "~/env.server";
import { base } from "~/orpc/implementer.server";

/*===== Public =====*/
export const siteConfigProcedure = base.site.config.handler(() => ({
  origin: new URL(env.BETTER_AUTH_URL).origin,
  showcase: env.SHOWCASE_MODE,
}));
