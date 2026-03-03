# Architecture Patterns: Autonomous Meme-Site Network Generator

**Project:** Domainweave
**Domain:** Autonomous CLI orchestrator with scraping, deployment, and network management
**Researched:** 2026-03-02
**Overall Confidence:** MEDIUM (based on training data - web search tools unavailable for verification)

## Recommended Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Orchestrator                         │
│                   (Commander.js or similar)                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ├─────────────────────────────────────────────┐
                  │                                             │
        ┌─────────▼─────────┐                       ┌──────────▼──────────┐
        │   Job Scheduler    │                       │   State Manager     │
        │   (cron-mode)      │                       │   (SQLite wrapper)  │
        └─────────┬─────────┘                       └──────────┬──────────┘
                  │                                             │
      ┌───────────┼───────────┬─────────────┬─────────────────┤
      │           │           │             │                 │
┌─────▼──────┐ ┌──▼─────┐ ┌──▼──────┐ ┌────▼────────┐ ┌─────▼──────┐
│   Meme     │ │ Vision │ │ Domain  │ │    Site     │ │   Deploy   │
│  Scraper   │ │   AI    │ │Acquirer │ │  Generator  │ │  Manager   │
└─────┬──────┘ └──┬─────┘ └──┬──────┘ └────┬────────┘ └─────┬──────┘
      │           │           │             │                │
      │           │           │             │                │
      └───────────┴───────────┴─────────────┴────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Budget Manager    │
                    │  (cost tracking)    │
                    └─────────────────────┘
```

### Core Component Boundaries

| Component | Responsibility | Inputs | Outputs | Communicates With |
|-----------|---------------|---------|---------|-------------------|
| **CLI Orchestrator** | Command routing, error handling, user interaction | CLI args, flags | Status messages, logs | All components (orchestrates) |
| **State Manager** | Database abstraction, ACID transactions, query interface | Component requests | Persisted state, query results | All components (via API) |
| **Job Scheduler** | Autonomous mode, cron compatibility, retry logic | Schedule config | Job triggers | Orchestrator, State Manager |
| **Meme Scraper** | Multi-source scraping, deduplication, rate limiting | Source URLs, keywords | Raw meme URLs + metadata | State Manager, Vision AI |
| **Vision AI Filter** | Image verification, meme validation, confidence scoring | Image URLs | Pass/fail + confidence | State Manager |
| **Domain Acquirer** | Registrar API integration, price checking, DNS config | Budget limit, domain preferences | Domain purchase records | State Manager, Budget Manager |
| **Site Generator** | Static HTML templating, favicon generation, linking logic | Meme data, domain info | HTML/CSS/JS files | State Manager, Deploy Manager |
| **Deploy Manager** | GitHub repo creation, Vercel deployment, domain connection | Site files, domain | Deployment status + URL | State Manager, Budget Manager |
| **Budget Manager** | Cost tracking, limit enforcement, spend alerts | Transaction records | Budget status, go/no-go decisions | State Manager, all spending components |
| **Network Linker** | Hub-and-spoke topology, prev/next navigation, hub gallery | All site data | Link updates | State Manager, Site Generator |

## Data Flow

### Primary Pipeline (Autonomous Mode)

```
1. Job Scheduler → triggers autonomous run
                ↓
2. Budget Manager → checks remaining budget (go/no-go)
                ↓
3. Meme Scraper → fetches images from sources
                ↓
4. Vision AI Filter → validates each image
                ↓ (passed memes only)
5. State Manager → persists validated memes
                ↓
6. Budget Manager → checks per-domain budget
                ↓
7. Domain Acquirer → searches + purchases domain
                ↓
8. State Manager → records domain purchase
                ↓
9. Site Generator → builds HTML for meme + domain
                ↓
10. Deploy Manager → GitHub push + Vercel deploy
                ↓
11. State Manager → records deployment
                ↓
12. Network Linker → regenerates hub gallery + prev/next links
                ↓
13. Deploy Manager → redeploys affected sites (hub + neighbors)
                ↓
