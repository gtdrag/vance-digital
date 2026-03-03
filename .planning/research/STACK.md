# Technology Stack

**Project:** Domainweave (Autonomous Meme-Site Network Generator)
**Researched:** 2026-03-02
**Overall Confidence:** MEDIUM (tools restricted, relying on training data with explicit flagging)

## Research Constraints

**IMPORTANT**: This research was conducted without access to Context7, WebSearch, or Brave API. All recommendations are based on training data (knowledge cutoff: January 2025) and should be validated against current 2026 documentation before implementation.

## Recommended Stack

### Core CLI Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Commander.js** | ^12.x | CLI argument parsing, command structure | Industry standard, stable API, excellent TypeScript support, widespread adoption. Simple for single-command tools, scales to complex multi-command CLIs. | HIGH |
| **chalk** | ^5.x | Terminal output styling | De facto standard for colored CLI output, ESM-native, zero dependencies | HIGH |
| **ora** | ^8.x | Loading spinners | Best-in-class spinner library, works with chalk, essential for long-running operations | HIGH |
| **enquirer** | ^2.x | Interactive prompts | Modern alternative to inquirer, smaller bundle, better DX | MEDIUM |

**Alternative considered**: oclif (Salesforce/Heroku CLI framework) - More powerful but heavyweight for single-purpose tool. Commander + chalk gives 90% of benefits with 10% of complexity.

### Web Scraping & HTTP

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Playwright** | ^1.40+ | Reddit, Google Images, Imgur scraping | Headless browser automation, superior to Puppeteer for 2025+, better reliability, auto-waiting, built-in screenshot capabilities. Critical for JavaScript-rendered content. | HIGH |
| **axios** | ^1.6+ | HTTP requests, API calls | Stable, widely used, better error handling than fetch, request/response interceptors useful for rate limiting | HIGH |
| **cheerio** | ^1.0+ | HTML parsing (when full browser not needed) | jQuery-like API, fast, low memory footprint. Use for static HTML parsing to reduce Playwright overhead. | HIGH |
| **reddit** (snoowrap) | ^1.23+ | Reddit API wrapper | Official-ish wrapper, handles OAuth2, pagination, rate limiting | MEDIUM |

**Anti-pattern**: Don't use puppeteer - Playwright has superseded it with better API design and reliability.

### Vision AI (Image Verification)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Anthropic SDK** (@anthropic-ai/sdk) | ^0.30+ | Claude Vision API | Claude 3.5 Sonnet/Opus excellent at image analysis, cost-effective (~$0.015/image), reliable person identification, meme vs news photo distinction | MEDIUM |
| **OpenAI SDK** (openai) | ^4.60+ | GPT-4V API (fallback) | Established vision capabilities, slightly more expensive (~$0.02-0.04/image), use as secondary verification or fallback | MEDIUM |

**Recommendation**: Primary: Claude Vision (Anthropic). Fallback: GPT-4V. Both excel at identifying specific people and contextual understanding (meme vs news).

**Cost notes** (LOW confidence - verify 2026 pricing):
- Claude Vision: ~$0.015 per image analyzed
- GPT-4V: ~$0.02-0.04 per image
- Budget: $50/month allows ~2,500-3,300 image analyses (accounting for domain costs)

**Alternative considered**: Google Gemini Vision - competitive but less proven for nuanced meme identification in my training data.

### Domain Registrar Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Cloudflare API** | REST API v4 | Domain registration, DNS management | Best pricing ($1.50-3/year for .xyz/.site), excellent API, automatic DNS, no markup on wholesale pricing | HIGH |
| **axios** | ^1.6+ | API client | Same as above - consistent HTTP client across all APIs | HIGH |

**Supported Registrars** (in priority order):

1. **Cloudflare** - Preferred. At-cost pricing, excellent API documentation, automatic DNS, Vercel integration.
2. **Porkbun** - Cheap TLDs, API available, good for budget domains.
3. **Namecheap** - More expensive but larger TLD selection, well-documented API.

**Implementation pattern**: Unified adapter interface allowing runtime registrar selection based on availability and price.

### GitHub Automation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Octokit** (@octokit/rest) | ^20.x | GitHub API wrapper | Official GitHub REST API client, TypeScript support, handles auth/rate limiting, actively maintained | HIGH |
| **simple-git** | ^3.20+ | Git operations | Programmatic git commands, repo initialization, commit, push | HIGH |

**Pattern**: Create repo via Octokit → Initialize with simple-git → Push static HTML → Trigger Vercel deployment via GitHub integration.

### Vercel Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Vercel CLI** (@vercel/cli) | Latest | Programmatic deployment | Official CLI with Node.js API, project linking, domain management, production deploys | HIGH |
| **@vercel/node** | Latest | Vercel SDK | Programmatic API for projects, deployments, domains | MEDIUM |

**Note**: Vercel's GitHub integration is preferred over CLI deployments - push to GitHub automatically triggers Vercel build. CLI primarily needed for domain management (`vercel domains add`).

