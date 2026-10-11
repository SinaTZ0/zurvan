import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { wallet, walletTransaction, walletTransactionLine, walletTransactionNumberSeq } from "~/db/schema";
import type { SystemWalletKind, TransactionType } from "~/orpc/wallet/constants";

/*===== Types =====*/
export type WalletRecord = typeof wallet.$inferSelect;
export type TransactionRecord = typeof walletTransaction.$inferSelect;
export type TransactionLineRecord = typeof walletTransactionLine.$inferSelect;

export type TransactionWithLines = { transaction: TransactionRecord; lines: TransactionLineRecord[] };

/** One of a wallet's own lines with its transaction's public details: what a user sees of their history. */
export type WalletHistoryRow = {
  lineId: string;
  amount: number;
  transactionId: string;
  number: string;
  type: TransactionType;
  description: string;
  createdAt: Date;
};

type Executor = { db: DatabaseOrTransaction };

/*===== Wallets =====*/
// Wallets are made the first time they are needed, with an insert that does nothing when the row exists, so two
// requests racing to make the same wallet both end up with the one row.

/** The system wallet of this kind, made if it doesn't exist yet. */
export async function ensureSystemWallet({ db, kind }: Executor & { kind: SystemWalletKind }): Promise<WalletRecord> {
  await db.insert(wallet).values({ systemKind: kind }).onConflictDoNothing({ target: wallet.systemKind });
  const [row] = await db.select().from(wallet).where(eq(wallet.systemKind, kind));
  if (!row) throw new Error(`ensureSystemWallet: the ${kind} wallet could not be read back`);
  return row;
}

/** The user's wallet, made if it doesn't exist yet. */
export async function ensureUserWallet({ db, userId }: Executor & { userId: string }): Promise<WalletRecord> {
  await db.insert(wallet).values({ ownerUserId: userId }).onConflictDoNothing({ target: wallet.ownerUserId });
  const [row] = await db.select().from(wallet).where(eq(wallet.ownerUserId, userId));
  if (!row) throw new Error(`ensureUserWallet: the wallet of ${userId} could not be read back`);
  return row;
}

/** The user's wallet, or `undefined` before they have one (a balance of 0). */
export async function findUserWallet({ db, userId }: Executor & { userId: string }): Promise<WalletRecord | undefined> {
  const [row] = await db.select().from(wallet).where(eq(wallet.ownerUserId, userId));
  return row;
}

/**
 * Locks wallets for the rest of the database transaction and returns them. Rows are locked in id order, the same order
 * `createTransaction` updates balances in, so two transactions touching the same wallets can't deadlock.
 */
export function lockWallets({ db, ids }: Executor & { ids: string[] }): Promise<WalletRecord[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db.select().from(wallet).where(inArray(wallet.id, ids)).orderBy(asc(wallet.id)).for("update");
}

/** Moves a wallet's cached balance by a signed amount. */
export async function addToBalance({ db, walletId, amount }: Executor & { walletId: string; amount: number }) {
  await db
    .update(wallet)
    .set({ balance: sql`${wallet.balance} + ${amount}` })
    .where(eq(wallet.id, walletId));
}

/*===== Transactions =====*/
/** The next number of the transaction sequence. Numbers are never reused, even when the transaction rolls back. */
export async function nextTransactionSequence({ db }: Executor): Promise<number> {
  const result = await db.execute<{ value: string }>(
    sql`select nextval(${walletTransactionNumberSeq.seqName}) as value`,
  );
  return Number(result.rows[0]?.value);
}

export async function insertTransaction({
  db,
  values,
}: Executor & { values: typeof walletTransaction.$inferInsert }): Promise<TransactionRecord> {
  const [row] = await db.insert(walletTransaction).values(values).returning();
  if (!row) throw new Error("insertTransaction: no row returned");
  return row;
}

export async function insertLines({
  db,
  transactionId,
  lines,
}: Executor & { transactionId: string; lines: { walletId: string; amount: number }[] }) {
  await db.insert(walletTransactionLine).values(lines.map((line) => ({ transactionId, ...line })));
}

/** A transaction with its lines, or `undefined`. */
export async function findTransactionWithLines({
  db,
  id,
}: Executor & { id: string }): Promise<TransactionWithLines | undefined> {
  const [transaction] = await db.select().from(walletTransaction).where(eq(walletTransaction.id, id));
  if (!transaction) return undefined;

  const lines = await db
    .select()
    .from(walletTransactionLine)
    .where(eq(walletTransactionLine.transactionId, id))
    .orderBy(asc(walletTransactionLine.amount));
  return { transaction, lines };
}

/** The purchase transaction of an order item, with its lines, or `undefined` when it had none (paid 0). */
export async function findPurchaseOfOrderItem({
  db,
  orderItemId,
}: Executor & { orderItemId: string }): Promise<TransactionWithLines | undefined> {
  const [transaction] = await db
    .select({ id: walletTransaction.id })
    .from(walletTransaction)
    .where(and(eq(walletTransaction.orderItemId, orderItemId), eq(walletTransaction.type, "purchase")));
  return transaction && findTransactionWithLines({ db, id: transaction.id });
}

/** A wallet's own lines, newest first, joined with what users may see of each transaction. */
export function findWalletHistory({
  db,
  walletId,
  limit,
}: Executor & { walletId: string; limit: number }): Promise<WalletHistoryRow[]> {
  return db
    .select({
      lineId: walletTransactionLine.id,
      amount: walletTransactionLine.amount,
      transactionId: walletTransaction.id,
      number: walletTransaction.number,
      type: sql<TransactionType>`${walletTransaction.type}`,
      description: walletTransaction.description,
      createdAt: walletTransaction.createdAt,
    })
    .from(walletTransactionLine)
    .innerJoin(walletTransaction, eq(walletTransactionLine.transactionId, walletTransaction.id))
    .where(eq(walletTransactionLine.walletId, walletId))
    .orderBy(desc(walletTransaction.createdAt), desc(walletTransaction.number))
    .limit(limit);
}
