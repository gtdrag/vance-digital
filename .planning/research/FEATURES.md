# Feature Landscape

**Domain:** Autonomous Web Scraping / Site Generation / Domain Network Tools
**Researched:** 2026-03-02
**Confidence:** MEDIUM (based on training data, web search unavailable)

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **CLI Interface** | Standard for automation tools, scriptable, cron-compatible | Low | Argument parsing, help text, version flag |
| **Configuration File** | Avoid passing 20+ flags every run | Low | YAML/JSON/TOML config with CLI override capability |
| **Dry Run Mode** | Test without spending money or making changes | Low | `--dry-run` flag that simulates full pipeline |
| **Budget Management** | Prevent runaway spending on domains/APIs | Medium | Hard caps, spend tracking, alerts at 80%/100% |
| **Status/Progress Logging** | Know what's happening during long-running operations | Low | Structured logs with levels (info/warn/error) |
| **Retry Logic** | Network requests fail; APIs have transient errors | Medium | Exponential backoff, configurable max retries |
| **Error Handling** | Graceful failures with actionable error messages | Medium | Rollback incomplete deployments, clear next steps |
| **State Persistence** | Resume interrupted operations without repeating work | Medium | Database/file tracking completed steps |
| **Content Deduplication** | Don't scrape/deploy the same meme twice | Medium | Hash-based or perceptual image matching |
| **Domain Availability Check** | Verify domain is purchasable before attempting | Low | Pre-flight API calls to registrar |
| **DNS Configuration** | Point domains to hosting automatically | Medium | Registrar API integration for nameservers/records |
| **Deployment Verification** | Confirm site is live before marking complete | Low | HTTP status check post-deployment |
| **Rollback Capability** | Undo failed deployments or problematic content | High | Delete repos, remove DNS, mark domains unused |
| **List/Inventory Commands** | View current state: domains owned, sites deployed, memes scraped | Low | `list-domains`, `list-sites`, `list-memes` |
| **Manual Overrides** | Import user-owned domains, skip specific sources | Low | CSV import, exclude filters, manual triggers |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Vision AI Content Verification** | Ensures scraped content matches criteria (not just text matching) | High | API integration + prompt engineering for specific person/meme detection |
| **Multi-Source Scraping** | Cast wide net across Reddit, Imgur, Twitter, Google | Medium | Per-source adapters, rate limit handling, auth management |
| **Autonomous Mode (Cron-Friendly)** | Zero-touch growth over weeks/months | Medium | Self-contained runs, state management, no manual intervention |
| **Hub-and-Spoke Network Topology** | Central gallery linking to individual sites creates discoverability | Medium | Bi-directional linking, hub regeneration on network changes |
| **Sequential Navigation** | Prev/next arrows create browsing flow across network | Medium | Ordered list of sites, circular linking logic |
| **Spend Analytics** | Dashboard showing cost per domain, API spend trends, ROI | Medium | Aggregation queries, trend visualization |
| **Source Attribution** | Each meme credited to original source with link | Low | Metadata preservation during scraping |
| **Aesthetic Consistency** | Uniform design across all sites (branding) | Low | Template system with shared CSS/animations |
| **Auto-Generated Favicons** | Unique visual identity per site without manual design | Low | SVG generation from domain initials |
| **Content Quality Scoring** | Prioritize funnier/higher-engagement memes | High | Engagement metrics from source, ML quality models |
| **Network Graph Visualization** | See domain network as interactive graph | Medium | D3.js/vis.js visualization of hub-spoke topology |
| **Webhook Notifications** | Alert on milestones (new site deployed, budget threshold) | Low | Slack/Discord/email integration |
| **Export/Backup** | Download entire database + content for portability | Low | SQLite export, image archive creation |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **SEO Optimization** | Attracts wrong attention, feels spammy, not the goal | Focus on authentic network growth, let organic discovery happen |
| **User Authentication** | Adds complexity for static sites that should be open | Keep sites public, authentication only for CLI tool config |
| **CMS/Admin Panel** | Scope creep, maintenance burden, defeats CLI-first approach | Improve CLI UX instead (better commands, clearer output) |
| **Mobile App** | Different platform, high maintenance, web works fine | Ensure responsive design on sites, keep CLI desktop-focused |
| **Monetization (Ads/Affiliate)** | Corrupts pure meme mission, adds legal/tax complexity | Keep project art-focused, not revenue-focused |
| **Dynamic Content** | Requires servers/databases, increases hosting cost | Static generation is core value (cheap, fast, simple) |
| **Multi-Tenancy** | Tool is personal, not SaaS; adds auth/isolation complexity | Single-user CLI, document forking for others |
| **Interactive Features (Comments/Voting)** | Requires backend, moderation, spam prevention | Use share buttons linking to social media for engagement |
| **Custom Themes Per Site** | Design fragmentation weakens network identity | Uniform aesthetic is a feature, not a limitation |
| **Automatic Content Removal** | Legal gray area, risk of false positives | Manual review via `remove-site` command if needed |
| **Real-Time Monitoring Dashboard** | Overkill for cron job that runs daily/weekly | Use logs + periodic `status` command |
| **Machine Learning Training** | Unnecessary complexity for content verification | Use existing vision APIs (Claude, GPT-4V) |