14. State Manager → marks cycle complete
```

### State Database Schema (Logical)

**Tables:**
- `memes` - id, url, source, scraped_at, verified, confidence_score, deployed
- `domains` - id, domain_name, registrar, purchase_date, cost, status (pending/active/failed)
- `sites` - id, meme_id, domain_id, github_repo, vercel_url, deployed_at
- `deployments` - id, site_id, status, deployed_at, error_log
- `budget` - id, month, domain_spend, api_spend, total_spend, limit
- `jobs` - id, job_type, started_at, completed_at, status, error_log
- `network` - id, site_id, prev_site_id, next_site_id, updated_at

### Data Flow Characteristics

**Transactional Boundaries:**
- Domain purchase + DNS config = atomic transaction (rollback if DNS fails)
- Site deployment + network linking = two-phase (deploy first, link after success)
- Budget check + spend = lock-acquire pattern (prevent overspend race conditions)

**Failure Recovery:**
- Scraper failures → log, continue with other sources
- Vision AI failures → retry with backoff, skip after N attempts
- Domain acquisition failures → log, try next meme
- Deployment failures → mark site as failed, alert user, continue
- Network linking failures → non-fatal, retry on next cycle

**Idempotency:**
- Meme scraping → deduplicate by URL hash
- Domain checking → always verify current status before purchase
- Site generation → overwrite existing files (deterministic output)
- Deployment → Vercel handles deploy idempotency
- Network linking → recalculate from database state (no incremental bugs)

## Suggested Build Order

### Phase 1: State Foundation
**Build first:** State Manager + Budget Manager
**Why:** All other components depend on persistent state and cost tracking
**Deliverable:** SQLite database with schema, wrapper API, budget enforcement
**Validation:** Can record transactions, enforce limits, query state

### Phase 2: Content Pipeline
**Build second:** Meme Scraper + Vision AI Filter
**Why:** Need content before testing deployment pipeline
**Deliverable:** Scrape Reddit, validate with Claude/GPT-4V, persist to DB
**Validation:** 100 validated memes in database

### Phase 3: Domain Acquisition
**Build third:** Domain Acquirer (with mock mode)
**Why:** Need domain registration before deployment
**Deliverable:** Registrar API integration + DNS config (test with cheap domain)
**Validation:** Can search, purchase, configure DNS

### Phase 4: Site Generation
**Build fourth:** Site Generator + Network Linker
**Why:** Need HTML before deploying
**Deliverable:** Static site templating, favicon generation, hub gallery
**Validation:** Generate sites locally, verify links

### Phase 5: Deployment
**Build fifth:** Deploy Manager
**Why:** Final step in pipeline
**Deliverable:** GitHub repo creation + Vercel deployment + domain connection
**Validation:** End-to-end deploy of 1 test site

### Phase 6: CLI Orchestration
**Build sixth:** CLI Orchestrator + Job Scheduler
**Why:** Ties everything together
**Deliverable:** CLI commands for manual runs + cron-compatible autonomous mode
**Validation:** `domainweave run --autonomous` completes full cycle

### Phase 7: Network Operations
**Build seventh:** Network Linker enhancements (prev/next navigation)
**Why:** Requires multiple sites to test
**Deliverable:** Sequential linking between sites
**Validation:** Navigate through network using prev/next arrows

### Dependency Graph

```
State Manager ──────────────┐
                            │
Budget Manager ─────────────┼─────────────────────┐
                            │                     │
Meme Scraper ───────────────┤                     │
        │                   │                     │
Vision AI Filter ───────────┤                     │
                            │                     │
Domain Acquirer ────────────┤                     │
                            │                     │
Site Generator ─────────────┤                     │
        │                   │                     │
Network Linker ─────────────┤                     │
        │                   │                     │
Deploy Manager ─────────────┤                     │
                            │                     │
CLI Orchestrator ───────────┴─────────────────────┘
                            │
