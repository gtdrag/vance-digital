import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
import type { TransactionCategory } from '../types/index.js';

// Config table
export interface ConfigTable {
  key: string;
  value: string;
  updated_at: Generated<string>;
}

// Transactions table
export interface TransactionsTable {
  id: Generated<number>;
  category: TransactionCategory;
  amount_usd: number;
  description: string | null;
  reference_id: string | null;
  created_at: Generated<string>;
}

// Memes table
export interface MemesTable {
  id: Generated<number>;
  url: string;
  source: string;
  image_path: string | null;
  perceptual_hash: string | null;
  verified: Generated<number>;
  confidence_score: number | null;
  deployed: Generated<number>;
  scraped_at: Generated<string>;
}

// Domains table
export interface DomainsTable {
  id: Generated<number>;
  name: string;
  registrar: string | null;
  status: Generated<string>;
  acquisition_cost_usd: number | null;
  renewal_cost_usd: number | null;
  renewal_date: string | null;
  dns_configured: Generated<number>;
  acquired_at: string | null;
  created_at: Generated<string>;
}

// Deployments table
export interface DeploymentsTable {
  id: Generated<number>;
  site_id: number | null;
  domain_id: number | null;
  github_repo: string | null;
  vercel_url: string | null;
  vercel_project_id: string | null;
  status: Generated<string>;
  error_log: string | null;
  deployed_at: string | null;
  created_at: Generated<string>;
}

// Sites table
export interface SitesTable {
  id: Generated<number>;
  meme_id: number;
  domain_id: number;
  html_path: string | null;
  live_url: string | null;
  prev_site_id: number | null;
  next_site_id: number | null;
  status: Generated<string>;
  created_at: Generated<string>;
}

// Nostr keypairs table
export interface NostrKeypairsTable {
  id: Generated<number>;
  npub: string;
  nsec_encrypted: string;
  relay_urls: string | null;
  created_at: Generated<string>;
}

// Database schema
export interface DatabaseSchema {
  config: ConfigTable;
  transactions: TransactionsTable;
  memes: MemesTable;
  domains: DomainsTable;
  deployments: DeploymentsTable;
  sites: SitesTable;
  nostr_keypairs: NostrKeypairsTable;
}

// Helper types for each table
export type Config = Selectable<ConfigTable>;
export type NewConfig = Insertable<ConfigTable>;
export type ConfigUpdate = Updateable<ConfigTable>;

export type Transaction = Selectable<TransactionsTable>;
export type NewTransaction = Insertable<TransactionsTable>;
export type TransactionUpdate = Updateable<TransactionsTable>;

export type Meme = Selectable<MemesTable>;
export type NewMeme = Insertable<MemesTable>;
export type MemeUpdate = Updateable<MemesTable>;

export type Domain = Selectable<DomainsTable>;
export type NewDomain = Insertable<DomainsTable>;
export type DomainUpdate = Updateable<DomainsTable>;

export type Deployment = Selectable<DeploymentsTable>;
export type NewDeployment = Insertable<DeploymentsTable>;
export type DeploymentUpdate = Updateable<DeploymentsTable>;

export type Site = Selectable<SitesTable>;
export type NewSite = Insertable<SitesTable>;
export type SiteUpdate = Updateable<SitesTable>;

export type NostrKeypair = Selectable<NostrKeypairsTable>;
export type NewNostrKeypair = Insertable<NostrKeypairsTable>;
export type NostrKeypairUpdate = Updateable<NostrKeypairsTable>;
