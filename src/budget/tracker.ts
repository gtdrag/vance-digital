import type { Kysely } from 'kysely';
import type { DatabaseSchema, Transaction } from '../db/schema.js';
import type { Config } from '../config/schema.js';
import type { TransactionCategory } from '../types/index.js';
import { getMonthlyTotal, getSpendingByCategory, insertTransaction } from '../db/queries/budget.js';

/**
 * Result of checking if spending is allowed
 */
export interface CanSpendResult {
  allowed: boolean;
  currentSpend: number;
  remaining: number;
  reason?: string;
}

/**
 * Budget status with warning and exceeded flags
 */
export interface BudgetStatus {
  spent: number;
  cap: number;
  remaining: number;
  percentUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
}

/**
 * Check if a proposed amount can be spent without exceeding monthly cap
 */
export async function canSpend(
  db: Kysely<DatabaseSchema>,
  config: Config,
  amount: number
): Promise<CanSpendResult> {
  const currentSpend = await getMonthlyTotal(db);
  const cap = config.budget.monthlyCapUsd;
  const remaining = cap - currentSpend;
  const allowed = currentSpend + amount <= cap;

  return {
    allowed,
    currentSpend,
    remaining,
    reason: allowed ? undefined : `Would exceed monthly cap of $${cap}. Current: $${currentSpend}, Remaining: $${remaining}`,
  };
}

/**
 * Record a transaction in the database
 */
export async function recordTransaction(
  db: Kysely<DatabaseSchema>,
  transaction: {
    category: TransactionCategory;
    amountUsd: number;
    description?: string;
    referenceId?: string;
  }
): Promise<Transaction> {
  return insertTransaction(db, {
    category: transaction.category,
    amount_usd: transaction.amountUsd,
    description: transaction.description ?? null,
    reference_id: transaction.referenceId ?? null,
  });
}

/**
 * Get total spending for current month
 */
export async function getMonthlySpending(db: Kysely<DatabaseSchema>): Promise<number> {
  return getMonthlyTotal(db);
}

/**
 * Get current budget status with thresholds
 */
export async function getBudgetStatus(
  db: Kysely<DatabaseSchema>,
  config: Config
): Promise<BudgetStatus> {
  const spent = await getMonthlyTotal(db);
  const cap = config.budget.monthlyCapUsd;
  const remaining = cap - spent;
  const percentUsed = Math.round((spent / cap) * 100);

  return {
    spent,
    cap,
    remaining,
    percentUsed,
    isWarning: percentUsed >= 80,
    isExceeded: percentUsed >= 100,
  };
}

/**
 * Get spending breakdown by category for display
 */
export async function getSpendingBreakdown(
  db: Kysely<DatabaseSchema>
): Promise<Record<TransactionCategory, number>> {
  return getSpendingByCategory(db);
}
