import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { ConfigSchema, DEFAULT_CONFIG, type Config } from './schema.js';
import { getConfigPath, getConfigDir } from './paths.js';

export function loadConfig(): Config {
  const configPath = getConfigPath();

  let fileConfig: Partial<Config> = {};

  // Load config file if it exists
  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Failed to parse config file at ${configPath}:`, error);
      // Continue with defaults
    }
  }

  // Merge with defaults
  const mergedConfig = {
    budget: {
      monthlyCapUsd: fileConfig.budget?.monthlyCapUsd ?? DEFAULT_CONFIG.budget.monthlyCapUsd,
    },
    apiKeys: {
      reddit: fileConfig.apiKeys?.reddit,
      anthropic: fileConfig.apiKeys?.anthropic,
      cloudflare: fileConfig.apiKeys?.cloudflare,
      github: fileConfig.apiKeys?.github,
      vercel: fileConfig.apiKeys?.vercel,
    },
    scraping: {
      sources: fileConfig.scraping?.sources ?? DEFAULT_CONFIG.scraping.sources,
      memesPerSource: fileConfig.scraping?.memesPerSource ?? DEFAULT_CONFIG.scraping.memesPerSource,
    },
    deployment: {
      vercelOrgId: fileConfig.deployment?.vercelOrgId,
    },
  };

  // Environment variable overrides (env always wins per user decision)
  if (process.env.DOMAINWEAVE_REDDIT_KEY) {
    mergedConfig.apiKeys.reddit = process.env.DOMAINWEAVE_REDDIT_KEY;
  }
  if (process.env.DOMAINWEAVE_ANTHROPIC_KEY) {
    mergedConfig.apiKeys.anthropic = process.env.DOMAINWEAVE_ANTHROPIC_KEY;
  }
  if (process.env.DOMAINWEAVE_CLOUDFLARE_KEY) {
    mergedConfig.apiKeys.cloudflare = process.env.DOMAINWEAVE_CLOUDFLARE_KEY;
  }
  if (process.env.DOMAINWEAVE_GITHUB_KEY) {
    mergedConfig.apiKeys.github = process.env.DOMAINWEAVE_GITHUB_KEY;
  }
  if (process.env.DOMAINWEAVE_VERCEL_KEY) {
    mergedConfig.apiKeys.vercel = process.env.DOMAINWEAVE_VERCEL_KEY;
  }
  if (process.env.DOMAINWEAVE_BUDGET_CAP) {
    const budgetCap = parseFloat(process.env.DOMAINWEAVE_BUDGET_CAP);
    if (!isNaN(budgetCap) && budgetCap > 0) {
      mergedConfig.budget.monthlyCapUsd = budgetCap;
    }
  }

  // Validate with Zod
  const validatedConfig = ConfigSchema.parse(mergedConfig);

  return validatedConfig;
}

export function writeDefaultConfig(): void {
  const configPath = getConfigPath();
  const configDir = getConfigDir();

  // Create directory if it doesn't exist
  mkdirSync(configDir, { recursive: true });

  // Write default config
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
}
