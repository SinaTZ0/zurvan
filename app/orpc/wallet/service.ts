import type { DatabaseOrTransaction } from "~/db/client.server";
import { formatRecordNumber } from "~/lib/record-number";
import type { SystemWalletKind, TransactionType } from "~/orpc/wallet/constants";
import {
  addToBalance,
  ensureSystemWallet,
  ensureUserWallet,
  findTransactionWithLines,
  insertLines,
  insertTransaction,
  lockWallets,
  nextTransactionSequence,
  type TransactionRecord,
} from "~/orpc/wallet/repository";

/*===== Money Core =====*/
// Every movement of money in the app goes through `createTransaction` (docs/foundations-plan.md, step 2): payments,
// purchases, refunds, withdrawals and the Admin's manual transactions. It is the one place that checks a transaction's
// lines and keeps the cached balances in step with them. The database checks the sum again at commit
// (`app/db/money-constraints.sql`).

/** One line of a new transaction: a wallet and a signed amount in Rial (negative sends, positive receives). */
export type NewLine = { walletId: string; amount: number };

/** What a transaction is for, beyond its lines. The links follow the type (entity 18). */
export type NewTransaction = {
  type: TransactionType;
  /** Shown to everyone with a line in it, e.g. «خرید دوره‌ی سگ همدم ۱ برای لئو». */
  description: string;
  lines: NewLine[];
  /** The Admin, for a manual transaction. Null for the system's own. */
  createdById?: string | null;
  mirrorOfId?: string | null;
  orderItemId?: string | null;
  paymentId?: string | null;
};

/**
 * Thrown for lines that break the rules of a transaction. It is a bug in the caller, never a user's mistake: forms that
 * build lines (the Admin's transaction form) check them first and show their own messages.
 */
export class InvalidTransactionError extends Error {
  override name = "InvalidTransactionError";
}

/*------ Line Rules ------*/
/**
 * Checks the rules every transaction obeys (spec 3.12): at least two lines, whole non-zero Rial, each wallet at most
 * once, and a sum of 0.
 *
 * @throws InvalidTransactionError naming the first rule broken.
 */
export function assertValidLines(lines: NewLine[]): void {
  if (lines.length < 2) throw new InvalidTransactionError("A transaction needs at least two lines.");

  const wallets = new Set<string>();
  let sum = 0;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.amount) || line.amount === 0) {
      throw new InvalidTransactionError(`Line amounts are non-zero whole Rial, got ${line.amount}.`);
    }
    if (wallets.has(line.walletId)) {
      throw new InvalidTransactionError(`Wallet ${line.walletId} appears twice in one transaction.`);
    }
    wallets.add(line.walletId);
    sum += line.amount;
  }
  if (sum !== 0) throw new InvalidTransactionError(`Transaction lines add up to ${sum}, not 0.`);
}

/**
 * Merges lines that name the same wallet and drops the ones that come to 0, so a split can be written role by role
 * (customer, trainer, Admin, partner) even when two roles share a wallet, as the head trainer and the Admin do (B8).
 */
export function mergeLines(lines: NewLine[]): NewLine[] {
  const byWallet = new Map<string, number>();
  for (const line of lines) byWallet.set(line.walletId, (byWallet.get(line.walletId) ?? 0) + line.amount);
  return [...byWallet].filter(([, amount]) => amount !== 0).map(([walletId, amount]) => ({ walletId, amount }));
}

/** Flips the sign of every line: the exact mirror of a transaction. */
export function mirrorLines(lines: NewLine[]): NewLine[] {
  return lines.map((line) => ({ walletId: line.walletId, amount: -line.amount }));
}

/*------ Create ------*/
/**
 * Writes one transaction: checks its lines, numbers it, inserts it with its lines and moves the cached balances, all in
 * one database transaction (a savepoint when the caller is already inside one, so it commits or rolls back with the
 * caller's work).
 *
 * @throws InvalidTransactionError for lines that break the rules (see `assertValidLines`).
 */
export async function createTransaction({
  db,
  transaction: input,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  transaction: NewTransaction;
  now?: Date;
}): Promise<TransactionRecord> {
  assertValidLines(input.lines);

  return db.transaction(async (tx) => {
    // Locking first, in id order, keeps two transactions over the same wallets from deadlocking on the balance updates.
    const walletIds = input.lines.map((line) => line.walletId);
    const locked = await lockWallets({ db: tx, ids: walletIds });
    if (locked.length !== walletIds.length)
      throw new InvalidTransactionError("A line names a wallet that doesn't exist.");

    const sequence = await nextTransactionSequence({ db: tx });
    const record = await insertTransaction({
      db: tx,
      values: {
        number: formatRecordNumber({ prefix: "TX", sequence, at: now }),
        type: input.type,
        sum: input.lines.reduce((total, line) => total + Math.max(line.amount, 0), 0),
        description: input.description,
        createdById: input.createdById ?? null,
        mirrorOfId: input.mirrorOfId ?? null,
        orderItemId: input.orderItemId ?? null,
        paymentId: input.paymentId ?? null,
        createdAt: now,
      },
    });
    await insertLines({ db: tx, transactionId: record.id, lines: input.lines });

    // In the same order as the locks.
    const byWallet = [...input.lines].sort((a, b) => (a.walletId < b.walletId ? -1 : 1));
    for (const line of byWallet) await addToBalance({ db: tx, walletId: line.walletId, amount: line.amount });

    return record;
  });
}

/**
 * Mirrors a transaction: a new one with every line's sign flipped, pointing back at it (spec 3.12, "Mirror"). The
 * caller decides the type: a refund for a purchase, a withdrawal release for a hold, or a manual one.
 *
 * @throws Error when the transaction doesn't exist.
 */
export async function createMirrorTransaction({
  db,
  mirrorOfId,
  type,
  description,
  createdById = null,
  now = new Date(),
}: {
  db: DatabaseOrTransaction;
  mirrorOfId: string;
  type: TransactionType;
  description: string;
  createdById?: string | null;
  now?: Date;
}): Promise<TransactionRecord> {
  const original = await findTransactionWithLines({ db, id: mirrorOfId });
  if (!original) throw new Error(`createMirrorTransaction: transaction ${mirrorOfId} doesn't exist`);

  return createTransaction({
    db,
    now,
    transaction: {
      type,
      description,
      lines: mirrorLines(original.lines),
      createdById,
      mirrorOfId,
      orderItemId: original.transaction.orderItemId,
      paymentId: original.transaction.paymentId,
    },
  });
}

/*===== Wallets =====*/
/** The ids of the system wallets a money flow needs, made on first use. */
export async function systemWalletIds({
  db,
  kinds,
}: {
  db: DatabaseOrTransaction;
  kinds: SystemWalletKind[];
}): Promise<Record<SystemWalletKind, string>> {
  const ids = {} as Record<SystemWalletKind, string>;
  for (const kind of kinds) ids[kind] = (await ensureSystemWallet({ db, kind })).id;
  return ids;
}

/** The user's wallet id, made on first use. */
export async function userWalletId({ db, userId }: { db: DatabaseOrTransaction; userId: string }): Promise<string> {
  return (await ensureUserWallet({ db, userId })).id;
}
