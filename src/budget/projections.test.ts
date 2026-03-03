import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely, SqliteDialect, sql } from 'kysely';
import Database from 'better-sqlite3';
import type { DatabaseSchema } from '../db/schema.js';
import {
  getUpcomingRenewals,
  getRenewalProjection,
  estimateApiCosts,
  getNext30DaysProjection,
} from './projections.js';
import type { Config } from '../config/schema.js';

// Helper to create in-memory test database
function createTestDb(): Kysely<DatabaseSchema> {
  const sqlite = new Database(':memory:');

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });
}

// Helper to run initial schema migration on test db
async function migrateTestDb(db: Kysely<DatabaseSchema>): Promise<void> {
  // Create transactions table
  await db.schema
    .createTable('transactions')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('amount_usd', 'real', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('reference_id', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Create domains table
  await db.schema
    .createTable('domains')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('registrar', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('acquisition_cost_usd', 'real')
    .addColumn('renewal_cost_usd', 'real')
    .addColumn('renewal_date', 'text')
    .addColumn('dns_configured', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('acquired_at', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}

// Default test config
const testConfig: Config = {
  budget: {
    monthlyCapUsd: 25,
  },
  apiKeys: {},
  scraping: {
    sources: ['reddit'],
    memesPerSource: 50,
  },
  deployment: {},
};

describe('Budget Projections', () => {
  let db: Kysely<DatabaseSchema>;

  beforeEach(async () => {
    db = createTestDb();
    await migrateTestDb(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  describe('getUpcomingRenewals', () => {
    it('returns domains with renewal_date within next N days', async () => {
      const now = new Date();
      const in15Days = new Date(now);
      in15Days.setDate(in15Days.getDate() + 15);

      await db
        .insertInto('domains')
        .values({
          name: 'test-domain.com',
          status: 'active',
          renewal_cost_usd: 12.99,
          renewal_date: in15Days.toISOString(),
        })
        .execute();

      const renewals = await getUpcomingRenewals(db, 30);

      expect(renewals).toHaveLength(1);
      expect(renewals[0].name).toBe('test-domain.com');
      expect(renewals[0].renewalCostUsd).toBe(12.99);
      expect(renewals[0].renewalDate).toBeDefined();
    });

    it('returns empty array when no domains exist', async () => {
      const renewals = await getUpcomingRenewals(db);
      expect(renewals).toEqual([]);
    });

    it('excludes domains with renewal_date in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await db
        .insertInto('domains')
        .values({
          name: 'expired-domain.com',
          status: 'active',
          renewal_cost_usd: 10,
          renewal_date: yesterday.toISOString(),
        })
        .execute();

      const renewals = await getUpcomingRenewals(db, 30);
      expect(renewals).toEqual([]);
    });

    it('excludes domains with status=failed', async () => {
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      await db
        .insertInto('domains')
        .values({
          name: 'failed-domain.com',
          status: 'failed',
          renewal_cost_usd: 10,
          renewal_date: in10Days.toISOString(),
        })
        .execute();

      const renewals = await getUpcomingRenewals(db, 30);
      expect(renewals).toEqual([]);
    });

    it('includes only domains within the specified days window', async () => {
      const in5Days = new Date();
      in5Days.setDate(in5Days.getDate() + 5);

      const in35Days = new Date();
      in35Days.setDate(in35Days.getDate() + 35);

      await db
        .insertInto('domains')
        .values([
          {
            name: 'soon-domain.com',
            status: 'active',
            renewal_cost_usd: 10,
            renewal_date: in5Days.toISOString(),
          },
          {
            name: 'later-domain.com',
            status: 'active',
            renewal_cost_usd: 15,
            renewal_date: in35Days.toISOString(),
          },
        ])
        .execute();

      const renewals = await getUpcomingRenewals(db, 30);
      expect(renewals).toHaveLength(1);
      expect(renewals[0].name).toBe('soon-domain.com');
    });
  });

  describe('getRenewalProjection', () => {
    it('returns total projected renewal cost', async () => {
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      const in20Days = new Date();
      in20Days.setDate(in20Days.getDate() + 20);

      await db
        .insertInto('domains')
        .values([
          {
            name: 'domain1.com',
            status: 'active',
            renewal_cost_usd: 10,
            renewal_date: in10Days.toISOString(),
          },
          {
            name: 'domain2.com',
            status: 'active',
            renewal_cost_usd: 15.50,
            renewal_date: in20Days.toISOString(),
          },
        ])
        .execute();

      const total = await getRenewalProjection(db, 30);
      expect(total).toBe(25.50);
    });

    it('returns 0 when no upcoming renewals', async () => {
      const total = await getRenewalProjection(db, 30);
      expect(total).toBe(0);
    });
  });

  describe('estimateApiCosts', () => {
    it('estimates next-30-day API costs based on recent 30-day average', async () => {
      const now = new Date();

      // Insert 10 API transactions over past 30 days totaling $30
      // Average = $1/day, so 30-day projection = $30
      for (let i = 0; i < 10; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 3)); // Spread over 30 days

        await db
          .insertInto('transactions')
          .values({
            category: 'api_anthropic',
            amount_usd: 3,
            created_at: date.toISOString(),
          })
          .execute();
      }

      const estimate = await estimateApiCosts(db, 30);
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThanOrEqual(30); // Should be around $30
    });

    it('returns 0 when no API transactions exist', async () => {
      const estimate = await estimateApiCosts(db);
      expect(estimate).toBe(0);
    });

    it('only counts API categories for estimation', async () => {
      const now = new Date();

      // Insert non-API transaction
      await db
        .insertInto('transactions')
        .values({
          category: 'domain_registration',
          amount_usd: 100,
          created_at: now.toISOString(),
        })
        .execute();

      // Insert API transaction
      await db
        .insertInto('transactions')
        .values({
          category: 'api_reddit',
          amount_usd: 5,
          created_at: now.toISOString(),
        })
        .execute();

      const estimate = await estimateApiCosts(db, 30);
      // Should only count the API transaction, not the domain registration
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(150); // Should not include $100 domain cost
    });
  });

  describe('getNext30DaysProjection', () => {
    it('returns combined projection with all fields', async () => {
      const projection = await getNext30DaysProjection(db, testConfig);

      expect(projection).toHaveProperty('renewalCost');
      expect(projection).toHaveProperty('estimatedApiCost');
      expect(projection).toHaveProperty('totalProjected');
      expect(projection).toHaveProperty('remainingBudget');
      expect(projection).toHaveProperty('willExceedCap');
    });

    it('correctly identifies when projected costs will exceed monthly cap', async () => {
      // Add domain renewal of $15
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      await db
        .insertInto('domains')
        .values({
          name: 'expensive-domain.com',
          status: 'active',
          renewal_cost_usd: 15,
          renewal_date: in10Days.toISOString(),
        })
        .execute();

      // Add $20 already spent
      await db
        .insertInto('transactions')
        .values({
          category: 'domain_registration',
          amount_usd: 20,
        })
        .execute();

      const projection = await getNext30DaysProjection(db, testConfig);

      // Remaining budget: $25 - $20 = $5
      // Projected renewal: $15
      // Should exceed cap
      expect(projection.remainingBudget).toBe(5);
      expect(projection.renewalCost).toBe(15);
      expect(projection.willExceedCap).toBe(true);
    });

    it('returns willExceedCap=false when projection is within budget', async () => {
      // Add domain renewal of $5
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      await db
        .insertInto('domains')
        .values({
          name: 'cheap-domain.com',
          status: 'active',
          renewal_cost_usd: 5,
          renewal_date: in10Days.toISOString(),
        })
        .execute();

      const projection = await getNext30DaysProjection(db, testConfig);

      expect(projection.renewalCost).toBe(5);
      expect(projection.remainingBudget).toBe(25);
      expect(projection.willExceedCap).toBe(false);
    });
  });
});
