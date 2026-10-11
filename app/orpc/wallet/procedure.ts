import { base } from "~/orpc/implementer.server";
import { requireRoleMiddleware } from "~/orpc/middleware/auth/auth.middleware";
import { provideDbMiddleware } from "~/orpc/middleware/db/db.middleware";
import { getMyWallet } from "~/orpc/wallet/service";

/*===== Mine =====*/
// Customers, trainers and partners have wallets. The Admin's money is in the Admin system wallet, which the Admin
// panel shows.
export const myWalletProcedure = base.wallet.mine
  .use(requireRoleMiddleware("customer", "trainer", "partner"))
  .use(provideDbMiddleware)
  .handler(({ context }) => getMyWallet({ db: context.db, userId: context.user.id }));
