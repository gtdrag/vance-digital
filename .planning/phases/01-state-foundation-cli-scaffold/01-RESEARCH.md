# Phase 1: State Foundation & CLI Scaffold - Research

**Researched:** 2026-03-03
**Domain:** Node.js CLI development with TypeScript, SQLite state management, and budget tracking
**Confidence:** HIGH

## Summary

Phase 1 establishes a TypeScript CLI tool with SQLite database, XDG-compliant config storage, and budget tracking. The Node.js CLI ecosystem has mature, stable tooling for this domain. Commander.js remains the lightweight standard for CLI frameworks, better-sqlite3 provides the fastest SQLite access, and Kysely offers type-safe query building with excellent migration support. The rich terminal UI stack (chalk/picocolors, ora, boxen, cli-table3) is well-established for creating polished CLI output.

The key architectural decision is using ESM (ECMAScript modules) for the project, which is now the Node.js default in 2026. This requires chalk v5+ (ESM-only) or picocolors as alternatives. SQLite with WAL mode enabled provides excellent performance for concurrent read/write operations. Budget tracking requires a transactions table with categorization and monthly aggregation logic.

**Primary recommendation:** Use Commander.js + better-sqlite3 + Kysely + picocolors/chalk combo with TypeScript ESM project structure. Enable SQLite WAL mode immediately after connection. Use Zod for config validation at startup. Follow XDG Base Directory specification for cross-platform config/data storage.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### CLI Output Style
- Rich terminal UI — colored output, box-drawing characters, tables
- Spinners + step logs in interactive mode; plain text logs when output is piped or in `--quiet` mode
- Informative by default — show key steps as they happen (e.g., "Creating database... done"). Use `--quiet` to suppress
- All commands support `--json` flag for machine-readable output (table default for humans, JSON for machines)
- CLI registered as both `domainweave` (full name) and `dw` (shortcut alias)
- TypeScript project

#### Config & Init Flow
- Hybrid init: `domainweave init` creates config and database immediately with sensible defaults, then prints guidance to customize
- XDG-compliant data storage: config in `~/.config/domainweave/`, data in `~/.local/share/domainweave/`
- API keys: environment variables are primary (`DOMAINWEAVE_ANTHROPIC_KEY`, etc.), config file values as fallback. Env always overrides config
- Required keys: Reddit, Anthropic, Cloudflare, GitHub, Vercel — all as placeholders in initial config

#### Budget Display & Alerts
- Default monthly budget cap: $25/month
- `domainweave budget` shows projections — upcoming renewals and estimated API costs based on recent usage
- Budget projections include a "Next 30 days" section

#### Database Schema
- Full schema upfront — create all tables (config, transactions, memes, domains, deployments, sites, nostr_keypairs) at init time
- Versioned SQL migrations from day one
- Include `nostr_keypairs` table (npub, nsec_encrypted, relay_urls, created_at) — future-proofing for Nostr distribution channel

### Claude's Discretion
- Color scheme and semantic color usage (success/warning/error indicators)
- Status command layout design (dashboard vs summary)
- Budget spending categories and breakdown structure
- Domain renewal cost handling (included in cap vs tracked separately)
- Budget history retention approach
- Monthly reset mechanism (calendar month vs rolling window)
- Error message style (with/without hints)
- Init-time API key validation behavior
- Package manager selection
- Single vs split database files
- Stats query approach (live queries vs summary table)
- Logging library choice
- CLI framework choice (Commander.js or alternatives)