Job Scheduler ──────────────┘
```

**Critical Path:** State Manager → Budget Manager → (Scraper + Vision AI) → Domain Acquirer → Site Generator → Deploy Manager → CLI Orchestrator

**Parallelizable:** Meme Scraper + Vision AI can be built concurrently with Domain Acquirer (use mock data)

## Patterns to Follow

### Pattern 1: Command Pattern for Operations
**What:** Each operation (scrape, acquire, deploy) is a command object with execute/undo/status
**When:** Operations need retry logic, status tracking, rollback capability
**Example:**
```typescript
interface Command {
  execute(): Promise<Result>;
  canUndo(): boolean;
  undo(): Promise<void>;
  getStatus(): CommandStatus;
}

class AcquireDomainCommand implements Command {
  async execute() {
    // Purchase domain
    // Configure DNS
    // Record in database
  }

  canUndo() { return true; }

  async undo() {
    // Cancel domain (if within window)
    // Refund to budget
  }
}
```

### Pattern 2: Repository Pattern for State
**What:** Abstract database access behind domain-specific repositories
**When:** Multiple components need to query/persist same entities
**Example:**
```typescript
class MemeRepository {
  async findUndeployed(): Promise<Meme[]> { }
  async markDeployed(memeId: string): Promise<void> { }
  async findByUrl(url: string): Promise<Meme | null> { }
}

class DomainRepository {
  async findAvailable(): Promise<Domain[]> { }
  async recordPurchase(domain: Domain): Promise<void> { }
}
```

### Pattern 3: Strategy Pattern for Multi-Source Scraping
**What:** Each scraper source is a strategy implementing common interface
**When:** Need to support multiple meme sources with different APIs
**Example:**
```typescript
interface ScraperStrategy {
  source: string;
  scrape(query: string, limit: number): Promise<RawMeme[]>;
  getRateLimit(): RateLimit;
}

class RedditScraper implements ScraperStrategy {
  source = 'reddit';
  async scrape(query, limit) {
    // Reddit API logic
  }
}

class ScraperOrchestrator {
  strategies: ScraperStrategy[] = [
    new RedditScraper(),
    new ImgurScraper(),
    new GoogleImagesScraper()
  ];

  async scrapeAll(query: string): Promise<RawMeme[]> {
    const results = await Promise.all(
      this.strategies.map(s => s.scrape(query, 50))
    );
    return results.flat();
  }
}
```

### Pattern 4: Circuit Breaker for External APIs
**What:** Stop calling failing APIs temporarily, resume after cooldown
**When:** Calling registrar APIs, vision AI, deployment APIs that may fail/throttle
**Example:**
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure! > this.cooldown) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker open');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }
}
```

### Pattern 5: Event Sourcing for Audit Trail
**What:** Store every state change as an event (for debugging + budget compliance)
**When:** Need to audit why decisions were made, track spending over time
**Example:**
```typescript
interface Event {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
}

class EventStore {
  async append(event: Event): Promise<void> {
    // Insert into events table
  }

  async getEvents(filters: EventFilters): Promise<Event[]> {
    // Query events
  }

  async replayState(entityId: string): Promise<any> {
    const events = await this.getEvents({ entityId });
    return events.reduce((state, event) =>
      applyEvent(state, event), {});
  }
}
```

