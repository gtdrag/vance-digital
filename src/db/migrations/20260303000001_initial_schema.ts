import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Config table
  await db.schema
    .createTable('config')
    .addColumn('key', 'text', (col) => col.primaryKey())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // Transactions table
  await db.schema
    .createTable('transactions')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('amount_usd', 'real', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('reference_id', 'text')
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
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

  // Memes table
  await db.schema
    .createTable('memes')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('url', 'text', (col) => col.notNull().unique())
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('image_path', 'text')
    .addColumn('perceptual_hash', 'text')
    .addColumn('verified', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('confidence_score', 'real')
    .addColumn('deployed', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('scraped_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex('idx_memes_url')
    .on('memes')
    .column('url')
    .execute();

  // Domains table
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
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex('idx_domains_name')
    .on('domains')
    .column('name')
    .execute();

  await db.schema
    .createIndex('idx_domains_status')
    .on('domains')
    .column('status')
    .execute();

  // Deployments table
  await db.schema
    .createTable('deployments')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('site_id', 'integer')
    .addColumn('domain_id', 'integer')
    .addColumn('github_repo', 'text')
    .addColumn('vercel_url', 'text')
    .addColumn('vercel_project_id', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('error_log', 'text')
    .addColumn('deployed_at', 'text')
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // Sites table
  await db.schema
    .createTable('sites')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('meme_id', 'integer', (col) => col.notNull())
    .addColumn('domain_id', 'integer', (col) => col.notNull())
    .addColumn('html_path', 'text')
    .addColumn('live_url', 'text')
    .addColumn('prev_site_id', 'integer')
    .addColumn('next_site_id', 'integer')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex('idx_sites_status')
    .on('sites')
    .column('status')
    .execute();

  // Nostr keypairs table
  await db.schema
    .createTable('nostr_keypairs')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('npub', 'text', (col) => col.notNull().unique())
    .addColumn('nsec_encrypted', 'text', (col) => col.notNull())
    .addColumn('relay_urls', 'text')
    .addColumn('created_at', 'text', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('nostr_keypairs').execute();
  await db.schema.dropTable('sites').execute();
  await db.schema.dropTable('deployments').execute();
  await db.schema.dropTable('domains').execute();
  await db.schema.dropTable('memes').execute();
  await db.schema.dropTable('transactions').execute();
  await db.schema.dropTable('config').execute();
}
