import boxen from 'boxen';
import { writeDefaultConfig } from '../../config/loader.js';
import { initializeDb, closeDb } from '../../db/client.js';
import { getConfigPath, getDbPath } from '../../config/paths.js';
import { createLogger } from '../ui/logger.js';
import { createSpinner } from '../ui/spinner.js';
import { keyValueTable } from '../ui/tables.js';
import { success, info, dim } from '../ui/colors.js';
import { existsSync } from 'fs';

export interface InitOptions {
  quiet?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const logger = createLogger({ quiet: options.quiet });
  const configPath = getConfigPath();
  const dbPath = getDbPath();

  // Step 1: Create config
  const configSpinner = createSpinner('Creating config directory...', options);
  configSpinner.start();

  try {
    const configExists = existsSync(configPath);
    if (configExists) {
      logger.warn('Config already exists, skipping');
      configSpinner.stop();
    } else {
      writeDefaultConfig();
      configSpinner.succeed(`Config created at ${dim(configPath)}`);
    }
  } catch (error) {
    configSpinner.fail('Failed to create config');
    logger.error(error instanceof Error ? error.message : String(error));
    throw error;
  }

  // Step 2: Initialize database
  const dbSpinner = createSpinner('Initializing database...', options);
  dbSpinner.start();

  try {
    await initializeDb();
    dbSpinner.succeed(`Database created at ${dim(dbPath)}`);
  } catch (error) {
    dbSpinner.fail('Failed to initialize database');
    logger.error(error instanceof Error ? error.message : String(error));
    throw error;
  }

  // Step 3: Display summary (unless quiet)
  if (!options.quiet) {
    console.log('\n' + boxen(success('Domainweave initialized successfully!'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    }));

    // Show file locations
    const locationTable = keyValueTable({
      'Config': configPath,
      'Database': dbPath,
    });
    console.log(locationTable.toString());

    // Show next steps
    console.log('\n' + info('Next steps:'));
    console.log(dim('  1. Set API keys: edit ') + configPath + dim(' or set DOMAINWEAVE_* env vars'));
    console.log(dim('  2. Required keys: Reddit, Anthropic, Cloudflare, GitHub, Vercel'));
    console.log(dim('  3. Check status: ') + 'domainweave status\n');
  }

  // Step 4: Close database connection
  await closeDb();
}