### Pattern 6: Rate Limiter for API Calls
**What:** Enforce rate limits per API (Reddit 60/min, Vercel 10 deploys/hour)
**When:** Calling any external API with rate limits
**Example:**
```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;

  constructor(
    private maxConcurrent: number,
    private minInterval: number
  ) {}

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.running >= this.maxConcurrent || !this.queue.length) return;

    const fn = this.queue.shift()!;
    this.running++;
    await fn();
    this.running--;

    setTimeout(() => this.processQueue(), this.minInterval);
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Tight Coupling Between Components
**What:** Direct imports and method calls between components (e.g., Scraper directly calls DomainAcquirer)
**Why bad:** Cannot test components independently, cannot replace implementations, changes cascade
**Instead:** Use dependency injection, pass interfaces, communicate via State Manager or event bus

### Anti-Pattern 2: Monolithic Orchestrator
**What:** CLI orchestrator contains all business logic in one massive function
**Why bad:** Untestable, unreadable, cannot reuse logic, hard to add features
**Instead:** Orchestrator delegates to specialized components, each with single responsibility

### Anti-Pattern 3: Synchronous Pipeline
**What:** Wait for each step to complete before starting next (scrape all → validate all → deploy all)
**Why bad:** Slow, wastes time, cannot parallelize independent operations
**Instead:** Stream-based pipeline where validated memes flow into deployment queue immediately

### Anti-Pattern 4: In-Memory State
**What:** Store memes, domains, deployments in JavaScript objects/arrays
**Why bad:** Lost on crash, cannot resume, cannot query efficiently, no audit trail
**Instead:** SQLite for all persistent state, in-memory only for transient working data

### Anti-Pattern 5: Retry Without Backoff
**What:** Immediately retry failed API calls in tight loop
**Why bad:** Amplifies API failures, triggers rate limits, wastes budget on failures
**Instead:** Exponential backoff with jitter, circuit breaker pattern

### Anti-Pattern 6: Hardcoded Configuration
**What:** API keys, URLs, limits embedded in code
**Why bad:** Cannot test with different configs, requires code changes for simple tweaks
**Instead:** Config file (.env or domainweave.config.json) with validation on startup

### Anti-Pattern 7: Silent Failures
**What:** Catch errors but don't log or alert (e.g., `catch (err) { }`)
**Why bad:** Budget wasted on failures, network incomplete, debugging impossible
**Instead:** Log all errors with context, record in database, alert on critical failures

### Anti-Pattern 8: God Object State Manager
**What:** State Manager contains all business logic (validation, linking, budget calculations)
**Why bad:** Violates single responsibility, becomes unmaintainable, hard to test
**Instead:** State Manager is pure data layer, business logic lives in domain-specific components

## Scalability Considerations

| Concern | At 10 Sites | At 100 Sites | At 1000+ Sites |
|---------|-------------|--------------|----------------|
| **Meme Scraping** | Any source works | Rate limit Reddit, diversify sources | Needs distributed scraping or paid APIs |
| **Vision AI Cost** | ~$0.50/batch (50 images) | ~$5/batch | Needs batch API, caching, or self-hosted model |
| **Domain Cost** | ~$10-30/month | ~$100-300/month | Exceeds $50/month cap - needs domain recycling or cheaper TLDs |
| **Vercel Deployments** | Instant | ~10-30 min (rate limits) | Needs deploy batching or alternative hosting |
| **Hub Gallery Page Size** | <100KB | ~500KB | Needs pagination or lazy loading |
| **Database Size** | <1MB | ~10-50MB | Needs indexing, query optimization |
| **Network Linking** | Instant regeneration | ~1-5 sec | Needs incremental linking (only update neighbors) |
| **GitHub Repo Count** | No issue | No issue (unlimited public repos) | No issue |

### Optimization Strategy

**10-100 sites (MVP):** Simple sequential pipeline, full regeneration, no optimization needed

**100-500 sites:**
- Batch deployments (deploy 10 at once, wait for rate limit reset)
- Incremental network linking (only update affected sites)
- Paginate hub gallery (show 50 per page)
- Index database (meme URL, domain status, deployment status)

**500-1000+ sites:**
- Self-hosted vision model to eliminate per-image API cost
- Domain recycling strategy (expire unused domains after 1 year)
- Alternative hosting for static sites (Cloudflare Pages, Netlify)
- Distributed scraping (multiple API keys, proxy rotation)
- Materialized views for hub gallery (pre-generate pages)

### Budget-Constrained Growth Model

At $50/month with $2/domain average:
- **Year 1:** 300 domains ($50/month × 12 months ÷ 2)
- **Year 2:** 300 more domains → 600 total
- **Steady state:** ~25 domains/month sustainable

**Growth implications:**
- Pipeline must handle 25 deploys/month minimum
- Budget tracking must prevent overspend (hard stop at $50)
- Vision API cost must be <$10/month (leaves $40 for domains)
- At 50 images/domain searched × 25 domains = 1250 API calls/month → ~$12.50 cost → within budget

## Component Implementation Order (Detailed)

### Phase 1: State Foundation (Week 1)
**Components:** State Manager, Budget Manager, Database Schema
**Files:**
- `src/state/database.ts` - SQLite connection + migrations
- `src/state/repositories/` - Meme, Domain, Site, Budget repositories
- `src/budget/manager.ts` - Budget checking + enforcement
- `migrations/001_initial_schema.sql` - Database schema

**Success Criteria:**
- Can create database, run migrations
- Can insert/query memes, domains, sites
- Budget manager enforces $50 limit
- Tests cover all repository methods

### Phase 2: Content Pipeline (Week 2)
**Components:** Meme Scraper, Vision AI Filter
**Files:**
- `src/scraper/strategies/reddit.ts` - Reddit scraper
- `src/scraper/strategies/imgur.ts` - Imgur scraper
- `src/scraper/orchestrator.ts` - Multi-source coordination
- `src/vision/filter.ts` - Claude/GPT-4V integration
- `src/vision/prompts.ts` - Vision AI prompts

**Success Criteria:**
- Can scrape 50 memes from Reddit
- Vision AI correctly identifies JD Vance (>80% precision)
- Deduplication prevents duplicate memes
- Rate limiting prevents API throttling

### Phase 3: Domain Acquisition (Week 3)
**Components:** Domain Acquirer
**Files:**
- `src/domain/registrar/cloudflare.ts` - Cloudflare API
- `src/domain/registrar/namecheap.ts` - Namecheap API
- `src/domain/acquirer.ts` - Purchase orchestration
- `src/domain/dns-config.ts` - DNS record management

**Success Criteria:**
- Can search available domains
- Can purchase domain (test with 1 real domain)
- Can configure DNS pointing to Vercel
- Budget manager records domain cost

### Phase 4: Site Generation (Week 4)
**Components:** Site Generator, Network Linker
**Files:**
- `src/generator/templates/` - HTML/CSS templates
- `src/generator/favicon.ts` - SVG favicon generation
- `src/generator/site-builder.ts` - Static site generation
- `src/network/linker.ts` - Hub + spoke linking logic
- `src/network/navigation.ts` - Prev/next calculation

**Success Criteria:**
- Can generate HTML for single meme site
- Can generate hub gallery page
- Favicon SVG renders correctly
- Sites link to hub, hub links to all sites

### Phase 5: Deployment (Week 5)
**Components:** Deploy Manager
**Files:**
- `src/deploy/github.ts` - GitHub repo creation
- `src/deploy/vercel.ts` - Vercel deployment
- `src/deploy/manager.ts` - Deployment orchestration

**Success Criteria:**
- Can create GitHub repo with site files
- Can deploy to Vercel
- Can connect custom domain to deployment
- Deployment status recorded in database

### Phase 6: CLI Orchestration (Week 6)
**Components:** CLI Orchestrator, Job Scheduler
**Files:**
- `src/cli/index.ts` - Commander.js setup
- `src/cli/commands/run.ts` - Manual run command
- `src/cli/commands/autonomous.ts` - Autonomous mode
- `src/scheduler/cron.ts` - Cron-compatible scheduler

**Success Criteria:**
- `domainweave run` completes full pipeline
- `domainweave autonomous` runs on schedule
- CLI outputs progress, errors, budget status
- Exit codes indicate success/failure

### Phase 7: Network Operations (Week 7)
**Components:** Network Linker enhancements
**Files:**
- `src/network/sequential.ts` - Prev/next linking
- `src/network/regenerate.ts` - Incremental updates

**Success Criteria:**
- Prev/next arrows navigate between sites in order
- Adding new site only updates neighbors (not all sites)
- Hub gallery updates when new site added

## Technology Recommendations

### CLI Framework
**Recommended:** Commander.js
**Why:** Mature, simple API, good TypeScript support, git-style subcommands
**Alternative:** Oclif (more complex, overkill for this project)

### Database Access
**Recommended:** better-sqlite3
**Why:** Synchronous API (simpler code), fastest SQLite library, good TypeScript types
**Alternative:** sqlite3 (async, more complex)

### HTTP Client
**Recommended:** node-fetch or native fetch
**Why:** Standard API, simple, works everywhere
**Alternative:** axios (more features, larger dependency)

### Templating
**Recommended:** Plain template literals (no library)
**Why:** Sites are ultra-minimal, no complex logic, zero dependencies
**Alternative:** Handlebars/EJS (overkill, adds build step)

### Rate Limiting
**Recommended:** bottleneck
**Why:** Well-tested, supports concurrent + interval limits, good docs
**Alternative:** p-limit (simpler, less flexible)

### Circuit Breaker
**Recommended:** opossum
**Why:** Production-ready, configurable, good metrics
**Alternative:** cockatiel (newer, less mature)

### Scheduling
**Recommended:** node-cron
**Why:** Simple cron syntax, runs in-process, easy testing
**Alternative:** System cron (less portable, harder to debug)

## File Structure Recommendation

```
domainweave/
├── src/
│   ├── cli/
│   │   ├── index.ts              # Commander.js setup
│   │   └── commands/
│   │       ├── run.ts
│   │       ├── autonomous.ts
│   │       ├── status.ts
│   │       └── config.ts
│   ├── state/
│   │   ├── database.ts           # SQLite connection
│   │   ├── migrations/
│   │   └── repositories/
│   │       ├── meme.ts
│   │       ├── domain.ts
│   │       ├── site.ts
│   │       └── budget.ts
│   ├── budget/
│   │   └── manager.ts
│   ├── scraper/
│   │   ├── orchestrator.ts
│   │   ├── strategies/
│   │   │   ├── reddit.ts
│   │   │   ├── imgur.ts
│   │   │   └── google-images.ts
│   │   └── rate-limiter.ts
│   ├── vision/
│   │   ├── filter.ts
│   │   ├── prompts.ts
│   │   └── circuit-breaker.ts
│   ├── domain/
│   │   ├── acquirer.ts
│   │   ├── registrar/
│   │   │   ├── cloudflare.ts
│   │   │   └── namecheap.ts
│   │   └── dns-config.ts
│   ├── generator/
│   │   ├── site-builder.ts
│   │   ├── templates/
│   │   │   ├── meme-site.ts
│   │   │   └── hub-gallery.ts
│   │   └── favicon.ts
│   ├── deploy/
│   │   ├── manager.ts
│   │   ├── github.ts
│   │   └── vercel.ts
│   ├── network/
│   │   ├── linker.ts
│   │   ├── sequential.ts
│   │   └── regenerate.ts
│   └── scheduler/
│       └── cron.ts
├── migrations/
│   ├── 001_initial_schema.sql
│   └── 002_add_indexes.sql
├── tests/
│   ├── unit/
│   └── integration/
├── config/
│   └── example.env
└── package.json
```

## Risk Mitigation

### Risk 1: Budget Overruns
**Likelihood:** High (API costs unpredictable, rate limits force retries)
**Impact:** High (wasted money, user frustration)
**Mitigation:**
- Pre-flight budget check before every operation
- Separate monthly budget tracking per category (domains, API calls)
- Hard stop at 90% of budget limit
- Alert user when 75% spent

### Risk 2: API Rate Limiting
**Likelihood:** High (Reddit, Vercel have strict limits)
**Impact:** Medium (slows pipeline, may fail deployments)
**Mitigation:**
- Rate limiter on all API clients
- Circuit breaker pattern for repeated failures
- Exponential backoff with jitter
- Batch operations where possible

### Risk 3: Domain Purchase Failures
**Likelihood:** Medium (registrar API flakiness, payment issues)
**Impact:** High (wasted vision API cost, incomplete pipeline)
**Mitigation:**
- Validate domain availability twice before purchase
- Retry with different registrar on failure
- Record failed attempts to avoid re-trying same domain
- Manual import CSV as fallback

### Risk 4: Deployment Failures
**Likelihood:** Medium (GitHub/Vercel API issues, DNS propagation delays)
**Impact:** Medium (domain purchased but site not live)
**Mitigation:**
- Mark deployments as "pending" in database
- Retry failed deployments on next run
- Manual deployment command for debugging
- Verify deployment URL responds before marking complete

### Risk 5: Vision AI False Positives/Negatives
**Likelihood:** Medium (AI not perfect, edge cases exist)
**Impact:** Low (wrong memes deployed, but not breaking)
**Mitigation:**
- Require confidence score >0.8 for auto-approval
- Manual review queue for 0.6-0.8 confidence
- Log all vision API decisions for audit
- User can flag incorrect classifications

### Risk 6: Database Corruption
**Likelihood:** Low (SQLite is robust)
**Impact:** High (lose all state, cannot recover)
**Mitigation:**
- Daily backups via cron
- WAL mode for concurrent access
- Transactions for all multi-step operations
- Export CSV on demand

## Testing Strategy

### Unit Tests
- Repositories (mock database)
- Budget manager (various scenarios)
- Rate limiter (timing + concurrency)
- Circuit breaker (failure scenarios)
- Template generation (output validation)

### Integration Tests
- Scraper → Vision AI → Database (end-to-end content pipeline)
- Domain search → Purchase → DNS config (with test registrar)
- Site generation → GitHub → Vercel (with test domain)
- Full pipeline (scrape → acquire → deploy → link)

### Mock Data
- Sample memes for testing without API calls
- Mock registrar for testing domain logic without spending
- Mock Vercel API for testing deployments

### Manual Testing Checklist
- [ ] Full autonomous run completes successfully
- [ ] Budget enforcement stops at $50
- [ ] Rate limiting prevents API throttling
- [ ] Deployment failures are retried
- [ ] Hub gallery shows all sites
- [ ] Prev/next navigation works
- [ ] Favicon renders correctly
- [ ] Custom domain resolves to site

## Configuration Management

### Environment Variables

```bash
# .env
DATABASE_PATH=./domainweave.db
BUDGET_LIMIT_MONTHLY=50
BUDGET_ALERT_THRESHOLD=0.75