### Deferred Ideas (OUT OF SCOPE)
- **Nostr distribution channel** — Create npub per meme, publish to relays, zero-cost viral growth. Hub account reposts everything for discovery. Explore as a new phase or project direction expansion.
- Nostr's censorship resistance means no centralized way to stop network growth — only individual relay filtering. This changes the growth/cost calculus fundamentally compared to domain-only approach.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | User can run `domainweave init` to create config file and SQLite database | Commander.js for CLI parsing, better-sqlite3 for database, xdg-basedir for cross-platform paths, Kysely migrations for schema versioning |
| CLI-04 | User can run `domainweave status` to see network stats (sites, memes, domains, spend) | cli-table3 for table formatting, Kysely for type-safe queries, chalk/picocolors for colored output |
| CLI-05 | User can run `domainweave budget` to see spending breakdown by category | Budget projection patterns (transactions table + category aggregation), cli-table3 for formatted display |
| CLI-06 | All operations log to stdout with configurable verbosity levels | ora for spinners, picocolors for log severity colors, stdout/stderr best practices for piped output |
| CLI-07 | Config stored in `config.json` with registrar keys, Vercel token, budget caps, scraping prefs | Zod for config validation, environment variable precedence (env overrides config), JSON schema patterns |
| BUDG-01 | SQLite database tracks all domains, memes, deployments, and spending | better-sqlite3 + Kysely schema design, WAL mode for performance, migration versioning |
| BUDG-02 | Monthly spending cap enforced across all categories (domains, API calls) | Budget tracking schema (transactions with categories, monthly aggregation queries) |
| BUDG-03 | System alerts when spending reaches 80% of monthly cap | Query patterns for budget threshold checks, colored CLI warnings |
| BUDG-04 | Domain renewal costs tracked and projected for budget planning | Schema design for renewal_date + renewal_cost fields, projection calculation patterns |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **commander** | ^12.1.0 | CLI framework | 500M+ weekly downloads, lightweight (180KB, 0 deps), requires Node.js 18+, excellent TypeScript support, industry standard for simple-to-medium CLI tools |
| **better-sqlite3** | ^12.6.2 | SQLite driver | Fastest SQLite library for Node.js (313K ops/sec vs 26K for node-sqlite3), synchronous API avoids event loop complexity, built-in TypeScript types, latest release Jan 2026 |
| **kysely** | ^0.27.0+ | Type-safe SQL query builder | Type-safe queries with autocomplete, built-in migration system, works seamlessly with better-sqlite3, frozen-in-time migration pattern prevents app coupling |
| **zod** | ^3.24.0+ | Runtime schema validation | TypeScript-first validation, 40M+ weekly downloads (Feb 2026), catches config typos/missing values before startup, industry standard for config validation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **picocolors** | ^1.1.1 | Terminal colors (CommonJS/ESM) | Lightweight chalk alternative (much smaller bundle), supports both CommonJS and ESM, use if staying on CommonJS or want smaller bundle |
| **chalk** | ^5.3.0 | Terminal colors (ESM-only) | Full-featured colors with chained syntax, ESM-only since v5.0.0, use if project is pure ESM and want more features (hex codes, etc) |
| **ora** | ^8.1.0+ | Terminal spinners | Standard for async operation spinners, integrates with chalk/picocolors, use for "Creating database..." style feedback |
| **cli-table3** | ^0.6.5 | Table formatting | Unicode tables, column/row spanning, custom styling, modernized cli-table with active maintenance |
| **boxen** | ^8.0.0+ | Boxed messages | Draw boxes around important messages (warnings, success, etc), pairs well with chalk/picocolors |
| **xdg-basedir** | ^5.1.0 | XDG directory paths | Returns `~/.config`, `~/.local/share`, etc per XDG spec, handles undefined gracefully, cross-platform |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Commander.js | **yargs** (850KB, 7 deps) | More features (declarative syntax, coercion) but 20ms overhead vs Commander's near-zero |
| Commander.js | **oclif** (12MB, 30+ deps) | Enterprise plugin architecture but 70-100ms overhead, overkill for simple CLI |
| chalk | **ansis** | Smaller, supports CommonJS+ESM, has 256 colors + Truecolor, good middle-ground alternative |
| kysely | **Drizzle ORM** | Full ORM with relations, more magic but less control, heavier than kysely |
| kysely | **TypeORM** | Mature ORM with decorators, but migrations less flexible than kysely's frozen-in-time approach |
| zod | **valibot** | Smaller bundle (~10KB vs ~52KB), matters for startup time, but less ecosystem support |

**Installation:**
```bash
npm install commander better-sqlite3 kysely zod picocolors ora cli-table3 boxen xdg-basedir
npm install -D typescript @types/node @types/better-sqlite3 tsx
```

**Note on chalk vs picocolors:** If using ESM (recommended for 2026), chalk v5 works great. If staying CommonJS or want smaller bundle, picocolors is drop-in compatible. User constraints specify TypeScript project, so ESM is recommended default.

## Architecture Patterns

### Recommended Project Structure

