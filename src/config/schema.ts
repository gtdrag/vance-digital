import { z } from 'zod';

export const ConfigSchema = z.object({
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
  scraping: z.object({
    sources: z.array(z.string()).default(['reddit']),
    memesPerSource: z.number().positive().default(50),
  }),
  deployment: z.object({
    vercelOrgId: z.string().optional(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
  budget: {
    monthlyCapUsd: 25,
  },
  apiKeys: {
    reddit: undefined,
    anthropic: undefined,
    cloudflare: undefined,
    github: undefined,
    vercel: undefined,
  },
  scraping: {
    sources: ['reddit'],
    memesPerSource: 50,
  },
  deployment: {
    vercelOrgId: undefined,
  },
};
