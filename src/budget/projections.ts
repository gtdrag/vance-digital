import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../db/schema.js';
import type { Config } from '../config/schema.js';
import { getMonthlyTotal } from '../db/queries/budget.js';

/**
 * Upcoming renewal information
 */
export interface UpcomingRenewal {
  name: string;
  renewalDate: string;
  renewalCostUsd: number;
}

/**
 * Next 30 days projection
 */
export interface Next30DaysProjection {
  renewalCost: number;
  estimatedApiCost: number;
  totalProjected: number;
  remainingBudget: number;
  willExceedCap: boolean;
}

/**
 * Get domains with upcoming renewals within specified days
 */
export async function getUpcomingRenewals(
  db: Kysely<DatabaseSchema>,
  days: number = 30
): Promise<UpcomingRenewal[]> {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  const nowISO = now.toISOString();
  const futureISO = futureDate.toISOString();

  const domains = await db
    .selectFrom('domains')
    .select(['name', 'renewal_date', 'renewal_cost_usd'])
    .where('renewal_date', '>=', nowISO)
    .where('renewal_date', '<=', futureISO)
    .where('status', '!=', 'failed')
    .where('renewal_cost_usd', 'is not', null)
    .execute();

  return domains
    .filter((d) => d.renewal_date !== null && d.renewal_cost_usd !== null)
    .map((d) => ({
      name: d.name,
      renewalDate: d.renewal_date!,
      renewalCostUsd: d.renewal_cost_usd!,
    }));
}

/**
 * Get total projected renewal cost for upcoming period
 */
export async function getRenewalProjection(
  db: Kysely<DatabaseSchema>,
  days: number = 30
): Promise<number> {
  const renewals = await getUpcomingRenewals(db, days);
  return renewals.reduce((sum, renewal) => sum + renewal.renewalCostUsd, 0);
}

/**
 * Estimate API costs for next N days based on recent usage
 */
export async function estimateApiCosts(
  db: Kysely<DatabaseSchema>,
  days: number = 30
): Promise<number> {
  const now = new Date();
  const past30Days = new Date(now);
  past30Days.setDate(past30Days.getDate() - 30);

  const past30DaysISO = past30Days.toISOString();

  // Get all API transactions from past 30 days
  const result = await db
    .selectFrom('transactions')
    .select(({ fn }) => fn.sum<number>('amount_usd').as('total'))
    .where('created_at', '>=', past30DaysISO)
    .where('category', 'like', 'api_%')
    .executeTakeFirst();

  const past30DaysTotal = result?.total ?? 0;

  if (past30DaysTotal === 0) {
    return 0;
  }

  // Calculate daily average and project forward
  const dailyAverage = past30DaysTotal / 30;
  const projection = dailyAverage * days;

  return Math.round(projection * 100) / 100; // Round to 2 decimal places
}

/**
 * Get comprehensive projection for next 30 days
 */
export async function getNext30DaysProjection(
  db: Kysely<DatabaseSchema>,
  config: Config
): Promise<Next30DaysProjection> {
  const renewalCost = await getRenewalProjection(db, 30);
  const estimatedApiCost = await estimateApiCosts(db, 30);
  const totalProjected = renewalCost + estimatedApiCost;

  const currentSpent = await getMonthlyTotal(db);
  const remainingBudget = config.budget.monthlyCapUsd - currentSpent;
  const willExceedCap = totalProjected > remainingBudget;

  return {
    renewalCost,
    estimatedApiCost,
    totalProjected,
    remainingBudget,
    willExceedCap,
  };
}