```
domainweave/
├── src/
│   ├── cli/
│   │   ├── index.ts           # CLI entry point, Commander program setup
│   │   ├── commands/          # Command implementations
│   │   │   ├── init.ts        # domainweave init
│   │   │   ├── status.ts      # domainweave status
│   │   │   └── budget.ts      # domainweave budget
│   │   └── ui/                # Terminal UI helpers
│   │       ├── colors.ts      # Color scheme definitions
│   │       ├── tables.ts      # Table formatting utilities
│   │       └── spinner.ts     # Spinner wrapper
│   ├── db/
│   │   ├── client.ts          # Database connection singleton
│   │   ├── schema.ts          # Kysely type definitions
│   │   ├── migrations/        # SQL migration files
│   │   │   ├── 001_initial_schema.ts
│   │   │   └── ...
│   │   └── queries/           # Reusable query functions
│   │       ├── stats.ts       # Network stats queries
│   │       └── budget.ts      # Budget projection queries
│   ├── config/
│   │   ├── loader.ts          # Config loading with env precedence
│   │   ├── schema.ts          # Zod schema for validation
│   │   └── paths.ts           # XDG directory resolution
│   ├── budget/
│   │   ├── tracker.ts         # Budget tracking logic
│   │   └── projections.ts     # Renewal projections, alerts
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── dist/                       # Compiled output
├── package.json
├── tsconfig.json
└── .env.example                # Template for env vars
```

### Pattern 1: CLI Entry with bin Field

**What:** Register CLI commands with both full and short names using package.json bin field and shebang.

**When to use:** For all CLI tools that need to be invoked from terminal.

**Example:**
```json
// package.json
{
  "name": "domainweave",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "domainweave": "./dist/cli/index.js",
    "dw": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli/index.ts"
  }
}
```

```typescript
// src/cli/index.ts
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();
program
  .name('domainweave')
  .description('Autonomous JD Vance meme network builder')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize config and database')
  .action(async () => {
    const { initCommand } = await import('./commands/init.js');
    await initCommand();
  });

program.parse();
```

