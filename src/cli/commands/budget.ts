import boxen from 'boxen';
import { loadConfig } from '../../config/loader.js';
import { getDb, closeDb } from '../../db/client.js';
import { getBudgetStatus, getSpendingBreakdown } from '../../budget/tracker.js';
import { getNext30DaysProjection } from '../../budget/projections.js';
import { createLogger } from '../ui/logger.js';
import { createTable } from '../ui/tables.js';
import { bold, success, warning, error, dim } from '../ui/colors.js';
import { existsSync } from 'fs';
import { getDbPath } from '../../config/paths.js';
import type { TransactionCategory } from '../../types/index.js';

export interface BudgetOptions {
  json?: boolean;
  quiet?: boolean;
}

/**
 * Budget command implementation
 */
export async function budgetCommand(options: BudgetOptions = {}): Promise<void> {
  const logger = createLogger({ quiet: options.quiet ?? false });

  try {
    // Check if database exists
    const dbPath = getDbPath();
    if (!existsSync(dbPath)) {
      if (options.json) {
        console.log(JSON.stringify({ error: 'Database not found. Run domainweave init first.' }));
      } else {
        logger.error('Database not found. Run domainweave init first.');
      }
      process.exit(1);
    }

    const config = await loadConfig();
    const db = getDb();

    // Get budget data
    const status = await getBudgetStatus(db, config);
    const breakdown = await getSpendingBreakdown(db);
    const projection = await getNext30DaysProjection(db, config);

    // JSON output
    if (options.json) {
      const output = {
        monthlyCapUsd: status.cap,
        spentUsd: status.spent,
        remainingUsd: status.remaining,
        percentUsed: status.percentUsed,
        isWarning: status.isWarning,
        isExceeded: status.isExceeded,
        breakdown,
        projection: {
          renewalCost: projection.renewalCost,
          estimatedApiCost: projection.estimatedApiCost,
          totalProjected: projection.totalProjected,
          willExceedCap: projection.willExceedCap,
        },
      };
      console.log(JSON.stringify(output, null, 2));
      await closeDb();
      return;
    }

    // Human-readable display
    console.log(''); // Empty line
    console.log(bold('Domainweave Budget'));
    console.log(''); // Empty line

    // Budget overview box
    const percentColor = status.isExceeded
      ? error
      : status.isWarning
      ? warning
      : success;

    const progressBar = createProgressBar(status.percentUsed);
    const progressBarColored = percentColor(progressBar);

    const overviewContent = [
      `Monthly Cap:     $${status.cap.toFixed(2)}`,
      `Spent This Month: $${status.spent.toFixed(2)}`,
      `Remaining:        $${status.remaining.toFixed(2)}`,
      '',
      progressBarColored,
      `${status.percentUsed}% used`,
    ].join('\n');

    console.log(
      boxen(overviewContent, {
        padding: 1,
        margin: 0,
        borderStyle: 'round',
        borderColor: status.isExceeded ? 'red' : status.isWarning ? 'yellow' : 'green',
      })
    );

    console.log(''); // Empty line

    // Spending breakdown table
    console.log(bold('Spending Breakdown'));
    console.log(''); // Empty line

    const breakdownTable = createTable(['Category', 'Amount']);
    breakdownTable.push(['Domain Registration', formatCurrency(breakdown.domain_registration)]);
    breakdownTable.push(['Domain Renewal', formatCurrency(breakdown.domain_renewal)]);
    breakdownTable.push(['API (Anthropic)', formatCurrency(breakdown.api_anthropic)]);
    breakdownTable.push(['API (Reddit)', formatCurrency(breakdown.api_reddit)]);
    breakdownTable.push(['API (Google)', formatCurrency(breakdown.api_google)]);
    breakdownTable.push(['API (Vercel)', formatCurrency(breakdown.api_vercel)]);
    breakdownTable.push(['Other', formatCurrency(breakdown.other)]);

    console.log(breakdownTable.toString());

    console.log(''); // Empty line

    // Next 30 Days projection
    console.log(bold('Next 30 Days Projection'));
    console.log(''); // Empty line

    const projectionTable = createTable(['Projection', 'Amount']);
    projectionTable.push(['Upcoming Renewals', formatCurrency(projection.renewalCost)]);
    projectionTable.push(['Estimated API Costs', formatCurrency(projection.estimatedApiCost)]);
    projectionTable.push(['Total Projected', formatCurrency(projection.totalProjected)]);

    console.log(projectionTable.toString());

    if (projection.willExceedCap) {
      console.log(''); // Empty line
      logger.warn('Projected costs may exceed monthly cap!');
    }

    console.log(''); // Empty line

    // Warning/exceeded messages
    if (status.isExceeded) {
      logger.error('Monthly budget exceeded!');
    } else if (status.isWarning) {
      logger.warn(`Budget at ${status.percentUsed}% — approaching monthly cap`);
    }

    await closeDb();
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

/**
 * Create ASCII progress bar
 */
function createProgressBar(percent: number, width: number = 30): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Format number as currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Category display names
 */
const CATEGORY_NAMES: Record<TransactionCategory, string> = {
  domain_registration: 'Domain Registration',
  domain_renewal: 'Domain Renewal',
  api_anthropic: 'API (Anthropic)',
  api_reddit: 'API (Reddit)',
  api_google: 'API (Google)',
  api_vercel: 'API (Vercel)',
  other: 'Other',
};
