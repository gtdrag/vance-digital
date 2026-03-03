import type { Kysely } from 'kysely';
import type { DatabaseSchema, Transaction, NewTransaction } from '../schema.js';
import type { TransactionCategory } from '../../types/index.js';
import { sql } from 'kysely';

/**
 * Get total spending for the current calendar month
 */
export async function getMonthlyTotal(db: Kysely<DatabaseSchema>): Promise<number> {
  // Get first day of current month in ISO format
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayISO = firstDayOfMonth.toISOString();

  const result = await db
    .selectFrom('transactions')
    .select(({ fn }) => fn.sum<number>('amount_usd').as('total'))
    .where('created_at', '>=', firstDayISO)
    .executeTakeFirst();

  return result?.total ?? 0;
}

/**
 * Get spending breakdown by category for current calendar month
 * Returns an object with all transaction categories and their totals
 */
export async function getSpendingByCategory(
  db: Kysely<DatabaseSchema>
): Promise<Record<TransactionCategory, number>> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayISO = firstDayOfMonth.toISOString();

  const results = await db
    .selectFrom('transactions')
    .select(['category', ({ fn }) => fn.sum<number>('amount_usd').as('total')])
    .where('created_at', '>=', firstDayISO)
    .groupBy('category')
    .execute();

  // Initialize with all categories at 0
  const breakdown: Record<TransactionCategory, number> = {
    domain_registration: 0,
    domain_renewal: 0,
    api_anthropic: 0,
    api_reddit: 0,
    api_google: 0,
    api_vercel: 0,
    other: 0,
  };

  // Fill in actual values
  for (const row of results) {
    breakdown[row.category as TransactionCategory] = row.total ?? 0;
  }

  return breakdown;
}

/**
 * Get recent transaction history
 */
export async function getTransactionHistory(
  db: Kysely<DatabaseSchema>,
  options: { limit?: number } = {}
): Promise<Transaction[]> {
  const limit = options.limit ?? 20;

  return db
    .selectFrom('transactions')
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute();
}

/**
 * Insert a new transaction
 */
export async function insertTransaction(
  db: Kysely<DatabaseSchema>,
  transaction: NewTransaction
): Promise<Transaction> {
  const result = await db
    .insertInto('transactions')
    .values(transaction)
    .returningAll()
    .executeTakeFirstOrThrow();

  return result;
}
