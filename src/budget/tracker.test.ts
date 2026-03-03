import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely, SqliteDialect, sql } from 'kysely';
import Database from 'better-sqlite3';
import type { DatabaseSchema } from '../db/schema.js';
import { canSpend, recordTransaction, getMonthlySpending, getBudgetStatus, getSpendingBreakdown } from './tracker.js';
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
  // Create all tables needed for budget tests
  await db.schema
    .createTable('transactions')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('amount_usd', 'real', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('reference_id', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createIndex('idx_transactions_created_at')
    .on('transactions')
    .column('created_at')
    .execute();

  await db.schema
    .createIndex('idx_transactions_category')
    .on('transactions')
    .column('category')
    .execute();

  // Create domains table for projection tests (needed later)
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

describe('Budget Tracker', () => {
  let db: Kysely<DatabaseSchema>;

  beforeEach(async () => {
    db = createTestDb();
    await migrateTestDb(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  describe('canSpend', () => {
    it('returns true when monthly spending + amount <= monthlyCapUsd', async () => {
      const result = await canSpend(db, testConfig, 10);
      expect(result.allowed).toBe(true);
      expect(result.currentSpend).toBe(0);
      expect(result.remaining).toBe(25);
    });

    it('returns false when monthly spending + amount > monthlyCapUsd', async () => {
      // Insert $20 spent
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 20,
        description: 'Test domain',
      }).execute();

      const result = await canSpend(db, testConfig, 10);
      expect(result.allowed).toBe(false);
      expect(result.currentSpend).toBe(20);
      expect(result.remaining).toBe(5);
      expect(result.reason).toContain('Would exceed monthly cap');
    });

    it('returns false when already at exactly monthlyCapUsd', async () => {
      // Insert exactly $25 spent
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 25,
        description: 'Test domain',
      }).execute();

      const result = await canSpend(db, testConfig, 0.01);
      expect(result.allowed).toBe(false);
      expect(result.currentSpend).toBe(25);
      expect(result.remaining).toBe(0);
    });

    it('allows spending when exactly at cap limit', async () => {
      const result = await canSpend(db, testConfig, 25);
      expect(result.allowed).toBe(true);
    });
  });

  describe('recordTransaction', () => {
    it('inserts row into transactions table', async () => {
      const result = await recordTransaction(db, {
        category: 'api_anthropic',
        amountUsd: 5.50,
        description: 'Claude API call',
      });

      expect(result.id).toBeDefined();
      expect(result.category).toBe('api_anthropic');
      expect(result.amount_usd).toBe(5.50);
      expect(result.description).toBe('Claude API call');
      expect(result.created_at).toBeDefined();
    });

    it('returns the inserted transaction with id and created_at', async () => {
      const result = await recordTransaction(db, {
        category: 'domain_renewal',
        amountUsd: 12.99,
        referenceId: 'renewal-123',
      });

      expect(result.id).toBeGreaterThan(0);
      expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('getMonthlySpending', () => {
    it('returns 0 for empty database', async () => {
      const spending = await getMonthlySpending(db);
      expect(spending).toBe(0);
    });

    it('returns sum of current calendar month transactions only', async () => {
      const now = new Date();
      const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM

      // Insert transactions in current month
      await db.insertInto('transactions').values([
        {
          category: 'domain_registration',
          amount_usd: 10,
          created_at: `${thisMonth}-05T10:00:00Z`,
        },
        {
          category: 'api_anthropic',
          amount_usd: 5.50,
          created_at: `${thisMonth}-15T14:30:00Z`,
        },
      ]).execute();

      const spending = await getMonthlySpending(db);
      expect(spending).toBe(15.50);
    });

    it('correctly handles month boundary - excludes prior month', async () => {
      const now = new Date();

      // Calculate last month - handle year boundary
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      // Determine last day of previous month dynamically
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Insert transaction on last day of previous month (ISO format)
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 100,
        created_at: lastDayOfLastMonth.toISOString(),
      }).execute();

      // Insert transaction on first day of current month (ISO format)
      await db.insertInto('transactions').values({
        category: 'api_reddit',
        amount_usd: 5,
        created_at: firstDayOfThisMonth.toISOString(),
      }).execute();

      const spending = await getMonthlySpending(db);
      expect(spending).toBe(5); // Should NOT include the $100 from last month
    });
  });

  describe('getBudgetStatus', () => {
    it('returns correct status object with all fields', async () => {
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 10,
      }).execute();

      const status = await getBudgetStatus(db, testConfig);

      expect(status.spent).toBe(10);
      expect(status.cap).toBe(25);
      expect(status.remaining).toBe(15);
      expect(status.percentUsed).toBe(40);
      expect(status.isWarning).toBe(false);
      expect(status.isExceeded).toBe(false);
    });

    it('sets isWarning=true when spending >= 80% of cap', async () => {
      // Spend exactly 80% ($20 of $25)
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 20,
      }).execute();

      const status = await getBudgetStatus(db, testConfig);

      expect(status.percentUsed).toBe(80);
      expect(status.isWarning).toBe(true);
      expect(status.isExceeded).toBe(false);
    });

    it('sets isExceeded=true when spending >= 100% of cap', async () => {
      // Spend exactly at cap
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 25,
      }).execute();

      const status = await getBudgetStatus(db, testConfig);

      expect(status.percentUsed).toBe(100);
      expect(status.isWarning).toBe(true);
      expect(status.isExceeded).toBe(true);
    });

    it('handles exceeding cap (over 100%)', async () => {
      // Spend over cap
      await db.insertInto('transactions').values({
        category: 'domain_registration',
        amount_usd: 30,
      }).execute();

      const status = await getBudgetStatus(db, testConfig);

      expect(status.spent).toBe(30);
      expect(status.remaining).toBe(-5);
      expect(status.percentUsed).toBe(120);
      expect(status.isExceeded).toBe(true);
    });
  });

  describe('getSpendingBreakdown', () => {
    it('returns all zero for empty database', async () => {
      const breakdown = await getSpendingBreakdown(db);

      expect(breakdown.domain_registration).toBe(0);
      expect(breakdown.domain_renewal).toBe(0);
      expect(breakdown.api_anthropic).toBe(0);
      expect(breakdown.api_reddit).toBe(0);
      expect(breakdown.api_google).toBe(0);
      expect(breakdown.api_vercel).toBe(0);
      expect(breakdown.other).toBe(0);
    });

    it('returns breakdown object with totals per category for current month', async () => {
      const now = new Date();
      const thisMonth = now.toISOString().slice(0, 7);

      await db.insertInto('transactions').values([
        {
          category: 'domain_registration',
          amount_usd: 10,
          created_at: `${thisMonth}-05T10:00:00Z`,
        },
        {
          category: 'domain_registration',
          amount_usd: 5,
          created_at: `${thisMonth}-10T10:00:00Z`,
        },
        {
          category: 'api_anthropic',
          amount_usd: 3.50,
          created_at: `${thisMonth}-15T14:30:00Z`,
        },
        {
          category: 'api_reddit',
          amount_usd: 2,
          created_at: `${thisMonth}-20T08:00:00Z`,
        },
      ]).execute();

      const breakdown = await getSpendingBreakdown(db);

      expect(breakdown.domain_registration).toBe(15);
      expect(breakdown.api_anthropic).toBe(3.50);
      expect(breakdown.api_reddit).toBe(2);
      expect(breakdown.domain_renewal).toBe(0);
      expect(breakdown.api_google).toBe(0);
    });

    it('correctly sums multiple categories', async () => {
      await db.insertInto('transactions').values([
        { category: 'api_anthropic', amount_usd: 1 },
        { category: 'api_anthropic', amount_usd: 2 },
        { category: 'api_anthropic', amount_usd: 3 },
      ]).execute();

      const breakdown = await getSpendingBreakdown(db);
      expect(breakdown.api_anthropic).toBe(6);
    });
  });
});