### Database (State Tracking)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **better-sqlite3** | ^11.x | SQLite driver | Fastest Node.js SQLite driver (native bindings), synchronous API perfect for CLI, zero-config, single file database | HIGH |
| **kysely** | ^0.27+ | SQL query builder | Type-safe queries, SQLite dialect, better than raw SQL strings, excellent TypeScript inference | MEDIUM |

**Schema requirements**:
- `domains` table: domain, registrar, cost, acquired_date, vercel_project_id, status
- `memes` table: meme_id, image_url, source, scraped_date, vision_verified, deployed_domain
- `deployments` table: deployment_id, domain, github_repo, vercel_url, deployed_date
- `budget` table: month, total_spent, domain_count, api_calls

**Alternative considered**: Prisma - Too heavyweight for CLI tool, requires schema migrations, adds complexity.

### Cron Scheduling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **node-cron** | ^3.0+ | In-process scheduler | Simple cron syntax, works within Node.js, good for autonomous mode within long-running process | MEDIUM |
| **System cron** | N/A | External scheduler | Preferred for production - use system crontab to invoke CLI command hourly/daily | HIGH |

**Recommendation**: Design CLI to run as one-shot command, invoked by system cron. Simpler, more reliable, easier debugging than long-running Node.js daemon.

**Pattern**: `0 */6 * * * /usr/local/bin/domainweave grow --budget-check` (run every 6 hours)

### Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **dotenv** | ^16.x | Environment config | Standard for API keys, secrets management | HIGH |
| **zod** | ^3.22+ | Runtime validation | Type-safe config validation, API response validation, better errors than manual checks | HIGH |
| **date-fns** | ^3.x | Date manipulation | Lightweight, tree-shakeable, better than moment.js | HIGH |
| **p-queue** | ^8.x | Async operation queuing | Rate limiting, concurrent scraping control, prevents API throttling | MEDIUM |
| **sharp** | ^0.33+ | Image processing | Fast, native image resizing/optimization for scraped memes, favicon generation | HIGH |

## Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **TypeScript** | ^5.5+ | Type safety | Essential for complex CLI with multiple integrations, catch bugs at compile time | HIGH |
| **tsx** | ^4.x | TypeScript execution | Fast TypeScript runner, no build step needed for dev | HIGH |
| **vitest** | ^2.x | Testing | Fast, Vite-powered, better DX than Jest for 2025+ | MEDIUM |
| **eslint** | ^9.x | Linting | Standard linter, flat config format | HIGH |
| **prettier** | ^3.x | Code formatting | Standard formatter | HIGH |

## Package Manager

**Recommendation**: **pnpm** (latest)

**Why**: Faster than npm, disk-efficient, better monorepo support if tool expands, strict dependency resolution prevents phantom dependencies.

**Alternative**: npm is fine for simpler projects, but pnpm is now standard for 2026 Node.js tooling.

## Runtime

**Node.js**: v22.x LTS (or latest LTS)

**Why**: Latest LTS has best performance, native fetch, improved ESM support. Avoid Node.js <18 (no native fetch, older crypto).

## Project Structure

```
domainweave/
├── src/
│   ├── commands/          # CLI commands (grow, import, status, budget)
│   ├── scrapers/          # Reddit, Google, Imgur, Twitter scrapers
│   ├── vision/            # Vision AI verification
│   ├── registrars/        # Domain acquisition adapters
│   ├── deployers/         # GitHub + Vercel automation
│   ├── database/          # SQLite schemas and queries
│   ├── generators/        # HTML site generation
│   └── utils/             # Shared utilities
├── templates/             # HTML templates for microsites
├── domainweave.db         # SQLite database (gitignored)
├── .env                   # API keys (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables Required

```bash
# Vision AI
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx          # Fallback

# Scrapers
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
GOOGLE_CUSTOM_SEARCH_KEY=xxx
GOOGLE_SEARCH_ENGINE_ID=xxx
IMGUR_CLIENT_ID=xxx
TWITTER_BEARER_TOKEN=xxx    # If using X/Twitter API

# Domain Registrars
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ACCOUNT_ID=xxx
PORKBUN_API_KEY=xxx
PORKBUN_SECRET_KEY=xxx
NAMECHEAP_API_USER=xxx
NAMECHEAP_API_KEY=xxx

# GitHub & Vercel
GITHUB_TOKEN=xxx            # Personal access token
VERCEL_TOKEN=xxx            # Vercel API token
VERCEL_ORG_ID=xxx           # gtdrags-projects org ID

