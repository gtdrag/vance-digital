import Database from 'better-sqlite3';
import { Kysely, SqliteDialect, Migrator, FileMigrationProvider } from 'kysely';
import { promises as fs } from 'fs';
import { mkdirSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSchema } from './schema.js';
import { getDataDir } from '../config/paths.js';

let db: Kysely<DatabaseSchema> | null = null;

export function getDb(): Kysely<DatabaseSchema> {
  if (db) {
    return db;
  }

  const dataDir = getDataDir();
  const dbPath = path.join(dataDir, 'state.db');

  // Create directory synchronously to ensure it exists before db creation
  mkdirSync(dataDir, { recursive: true });

  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL');

  db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });

  return db;
}

export async function initializeDb(): Promise<void> {
  const database = getDb();

  // Get the directory where migrations are stored
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.join(__dirname, 'migrations');

  const migrator = new Migrator({
    db: database,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsDir,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  if (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  if (results) {
    results.forEach((result) => {
      if (result.status === 'Success') {
        console.log(`Migration "${result.migrationName}" executed successfully`);
      } else if (result.status === 'Error') {
        console.error(`Migration "${result.migrationName}" failed`);
      }
    });
  }
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}