# Scraper APIs
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
IMGUR_CLIENT_ID=xxx
GOOGLE_CUSTOM_SEARCH_KEY=xxx
GOOGLE_SEARCH_ENGINE_ID=xxx

# Vision AI
CLAUDE_API_KEY=xxx
OPENAI_API_KEY=xxx
VISION_MODEL=claude-3-5-sonnet-20241022

# Domain Registrars
CLOUDFLARE_API_TOKEN=xxx
NAMECHEAP_API_KEY=xxx
NAMECHEAP_USERNAME=xxx

# Deployment
GITHUB_TOKEN=xxx
GITHUB_USERNAME=gtdrag
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx

# Rate Limits
REDDIT_REQUESTS_PER_MINUTE=60
VERCEL_DEPLOYS_PER_HOUR=10
VISION_API_REQUESTS_PER_MINUTE=50
```

### Runtime Config

```typescript
// config/runtime.ts
export interface Config {
  database: {
    path: string;
    backupInterval: number;
  };
  budget: {
    monthlyLimit: number;
    alertThreshold: number;
    perDomainMax: number;
  };
  scraper: {
    sources: string[];
    memesPerSource: number;
    timeout: number;
  };
  vision: {
    model: string;
    confidenceThreshold: number;
    batchSize: number;
  };
  domain: {
    preferredTlds: string[];
    maxRetries: number;
  };
  deploy: {
    maxConcurrent: number;
    timeout: number;
  };
  scheduler: {
    cronExpression: string;
    timezone: string;
  };
}
```

## Sources

**Note:** Web search and Context7 tools were unavailable during this research. This architecture is based on established patterns from training data (knowledge cutoff: January 2025) for:

- CLI orchestration patterns (Commander.js, Oclif)
- Scraping architectures (rate limiting, deduplication)
- State management for autonomous systems (SQLite, event sourcing)
- Multi-service deployment pipelines (GitHub Actions, Vercel API)
- Circuit breaker and retry patterns (opossum, exponential backoff)

**Confidence Level:** MEDIUM - Architecture patterns are well-established and stable, but specific library versions and 2026 best practices could not be verified with current sources.

**Verification Needed:**
- Current best practices for CLI tools in 2026
- Latest Vercel API rate limits and deployment patterns
- Current Reddit API terms and rate limits
- Cloudflare Registrar API documentation (current version)
- Vision AI (Claude/GPT-4V) pricing and batch API availability

**Recommendation:** Before implementation, verify current API documentation for all external services (Reddit, Vercel, registrars, vision AI providers).
