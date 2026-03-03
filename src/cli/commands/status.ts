import { getDb, closeDb } from '../../db/client.js';
import { loadConfig } from '../../config/loader.js';
import { getNetworkStats } from '../../db/queries/stats.js';
import { createLogger } from '../ui/logger.js';
import { createTable } from '../ui/tables.js';
import { bold, success, warning, error, dim } from '../ui/colors.js';
import { SYMBOLS } from '../ui/colors.js';
import { existsSync } from 'fs';
import { getDbPath } from '../../config/paths.js';

export interface StatusOptions {
  json?: boolean;
  quiet?: boolean;
}

function createProgressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  // Color based on percentage
  if (percentage < 50) {
    return success(bar);
  } else if (percentage < 80) {
    return warning(bar);
  } else {
    return error(bar);
  }
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const logger = createLogger({ quiet: options.quiet });

  // Check if database exists
  const dbPath = getDbPath();
  if (!existsSync(dbPath)) {
    logger.error("Database not found. Run 'domainweave init' first.");
    process.exit(1);
  }

  try {
    // Load config to get budget cap
    const config = loadConfig();
    const budgetCap = config.budget.monthlyCapUsd;

    // Get database and fetch stats
    const db = getDb();
    const stats = await getNetworkStats(db);

    // If JSON mode, output and exit
    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
      await closeDb();
      return;
    }

    // Display rich dashboard
    console.log('\n' + bold('Domainweave Network Status') + '\n');

    // Stats table
    const statsTable = createTable(['Metric', 'Value']);
    statsTable.push(
      ['Sites (live)', String(stats.totalSites)],
      ['Verified Memes', String(stats.totalMemes)],
      ['Domains', String(stats.totalDomains)],
      ['Pending Deployments', String(stats.pendingDeployments)]
    );
    console.log(statsTable.toString());

    console.log(''); // Empty line

    // Budget table
    const monthlyPercentage = budgetCap > 0 ? (stats.monthlySpentUsd / budgetCap) * 100 : 0;
    const budgetTable = createTable(['Budget', 'Amount']);
    budgetTable.push(
      ['Monthly Spent', `$${stats.monthlySpentUsd.toFixed(2)} / $${budgetCap.toFixed(2)}`],
      ['Total Spent', `$${stats.totalSpentUsd.toFixed(2)}`]
    );
    console.log(budgetTable.toString());

    // Budget progress bar
    const progressBar = createProgressBar(monthlyPercentage);
    console.log('\n' + dim('Monthly Budget: ') + `[${progressBar}] ${monthlyPercentage.toFixed(1)}%\n`);

    // Warning if over 80%
    if (monthlyPercentage > 80) {
      logger.warn(`${SYMBOLS.warning} Budget usage exceeds 80% of monthly cap`);
    }

    await closeDb();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
