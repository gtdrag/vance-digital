#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('domainweave')
  .description('Autonomous JD Vance meme network builder')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize config and database')
  .option('-q, --quiet', 'Suppress non-essential output')
  .action(async (options) => {
    try {
      const { initCommand } = await import('./commands/init.js');
      await initCommand(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show network statistics')
  .option('--json', 'Output as JSON')
  .option('-q, --quiet', 'Suppress non-essential output')
  .action(async (options) => {
    try {
      const { statusCommand } = await import('./commands/status.js');
      await statusCommand(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Budget command (stub for Plan 03)
program
  .command('budget')
  .description('Show spending breakdown and projections')
  .option('--json', 'Output as JSON')
  .option('-q, --quiet', 'Suppress non-essential output')
  .action(async () => {
    console.log('Budget command coming soon');
  });

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('Unexpected error:', error.message);
  process.exit(1);
});

program.parse();
