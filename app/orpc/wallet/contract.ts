import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";
import { TRANSACTION_TYPES } from "~/orpc/wallet/constants";

/*===== Schemas =====*/
/** One of the user's own lines (spec 3.12, "What users see"): never the other lines of the transaction. */
export const walletLineSchema = z.object({
  id: z.string(),
  /** Rial, signed: positive came in, negative went out. */
  amount: z.number().int(),
  transactionNumber: z.string(),
  type: z.enum(TRANSACTION_TYPES),
  description: z.string(),
  createdAt: z.date(),
});

export const myWalletSchema = z.object({
  /** Rial. Can be negative, e.g. a trainer whose share was mirrored back after a payout. */
  balance: z.number().int(),
  /** Newest first, the latest ones only. */
  lines: z.array(walletLineSchema),
});

export type MyWallet = z.infer<typeof myWalletSchema>;

/*===== Procedures =====*/
export const myWalletContract = oc.errors({ ...commonErrors, ...authErrors, ...roleErrors }).output(myWalletSchema);

export const walletContract = {
  mine: myWalletContract,
};