# Budget
MONTHLY_BUDGET=50           # USD
```

## Installation (package.json dependencies)

```json
{
  "name": "domainweave",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "domainweave": "./dist/cli.js"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@octokit/rest": "^20.0.0",
    "@vercel/node": "^3.0.0",
    "axios": "^1.6.0",
    "better-sqlite3": "^11.0.0",
    "chalk": "^5.3.0",
    "cheerio": "^1.0.0",
    "commander": "^12.0.0",
    "date-fns": "^3.0.0",
    "dotenv": "^16.4.0",
    "enquirer": "^2.4.0",
    "kysely": "^0.27.0",
    "node-cron": "^3.0.0",
    "openai": "^4.60.0",
    "ora": "^8.0.0",
    "p-queue": "^8.0.0",
    "playwright": "^1.40.0",
    "sharp": "^0.33.0",
    "simple-git": "^3.20.0",
    "snoowrap": "^1.23.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^22.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.2.0",
    "tsx": "^4.7.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

## Confidence Assessment

| Category | Confidence | Notes |
|----------|------------|-------|
| CLI Framework | HIGH | Commander.js is stable and well-established |
| Scraping | HIGH | Playwright is proven for 2025/2026, axios is stable |
| Vision AI | MEDIUM | Confident in Claude/GPT-4V capabilities, but 2026 pricing unverified |
| Domain APIs | HIGH | Cloudflare API v4 is stable, well-documented |
| GitHub/Vercel | HIGH | Official SDKs, mature APIs |
| Database | HIGH | better-sqlite3 is fast and stable for CLI use |
| Cron | HIGH | System cron is standard Unix approach |
| Utilities | HIGH | All are mature, widely-used libraries |

## Version Verification Needed

**CRITICAL**: The following version numbers are based on January 2025 training data and MUST be verified against npm registry or official docs before implementation:

- Playwright (claimed ^1.40+)
- Anthropic SDK (claimed ^0.30+)
- OpenAI SDK (claimed ^4.60+)
- Octokit (claimed ^20.x)
- better-sqlite3 (claimed ^11.x)
- All other dependencies

**Verification command**: `npm info <package> version` for each library.

## Anti-Recommendations

| Technology | Why NOT to Use |
|------------|----------------|
| **Puppeteer** | Superseded by Playwright - worse API, less reliable, slower |
| **Inquirer** | Heavier than enquirer, slower startup, more dependencies |
| **Prisma** | Too heavyweight for CLI, requires migrations, adds complexity vs kysely |
| **Moment.js** | Deprecated, use date-fns or native Temporal API (if Node 22+ supports) |
| **request** | Deprecated since 2020, use axios or native fetch |
| **nodemon** | Not needed with tsx for development |
| **pm2** | Overkill - use system cron instead of long-running daemon |
| **Express/Fastify** | No web server needed - this is a CLI tool |

## Key Architectural Decisions

### Why Playwright over Axios-only?

Modern meme sources (Reddit, Imgur, Twitter) are JavaScript-rendered. Axios gets HTML shell, Playwright gets rendered content. Worth the overhead.

### Why better-sqlite3 over Prisma?

CLI tools need fast startup, zero config, single binary. Prisma adds 300ms startup time, requires schema migrations, generates 10MB+ of code. better-sqlite3 + kysely gives type safety without the weight.

### Why system cron over node-cron daemon?

Daemons crash, accumulate memory leaks, complicate deployment. System cron is Unix-native, reliable, easy to monitor. CLI designed as one-shot command: scrape → verify → acquire → deploy → exit.

### Why Claude Vision primary over GPT-4V?

Based on training data: Claude 3.5 Sonnet/Opus has superior contextual understanding for distinguishing memes from news photos, better at identifying specific people, and slightly cheaper. GPT-4V as fallback ensures redundancy.

### Why Cloudflare over other registrars?

At-cost pricing (no markup), excellent API, automatic DNS configuration, native Vercel integration, supports cheap TLDs (.xyz, .site, .online at $1.50-3/year).

## Risk Areas & Mitigations

| Risk | Mitigation |
|------|------------|
| **Scraper rate limiting** | p-queue for controlled concurrency, exponential backoff, respect robots.txt |
| **Vision API costs spiral** | Pre-filter obvious non-memes with image analysis (file size, dimensions, metadata), batch verification |
| **Vercel deployment limits** | Rate limit to 10 deploys/hour, queue excess for next run |
| **Domain API failures** | Retry logic, multi-registrar fallback, manual import CSV option |
| **Database corruption** | SQLite WAL mode, periodic backups, schema versioning |
| **API key exposure** | dotenv + .gitignore, validate keys at startup, clear error messages |

## Next Steps for Roadmap

Based on this stack, recommended phase structure:

1. **Phase 1: CLI Scaffold** - Commander + SQLite + budget tracking
2. **Phase 2: Scraping** - Playwright + scrapers for each source
3. **Phase 3: Vision Verification** - Anthropic SDK integration
4. **Phase 4: Domain Acquisition** - Cloudflare API + DNS automation
5. **Phase 5: Deployment** - GitHub + Vercel automation
6. **Phase 6: Autonomous Growth** - Cron integration + budget enforcement

## Sources

**IMPORTANT**: All recommendations based on training data (knowledge cutoff: January 2025). No Context7, WebSearch, or Brave API access during research.

**Verification required**:
- npm registry for current versions
- Official documentation: Playwright, Anthropic, OpenAI, Cloudflare, Vercel, GitHub APIs
- 2026 pricing for vision APIs

**Training data confidence**: HIGH for stable libraries (commander, axios, better-sqlite3), MEDIUM for rapidly-evolving APIs (vision AI, registrar APIs).