**Source:** [npm package.json docs](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/), [Understanding bin in package.json](https://www.monkwhocode.com/2020/04/node-jsunderstanding-bin-in-packagejson.html)

### Pattern 2: Environment Variable Precedence

**What:** Environment variables override config file values, with validation at startup.

**When to use:** For any config that might contain secrets or deployment-specific values.

**Example:**
```typescript
// src/config/loader.ts
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import xdgBasedir from 'xdg-basedir';

const ConfigSchema = z.object({
  budget: z.object({
    monthlyCapUsd: z.number().positive().default(25),
  }),
  apiKeys: z.object({
    reddit: z.string().optional(),
    anthropic: z.string().optional(),
    cloudflare: z.string().optional(),
    github: z.string().optional(),
    vercel: z.string().optional(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export async function loadConfig(): Promise<Config> {
  const configPath = path.join(xdgBasedir.config!, 'domainweave', 'config.json');

  let fileConfig = {};
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    fileConfig = JSON.parse(raw);
  } catch (err) {
    // Config doesn't exist yet (first run)
  }

  // Environment variables override file
  const merged = {
    ...fileConfig,
    apiKeys: {
      ...fileConfig.apiKeys,
      reddit: process.env.DOMAINWEAVE_REDDIT_KEY || fileConfig.apiKeys?.reddit,
      anthropic: process.env.DOMAINWEAVE_ANTHROPIC_KEY || fileConfig.apiKeys?.anthropic,
      cloudflare: process.env.DOMAINWEAVE_CLOUDFLARE_KEY || fileConfig.apiKeys?.cloudflare,
      github: process.env.DOMAINWEAVE_GITHUB_KEY || fileConfig.apiKeys?.github,
      vercel: process.env.DOMAINWEAVE_VERCEL_KEY || fileConfig.apiKeys?.vercel,
    },
  };

  // Validate and return
  return ConfigSchema.parse(merged);
}
```

**Source:** [Environment variable precedence in Prisma](https://github.com/prisma/prisma/discussions/21207), [dotenv best practices 2026](https://www.envsentinel.dev/blog/environment-variable-management-tips-best-practices)

### Pattern 3: SQLite with WAL Mode

**What:** Enable Write-Ahead Logging immediately after opening connection for better concurrency and performance.

**When to use:** For all SQLite databases in production CLI tools (always, unless specific reason not to).

**Example:**
```typescript
// src/db/client.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import xdgBasedir from 'xdg-basedir';
import { Kysely, SqliteDialect } from 'kysely';
import type { DatabaseSchema } from './schema.js';

let db: Kysely<DatabaseSchema> | null = null;

export function getDb(): Kysely<DatabaseSchema> {
  if (db) return db;

  const dbPath = path.join(xdgBasedir.data!, 'domainweave', 'state.db');
  const sqlite = new Database(dbPath);

  // Enable WAL mode immediately for better concurrency
  sqlite.pragma('journal_mode = WAL');

  db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });

  return db;
}
```

**Source:** [better-sqlite3 WAL mode benefits](https://dev.to/lovestaco/understanding-better-sqlite3-the-fastest-sqlite-library-for-nodejs-4n8), [WAL mode performance docs](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/performance.md)

### Pattern 4: Kysely Migrations with ISO 8601 Naming

**What:** Migration files run in alpha-numeric order, prefixed with ISO 8601 dates. Use `Kysely<any>` (not typed DB) to prevent coupling to app code.

**When to use:** For all database schema changes throughout project lifecycle.

**Example:**
```typescript
// src/db/migrations/20260303000001_initial_schema.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('transactions')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('amount_usd', 'real', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex('idx_transactions_created_at')
    .on('transactions')
    .column('created_at')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('transactions').execute();
}
```

**Running migrations:**
```typescript
// src/db/client.ts
import { Migrator, FileMigrationProvider } from 'kysely';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function runMigrations(db: Kysely<any>) {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  return results;
}
```

**Source:** [Kysely migrations official docs](https://kysely.dev/docs/migrations)

### Pattern 5: JSON Output with --json Flag

**What:** Detect `--json` flag and output machine-readable JSON instead of formatted tables. Use stdout/stderr correctly for piping.

**When to use:** For any CLI command that displays data (status, budget, etc).

**Example:**
```typescript
// src/cli/commands/status.ts
import Table from 'cli-table3';
import pc from 'picocolors';

interface StatusData {
  sites: number;
  memes: number;
  domains: number;
  spentUsd: number;
}

export async function statusCommand(options: { json?: boolean }) {
  const db = getDb();

  const stats: StatusData = {
    sites: await db.selectFrom('sites').select(db.fn.count('id').as('count')).executeTakeFirstOrThrow(),
    memes: await db.selectFrom('memes').select(db.fn.count('id').as('count')).executeTakeFirstOrThrow(),
    domains: await db.selectFrom('domains').select(db.fn.count('id').as('count')).executeTakeFirstOrThrow(),
    spentUsd: await db.selectFrom('transactions')
      .select(db.fn.sum('amount_usd').as('total'))
      .executeTakeFirstOrThrow(),
  };

  if (options.json) {
    // Machine-readable output to stdout
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  // Human-readable table
  const table = new Table({
    head: [pc.cyan('Metric'), pc.cyan('Value')],
  });

  table.push(
    ['Sites', stats.sites],
    ['Memes', stats.memes],
    ['Domains', stats.domains],
    ['Spent', `$${stats.spentUsd.toFixed(2)}`],
  );

  console.log(table.toString());
}
```

**Source:** [stdout vs stderr best practices](https://dev.to/tene/understanding-err-stdout-and-stderr-in-nodejs-44ia), [LogRocket stdout/stdin/stderr guide](https://blog.logrocket.com/using-stdout-stdin-stderr-node-js/)

### Pattern 6: Budget Projection Schema

**What:** Track transactions with categories, calculate monthly totals, project renewal costs.

**When to use:** For budget enforcement and spending alerts (BUDG-02, BUDG-03, BUDG-04).

**Example:**
```typescript
// src/db/schema.ts (Kysely types)
export interface DatabaseSchema {
  transactions: {
    id: Generated<number>;
    category: 'domain_registration' | 'domain_renewal' | 'api_anthropic' | 'api_reddit' | 'other';
    amount_usd: number;
    description: string | null;
    created_at: Generated<string>;
  };
  domains: {
    id: Generated<number>;
    name: string;
    registrar: string;
    acquired_at: string;
    renewal_date: string;
    renewal_cost_usd: number;
    // ...
  };
}

// src/budget/projections.ts
export async function getMonthlySpending(db: Kysely<DatabaseSchema>): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db
    .selectFrom('transactions')
    .select((eb) => eb.fn.sum('amount_usd').as('total'))
    .where('created_at', '>=', startOfMonth.toISOString())
    .executeTakeFirst();

  return result?.total || 0;
}

export async function getNext30DaysProjection(db: Kysely<DatabaseSchema>): Promise<number> {
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const renewals = await db
    .selectFrom('domains')
    .select((eb) => eb.fn.sum('renewal_cost_usd').as('total'))
    .where('renewal_date', '>=', now.toISOString())
    .where('renewal_date', '<=', next30Days.toISOString())
    .executeTakeFirst();

  return renewals?.total || 0;
}
```

**Source:** [Budget tracking database design](https://bogoyavlensky.com/blog/db-schema-for-budget-tracker-with-automigrate/), [PostgreSQL budget app tutorial](https://dev.to/kihuni/learn-sql-with-postgresql-building-a-budget-tracking-application-4ee6)

### Anti-Patterns to Avoid

- **Using chalk without checking output destination:** Chalk auto-detects TTY, but you should still respect `--quiet` and `--json` flags explicitly
- **Forgetting to enable WAL mode:** Default journal mode has poor concurrency, always enable WAL unless specific reason not to
- **Using typed DB in migrations:** `Kysely<YourDatabase>` couples migrations to current app code, use `Kysely<any>` instead
- **Not validating config at startup:** Runtime type errors are hard to debug, validate with Zod immediately after loading
- **Blocking the event loop:** better-sqlite3 is synchronous but fast; if you have long-running queries, consider running in worker thread
- **Ignoring stderr for errors:** Use `console.error()` for errors so they're visible when stdout is redirected

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal colors/styles | Custom ANSI escape code builder | picocolors or chalk | Cross-terminal compatibility, TTY detection, color support detection, fallback handling |
| CLI argument parsing | Custom process.argv parser | Commander.js | Flag parsing, subcommands, help generation, type coercion, error messages |
| SQL query building | String concatenation with values | Kysely | SQL injection prevention, type safety, autocomplete, parameterization |
| Database migrations | Manual schema versioning | Kysely migrator | Idempotency, rollback support, migration history tracking, concurrent-safe locking |
| Config validation | Manual type checking with if/else | Zod | Runtime type safety, helpful error messages, type inference, nested validation |
| Table formatting | Manual padding/alignment | cli-table3 | Unicode box-drawing, column spanning, alignment, color support |
| XDG paths | Hardcoded `~/.config` paths | xdg-basedir | Cross-platform compatibility, respects env vars, handles undefined gracefully |
| Date/time for migrations | Custom timestamp format | ISO 8601 (YYYY-MM-DDTHHMMSS) | Lexicographic sorting, unambiguous, globally recognized standard |

**Key insight:** CLI tooling has decades of edge cases (terminal emulators, OS differences, piping, redirection, color support). Mature libraries handle these; custom code rarely does.

## Common Pitfalls

### Pitfall 1: Chalk v5 ESM-only Breaking Change

**What goes wrong:** Importing chalk v5 in CommonJS project fails with "Must use import to load ES Module" error.

**Why it happens:** Chalk switched to ESM-only in v5.0.0 (2022). CommonJS projects using `require('chalk')` break on upgrade.

**How to avoid:**
- Use ESM for new projects (recommended for 2026 Node.js projects)
- Or use picocolors instead (supports both CommonJS and ESM)
- Or pin chalk to v4.x if staying on CommonJS

**Warning signs:** Error message "Must use import to load ES Module" when requiring chalk.

**Source:** [chalk ESM migration discussion](https://github.com/chalk/chalk/issues/543), [How to fix ESM error with chalk](https://www.xjavascript.com/blog/error-must-use-import-to-load-es-module-using-typescript-and-node/)

### Pitfall 2: stdout/stderr Confusion in Piped Output

**What goes wrong:** Important logs disappear when user pipes CLI output (e.g., `domainweave status | grep sites`), or JSON output gets mixed with debug logs.

**Why it happens:** By default, `console.log()` writes to stdout. When stdout is piped, both data and logs go to the pipe destination.

**How to avoid:**
- Use `console.error()` for debug/info logs (goes to stderr, not piped)
- Use `console.log()` only for data output (status results, JSON)
- Check `process.stdout.isTTY` to detect piped output and suppress unnecessary formatting

**Warning signs:** Users report "missing output" when piping, or JSON parsers fail because logs are mixed with JSON.

**Source:** [Understanding stdout and stderr in Node.js](https://dev.to/tene/understanding-err-stdout-and-stderr-in-nodejs-44ia), [Frontend Masters stderr course](https://frontendmasters.com/courses/digging-into-node/console-error-process-stderr/)

### Pitfall 3: Kysely Migration Coupling to App Code

**What goes wrong:** Migrations break when app types change, or migrations behave differently when run on older vs newer code.

**Why it happens:** Using `Kysely<YourDatabase>` in migrations creates dependency on current app types. When you change schema types, old migrations can fail.

**How to avoid:**
- Always use `Kysely<any>` in migration functions
- Never import app models/types into migration files
- Migrations should be "frozen in time" — self-contained and immutable

**Warning signs:** Old migrations fail after schema changes, or type errors in migration files after refactoring.

**Source:** [Kysely migrations docs - use Kysely<any>](https://kysely.dev/docs/migrations)

### Pitfall 4: Missing WAL Mode = Poor Performance

**What goes wrong:** Database operations are slow, especially with concurrent reads/writes. Users report CLI commands "hanging" or being sluggish.

**Why it happens:** SQLite default journal mode (DELETE) serializes all writes and blocks readers during writes. WAL mode allows concurrent reads during writes.

**How to avoid:**
- Call `db.pragma('journal_mode = WAL')` immediately after opening database
- Enable once; SQLite persists WAL mode across connections

**Warning signs:** Slow database operations, CLI responsiveness issues, "database is locked" errors.

**Source:** [better-sqlite3 performance docs](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/performance.md), [WAL mode benefits](https://dev.to/lovestaco/understanding-better-sqlite3-the-fastest-sqlite-library-for-nodejs-4n8)

### Pitfall 5: XDG Paths Undefined on Non-Linux Systems

**What goes wrong:** `xdgBasedir.config` is undefined on macOS/Windows in certain configurations, causing file operations to fail.

**Why it happens:** XDG spec is Linux-native. xdg-basedir returns undefined if XDG env vars aren't set AND home directory can't be determined.

**How to avoid:**
- Always check for undefined: `xdgBasedir.config ?? path.join(os.homedir(), '.config')`
- Or use fallback paths explicitly
- Test on macOS/Windows, not just Linux

**Warning signs:** TypeError "Cannot read property of undefined" when accessing xdgBasedir properties on non-Linux systems.

**Source:** [xdg-basedir npm docs](https://www.npmjs.com/package/xdg-basedir), [XDG Base Directory spec](https://specifications.freedesktop.org/basedir/latest/)

### Pitfall 6: Environment Variable Precedence Reversed

**What goes wrong:** Users set environment variables but config file values are used instead. Or vice versa — config file overrides env vars.

**Why it happens:** Incorrect merge order when loading config. Common mistake is merging env vars first, then spreading config file on top.

**How to avoid:**
- Merge order: config file first, then env vars on top
- `{ ...fileConfig, apiKeys: { ...fileConfig.apiKeys, reddit: process.env.KEY || fileConfig.apiKeys.reddit } }`
- Validate precedence in tests

**Warning signs:** Users report "API key not being used" despite setting env var, or vice versa.

**Source:** [dotenv precedence discussion](https://github.com/prisma/prisma/discussions/21207), [Environment variable best practices](https://www.envsentinel.dev/blog/environment-variable-management-tips-best-practices)

### Pitfall 7: Not Respecting --quiet in Spinner/Progress Output

**What goes wrong:** `ora` spinners and progress indicators still show when user passes `--quiet` flag, breaking piped workflows or silent cron jobs.

**Why it happens:** Spinners render by default; need explicit check for quiet mode or non-TTY output.

**How to avoid:**
- Check `options.quiet` or `!process.stdout.isTTY` before creating spinner
- Wrap spinner creation in conditional: `const spinner = options.quiet ? null : ora('Loading...');`
- In quiet mode, skip all visual feedback except errors (to stderr)

**Warning signs:** Cron job logs are cluttered with spinner output, or piped commands show ANSI codes in output.

**Source:** [ora npm docs](https://www.npmjs.com/package/ora), [stdout redirection issues](https://github.com/nodejs/node-v0.x-archive/issues/1669)

## Code Examples

Verified patterns from official sources:

### Commander.js Basic Setup

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('domainweave')
  .description('Autonomous JD Vance meme network builder')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize config and database')
  .option('-q, --quiet', 'Suppress output')
  .action(async (options) => {
    const { initCommand } = await import('./commands/init.js');
    await initCommand(options);
  });

program
  .command('status')
  .description('Show network statistics')
  .option('--json', 'Output JSON instead of table')
  .option('-q, --quiet', 'Suppress non-essential output')
  .action(async (options) => {
    const { statusCommand } = await import('./commands/status.js');
    await statusCommand(options);
  });

program
  .command('budget')
  .description('Show spending breakdown and projections')
  .option('--json', 'Output JSON instead of table')
  .action(async (options) => {
    const { budgetCommand } = await import('./commands/budget.js');
    await budgetCommand(options);
  });

program.parse();
```

**Source:** [Commander.js official docs](https://www.npmjs.com/package/commander), [Building TypeScript CLI with Commander](https://blog.logrocket.com/building-typescript-cli-node-js-commander/)

### better-sqlite3 + Kysely Setup

```typescript
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'node:path';
import xdgBasedir from 'xdg-basedir';

const dbPath = path.join(
  xdgBasedir.data ?? path.join(process.env.HOME!, '.local/share'),
  'domainweave',
  'state.db'
);

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({ database: sqlite }),
});
```

**Source:** [Kysely getting started](https://kysely.dev/docs/getting-started), [better-sqlite3 npm docs](https://www.npmjs.com/package/better-sqlite3)

### Rich Terminal UI with Spinners and Tables

```typescript
import ora from 'ora';
import pc from 'picocolors';
import Table from 'cli-table3';

export async function initCommand(options: { quiet?: boolean }) {
  const spinner = options.quiet ? null : ora('Creating database...').start();

  try {
    await createDatabase();
    spinner?.succeed(pc.green('Database created'));

    spinner?.start('Writing config file...');
    await writeConfig();
    spinner?.succeed(pc.green('Config file created'));

    if (!options.quiet) {
      const table = new Table({
        head: [pc.cyan('File'), pc.cyan('Location')],
      });
      table.push(
        ['Config', '~/.config/domainweave/config.json'],
        ['Database', '~/.local/share/domainweave/state.db'],
      );
      console.log('\n' + table.toString());
    }
  } catch (err) {
    spinner?.fail(pc.red('Initialization failed'));
    console.error(err);
    process.exit(1);
  }
}
```

**Source:** [ora npm docs](https://www.npmjs.com/package/ora), [cli-table3 npm docs](https://www.npmjs.com/package/cli-table3)

### Zod Config Validation

```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  budget: z.object({
    monthlyCapUsd: z.number().positive().default(25),
  }),
  apiKeys: z.object({
    reddit: z.string().min(1).optional(),
    anthropic: z.string().min(1).optional(),
    cloudflare: z.string().min(1).optional(),
    github: z.string().min(1).optional(),
    vercel: z.string().min(1).optional(),
  }),
}).strict();

export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(raw: unknown): Config {
  try {
    return ConfigSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(pc.red('Config validation failed:'));
      for (const issue of err.issues) {
        console.error(pc.yellow(`  ${issue.path.join('.')}: ${issue.message}`));
      }
    }
    throw err;
  }
}
```

**Source:** [Zod official docs](https://zod.dev/), [Zod validation in TypeScript guide](https://oneuptime.com/blog/post/2026-01-25-zod-validation-typescript/view)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CommonJS (`require()`) | ESM (`import/export`) | 2020-2021 (Node 14+) | chalk v5 and many modern packages are ESM-only; use `"type": "module"` in package.json |
| node-sqlite3 (async) | better-sqlite3 (sync) | Ongoing | 10x+ faster, simpler code, better concurrency with WAL mode |
| String SQL queries | Type-safe query builders (Kysely/Drizzle) | 2022-2023 | Autocomplete, compile-time safety, refactoring confidence |
| Manual migration scripts | Framework-managed migrations | 2020s | Idempotency, rollback support, migration history, team coordination |
| `.env` only | Environment variable precedence (env > config) | Industry standard | Security (secrets in env), deployment flexibility (same code, different envs) |
| Hardcoded paths | XDG Base Directory spec | Linux standard, adopted 2010s | Cross-user compatibility, respects system conventions, clean home directory |

**Deprecated/outdated:**
- **node-sqlite3:** Slower, callback-based, outdated. Use better-sqlite3 instead
- **cli-table, cli-table2:** Unmaintained. Use cli-table3 instead
- **yargs alternatives (minimist, etc):** Commander.js is lighter and more popular for simple CLIs
- **Manual ANSI codes:** Use picocolors/chalk instead for cross-terminal compatibility

## Open Questions

1. **Should budget monthly reset be calendar month or rolling 30-day window?**
   - What we know: User constraints don't specify
   - What's unclear: Calendar month (simpler, aligns with billing) vs rolling window (more accurate for daily usage)
   - Recommendation: Default to calendar month (common in budget apps), make configurable later if needed (Claude's discretion per user constraints)

2. **Should domain renewal costs count toward monthly cap?**
   - What we know: BUDG-04 requires renewal cost tracking and projection
   - What's unclear: Whether renewals count against $25/month cap or are tracked separately
   - Recommendation: Count renewals separately with warning if upcoming renewals + projected monthly spend > cap (Claude's discretion per user constraints)

3. **Should nostr_keypairs table be encrypted at rest?**
   - What we know: Schema includes `nsec_encrypted` field, implying encryption intent
   - What's unclear: Encryption key management (where stored?), whether needed for Phase 1 (table is future-proofing)
   - Recommendation: Add table with placeholder structure in Phase 1, defer encryption implementation to Nostr phase (out of scope per deferred ideas)

4. **Should --quiet mode suppress ALL output including errors?**
   - What we know: User wants `--quiet` to suppress logs, and output should work when piped
   - What's unclear: Should errors go to stderr regardless, or should `--quiet` also silence errors?
   - Recommendation: `--quiet` suppresses info/debug to stdout, but errors always go to stderr (standard Unix convention)

## Sources

### Primary (HIGH confidence)

- [Commander.js npm package](https://www.npmjs.com/package/commander) - Official docs, latest version, TypeScript support
- [better-sqlite3 npm package](https://www.npmjs.com/package/better-sqlite3) - v12.6.2, performance benchmarks
- [better-sqlite3 GitHub releases](https://github.com/WiseLibs/better-sqlite3/releases) - Latest release Jan 16-17, 2026
- [Kysely official docs - Getting Started](https://kysely.dev/docs/getting-started) - Installation, basic setup
- [Kysely official docs - Migrations](https://kysely.dev/docs/migrations) - Migration API, best practices, `Kysely<any>` requirement
- [Zod official docs](https://zod.dev/) - v3.24 features, validation patterns
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/) - Official freedesktop.org spec
- [xdg-basedir npm package](https://www.npmjs.com/package/xdg-basedir) - v5.1.0, API reference
- [npm package.json docs](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) - bin field, publishConfig

### Secondary (MEDIUM confidence)

- [CLI Framework Comparison: Commander vs Yargs vs Oclif](https://www.grizzlypeaksoftware.com/library/cli-framework-comparison-commander-vs-yargs-vs-oclif-utxlf9v9) - Feature comparison, performance benchmarks
- [Building TypeScript CLI with Commander - LogRocket](https://blog.logrocket.com/building-typescript-cli-node-js-commander/) - TypeScript integration patterns
- [Getting Started with Kysely - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/kysely-query-builder/) - Real-world usage examples
- [Understanding better-sqlite3 - DEV Community](https://dev.to/lovestaco/understanding-better-sqlite3-the-fastest-sqlite-library-for-nodejs-4n8) - Performance characteristics, WAL mode benefits
- [How to Use SQLite in Node.js - OneUpTime](https://oneuptime.com/blog/post/2026-02-02-sqlite-nodejs/view) - 2026 best practices
- [Understanding stdout and stderr in Node.js - DEV](https://dev.to/tene/understanding-err-stdout-and-stderr-in-nodejs-44ia) - stdout/stderr patterns
- [Using stdout, stdin, stderr in Node.js - LogRocket](https://blog.logrocket.com/using-stdout-stdin-stderr-node-js/) - Piping, redirection
- [TypeScript Project Setup 2026 - TheLinuxCode](https://thelinuxcode.com/set-up-a-typescript-project-in-2026-node-tsconfig-and-a-clean-build-pipeline/) - Modern tsconfig, ESM setup
- [Environment Variable Management Best Practices - Env-Sentinel](https://www.envsentinel.dev/blog/environment-variable-management-tips-best-practices) - 2026 recommendations
- [chalk ESM migration - GitHub issue](https://github.com/chalk/chalk/issues/543) - CommonJS alternatives discussion
- [Chalk vs Picocolors migration - Storybook PR](https://github.com/storybookjs/storybook/pull/28262) - Real-world migration example
- [cli-table3 npm package](https://www.npmjs.com/package/cli-table3) - API docs, examples
- [A Complete Guide to Zod - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/zod-explained/) - Validation patterns
- [Budget tracking database design - Bogoyavlenskiy](https://bogoyavlensky.com/blog/db-schema-for-budget-tracker-with-automigrate/) - Schema patterns
- [Understanding bin in package.json - Monk Who Code](https://www.monkwhocode.com/2020/04/node-jsunderstanding-bin-in-packagejson.html) - CLI packaging

### Tertiary (LOW confidence - marked for validation)

- [ESM in 2026 - Jeff Bruchado blog](https://jeffbruchado.com.br/en/blog/esm-2026-end-commonjs-modern-javascript) - Opinion on ESM adoption timeline
- [Ansis vs Picocolors - GitHub webdiscus/ansis](https://github.com/webdiscus/ansis) - Alternative terminal colors library (needs validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Commander.js, better-sqlite3, Kysely, Zod are verified with official docs, recent 2026 updates confirmed
- Architecture: HIGH - Patterns verified with official docs (Kysely migrations, WAL mode, environment precedence)
- Pitfalls: MEDIUM-HIGH - Common pitfalls documented across multiple sources, chalk ESM issue widely reported, stdout/stderr patterns standard

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days - stable ecosystem)

**Notes:**
- Node.js CLI tooling is mature and stable; major changes unlikely in next 30 days
- better-sqlite3 v12.6.2 released Jan 2026 - very recent, stable
- Kysely, Commander.js, Zod are actively maintained with recent 2025-2026 updates
- ESM is now standard in Node.js ecosystem (2026) - CommonJS is legacy
