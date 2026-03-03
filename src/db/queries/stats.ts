import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../schema.js';

export interface NetworkStats {
  totalSites: number;
  totalMemes: number;
  totalDomains: number;
  totalSpentUsd: number;
  monthlySpentUsd: number;
  pendingDeployments: number;
}

export async function getNetworkStats(
  db: Kysely<DatabaseSchema>
): Promise<NetworkStats> {
  // Get current month start (first day at 00:00:00)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartISO = monthStart.toISOString();

  // Query all stats in parallel
  const [sites, memes, domains, totalSpent, monthlySpent, pending] = await Promise.all([
    // Total sites where status = 'live'
    db
      .selectFrom('sites')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', 'live')
      .executeTakeFirst(),

    // Total verified memes
    db
      .selectFrom('memes')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('verified', '=', 1)
      .executeTakeFirst(),

    // Total domains (exclude failed)
    db
      .selectFrom('domains')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '!=', 'failed')
      .executeTakeFirst(),

    // Total spent (all time)
    db
      .selectFrom('transactions')
      .select((eb) => eb.fn.sum<number>('amount_usd').as('total'))
      .executeTakeFirst(),

    // Monthly spent (current calendar month)
    db
      .selectFrom('transactions')
      .select((eb) => eb.fn.sum<number>('amount_usd').as('total'))
      .where('created_at', '>=', monthStartISO)
      .executeTakeFirst(),

    // Pending deployments
    db
      .selectFrom('deployments')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('status', '=', 'pending')
      .executeTakeFirst(),
  ]);

  return {
    totalSites: Number(sites?.count ?? 0),
    totalMemes: Number(memes?.count ?? 0),
    totalDomains: Number(domains?.count ?? 0),
    totalSpentUsd: Number(totalSpent?.total ?? 0),
    monthlySpentUsd: Number(monthlySpent?.total ?? 0),
    pendingDeployments: Number(pending?.count ?? 0),
  };
}