## Feature Dependencies

```
Content Scraping → Content Verification (vision AI must validate scraped images)
Content Verification → Deduplication (need valid content before checking duplicates)
Domain Acquisition → DNS Configuration (must own domain before configuring DNS)
DNS Configuration → Site Deployment (DNS must point to host before deploying)
Site Deployment → Hub Regeneration (hub shows deployed sites, not pending ones)
Hub Regeneration → Network Linking (hub must exist to link spokes)

Budget Management ← All API Operations (scraping, vision AI, domains all consume budget)
State Persistence ← All Operations (all features need state tracking for resume capability)
```

## MVP Recommendation

### Phase 1: Core Pipeline
Prioritize:
1. **CLI Interface** - Foundation for everything
2. **Configuration File** - Essential for managing API keys, preferences
3. **Content Scraping** (single source: Reddit) - Prove scraping works
4. **Vision AI Verification** - Core differentiator, validate early
5. **Content Deduplication** - Prevent wasted spend on duplicate memes
6. **State Persistence** - SQLite database for tracking
7. **Manual Domain Import** - Start with user-owned domains (no spend)
8. **Site Generation** - Static HTML from template
9. **Deployment** (GitHub + Vercel) - Reuse existing vance.digital pipeline
10. **Basic Logging** - Console output for transparency

Defer:
- **Domain Acquisition** - Phase 2 (test with manual import first)
- **DNS Configuration** - Phase 2 (manual for MVP)
- **Hub-and-Spoke Linking** - Phase 2 (single sites work standalone)
- **Autonomous Mode** - Phase 3 (manual runs until pipeline proven)
- **Multi-Source Scraping** - Phase 3 (Reddit sufficient for MVP)

### Phase 2: Automation
Add:
11. **Domain Acquisition** - Registrar API integration (Cloudflare/Namecheap)
12. **Budget Management** - Hard caps, spend tracking, alerts
13. **DNS Configuration** - Automated nameserver/record setup
14. **Hub Site Regeneration** - Central gallery at vance.digital
15. **Deployment Verification** - Confirm sites are live
16. **Error Handling & Retry Logic** - Production reliability

### Phase 3: Polish
Add:
17. **Autonomous Mode** - Cron-compatible end-to-end runs
18. **Sequential Navigation** - Prev/next linking across sites
19. **Multi-Source Scraping** - Imgur, Twitter, Google Images
20. **Webhook Notifications** - Deployment/budget alerts
21. **Spend Analytics** - Cost tracking dashboard
22. **Rollback Capability** - Undo failed deployments

### Later/Optional
- Network graph visualization
- Content quality scoring
- Export/backup functionality
- Auto-generated favicons (nice-to-have, not critical)

## Complexity Assessment

| Feature Category | Low | Medium | High |
|------------------|-----|--------|------|
| **Table Stakes** | 8 | 6 | 1 |
| **Differentiators** | 5 | 7 | 2 |
| **Total** | 13 | 13 | 3 |

**Insight:** Most features are Low-Medium complexity. The 3 High-complexity items are:
1. Vision AI content verification (core differentiator - worth it)
2. Rollback capability (safety feature - worth it)
3. Content quality scoring (nice-to-have - defer or skip)

## Sources

**Confidence Note:** This research is based on training data (knowledge cutoff January 2025) due to web search tools being unavailable. Recommendations draw from:
- Common patterns in CLI automation tools (Scrapy, Playwright, Puppeteer)
- Domain management SaaS features (Cloudflare, Namecheap bulk tools)
- Static site generator ecosystems (Hugo, Jekyll, 11ty)
- Web automation frameworks (n8n, Make, Zapier)

**Verification Needed:**
- Current state of Reddit API (pricing, rate limits, authentication requirements in 2026)
- Cloudflare Registrar API feature completeness vs Namecheap/Porkbun
- Vercel deployment rate limits and free tier constraints in 2026
- Vision API pricing (Claude API, OpenAI GPT-4V) for budget modeling

**Recommended Phase-Specific Research:**
- Before Phase 2: Deep dive on registrar APIs (compare Cloudflare vs Namecheap vs Porkbun)
- Before Phase 3: Investigate Twitter/X API changes, Imgur API requirements
