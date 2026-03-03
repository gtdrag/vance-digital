# Project Research Summary

**Project:** Domainweave (Autonomous Meme-Site Network Generator)
**Domain:** Autonomous CLI orchestrator with web scraping, AI verification, domain management, and site network deployment
**Researched:** 2026-03-02
**Confidence:** MEDIUM

## Executive Summary

Domainweave is an autonomous CLI tool that scrapes meme images of JD Vance from multiple sources, verifies content using vision AI, acquires domains through registrar APIs, generates static microsites, and deploys them to create an interconnected network. The research reveals this is a multi-system orchestration challenge requiring careful budget management, rate-limit handling, and state persistence.

The recommended approach uses Commander.js for CLI scaffolding, Playwright for JavaScript-rendered scraping, Claude Vision API for image verification, Cloudflare for domain registration (at-cost pricing), better-sqlite3 for state tracking, and GitHub + Vercel for deployment. The architecture should follow a command pattern with component isolation, repository pattern for state management, and circuit breaker patterns for external APIs. The system must be designed as a one-shot command invoked by system cron rather than a long-running daemon.

Critical risks include Reddit OAuth token expiry causing silent failures, Google Custom Search API costs spiraling beyond budget, vision AI false positives wasting domain purchases, Vercel project limits blocking network growth, domain renewal costs exceeding year-one acquisition costs by 5-10x, and SEO penalties from link farm patterns. Mitigation requires OAuth refresh flows from day one, strict API call counting, multi-pass vision verification, quota monitoring, renewal-cost budgeting, and nofollow tags on internal links.

## Key Findings

### Recommended Stack

The research identified a modern Node.js ecosystem as optimal for this CLI automation tool. Commander.js provides industry-standard CLI parsing, Playwright handles JavaScript-rendered meme sources (Reddit, Imgur), and Claude Vision API offers the best cost-performance for political figure identification at ~$0.015/image. Cloudflare Registrar provides at-cost domain pricing ($1.50-3/year for .xyz/.site TLDs with no markup), while better-sqlite3 + kysely deliver type-safe, zero-config state persistence. Vercel's GitHub integration enables automatic deployments without custom CI/CD.

**Core technologies:**
- **Commander.js + chalk + ora**: CLI framework with colored output and progress indicators — industry standard, stable API
- **Playwright**: Headless browser for scraping JavaScript-rendered content — superior to Puppeteer for 2025+, critical for Reddit/Imgur
- **Anthropic SDK (Claude Vision)**: Image verification and meme identification — excellent at distinguishing memes from news photos, ~$0.015/image
- **Cloudflare API**: Domain registration and DNS — best pricing with no markup, automatic DNS configuration
- **better-sqlite3 + kysely**: State persistence and budget tracking — fastest SQLite driver with type-safe queries, perfect for CLI
- **Octokit + simple-git**: GitHub automation — official REST API client for repo creation and management
- **Vercel CLI**: Deployment orchestration — GitHub integration triggers automatic builds, CLI manages domains

**Critical version notes:** All version numbers are based on January 2025 training data and must be verified via npm registry before implementation. Playwright ^1.40+, Anthropic SDK ^0.30+, Octokit ^20.x, better-sqlite3 ^11.x, Node.js v22.x LTS required.

**Key architectural decisions:**
- System cron over node-cron daemon: more reliable, easier debugging, no memory leaks
- better-sqlite3 over Prisma: faster startup, no migrations overhead, perfect for CLI
- Cloudflare over other registrars: at-cost pricing critical for $50/month budget constraint
- Claude Vision primary, GPT-4V fallback: superior political figure identification, redundancy for API failures

### Expected Features

The research categorized features into table stakes, differentiators, and anti-features. The core pipeline (scrape → verify → acquire → deploy) is table stakes, while autonomous mode, multi-source scraping, hub-and-spoke network topology, and vision AI verification are key differentiators. Anti-features to explicitly avoid include SEO optimization (attracts wrong attention), CMS/admin panels (scope creep), monetization (corrupts mission), and dynamic content (defeats static site value proposition).

**Must have (table stakes):**
- CLI interface with dry-run mode — standard for automation tools, scriptable
- Budget management with hard caps — prevent runaway spending on domains/APIs
- State persistence and resume capability — recover from failures without repeating work
- Content deduplication — prevent wasting budget on duplicate memes
- Domain availability checking — verify purchasability before attempting
- DNS configuration automation — point domains to hosting automatically
- Deployment verification — confirm sites are live before marking complete
- Retry logic with exponential backoff — network failures are expected
- List/inventory commands — view current state (domains, sites, memes)

**Should have (competitive):**
- Vision AI content verification — core differentiator ensuring quality
- Multi-source scraping (Reddit, Imgur, Google Images) — cast wide net
- Autonomous mode (cron-friendly) — zero-touch growth over time
- Hub-and-spoke network topology — central gallery creates discoverability
- Sequential navigation (prev/next) — browsing flow across network
- Source attribution — credit original posters with links
- Webhook notifications — alert on milestones (budget thresholds, deployments)
- Spend analytics — cost tracking and ROI visibility

**Defer (v2+):**
- Content quality scoring — ML-based prioritization is high complexity
- Network graph visualization — nice-to-have, not critical for MVP
- Auto-generated favicons — aesthetic enhancement, not functional requirement
- Export/backup functionality — operational convenience, not launch blocker

**Anti-features (explicitly avoid):**
- SEO optimization — attracts spam attention, not the goal
- User authentication on sites — adds complexity, defeats static site value
- CMS/admin panel — scope creep, use CLI instead
- Monetization (ads/affiliate) — corrupts pure meme mission
- Dynamic content — requires servers, increases cost

### Architecture Approach

The architecture follows a modular orchestrator pattern with specialized components communicating through a state manager. The CLI orchestrator delegates to independent components (Meme Scraper, Vision AI Filter, Domain Acquirer, Site Generator, Deploy Manager, Budget Manager, Network Linker) that interact only through the State Manager (SQLite database). This enables component isolation, independent testing, and clear failure boundaries. The system operates as a one-shot command (triggered by system cron) rather than a long-running daemon.

**Major components:**
1. **State Manager** — SQLite database abstraction with repository pattern; handles all persistence, ACID transactions, and query interface
2. **Meme Scraper** — Multi-source strategy pattern (Reddit/Imgur/Google); handles rate limiting, deduplication, API authentication
3. **Vision AI Filter** — Claude/GPT-4V integration with circuit breaker pattern; validates meme content before domain purchase
4. **Domain Acquirer** — Registrar API adapters (Cloudflare/Namecheap/Porkbun); handles domain search, purchase, DNS configuration
5. **Site Generator** — Template-based HTML generation; favicon creation, hub gallery, prev/next navigation logic
6. **Deploy Manager** — GitHub repo creation + Vercel deployment; handles custom domain connection and deployment verification
7. **Budget Manager** — Cost tracking and enforcement; atomic operations prevent overspend race conditions
8. **Network Linker** — Hub-and-spoke topology + sequential navigation; incremental updates for efficiency

**Key patterns to follow:**
- Command pattern for operations (execute/undo/status for rollback capability)
- Repository pattern for state access (abstract database behind domain repositories)
- Strategy pattern for multi-source scraping (pluggable scrapers with common interface)
- Circuit breaker for external APIs (prevent cascading failures)
- Rate limiter with backoff (respect API limits, handle throttling)

**Critical data flows:**
- Budget check → scrape → verify → check budget → acquire domain → generate site → deploy → link network → verify deployment
- Transactional boundaries: domain purchase + DNS = atomic; site deployment + network linking = two-phase
- Idempotency: scraping deduplicates by URL hash, deployments are deterministic, network linking recalculates from database state

### Critical Pitfalls

The research identified 20+ pitfalls with 10 classified as critical. The most dangerous are silent authentication failures (Reddit OAuth expiry), runaway API costs (Google Search, Vision AI), false positives from AI creating wrong-content sites, platform limits blocking scale (Vercel projects, GitHub rate limits), domain renewal cost shock (5-10x higher than first year), and SEO spam penalties from dense link graphs.

1. **Reddit OAuth token expiry** — tokens expire after 60-90 minutes causing silent failures in autonomous mode. Implement refresh token flow from day one, log auth status separately, test token renewal before any automation.

2. **Google Custom Search cost explosion** — free tier is 100 queries/day, then $5 per 1,000 queries. Track API calls in SQLite, hard stop at 90/day, cache queries, consider Bing Search API (3,000 free/month) or SerpAPI alternatives.

3. **Vision AI false positives** — AI may misidentify images or block political content due to safety filters. Use multi-pass verification (2-3 checks with different prompts), implement human review queue for low confidence, test both Claude and GPT-4V before launch, include text extraction to verify context.

4. **Vercel project limit exhaustion** — free tier limits projects per account (~100-200). Each microsite = one project. Check quota before deployment, track in database, consider Vercel Pro ($20/month) or alternative architectures (single project with dynamic routing) or Cloudflare Pages (25,000 limit).

5. **Domain renewal cost death spiral** — .xyz/.site/.online TLDs have $1-3 first-year pricing but renew at $8-12. Budget for renewal price (not just acquisition), use Cloudflare (consistent pricing), limit domain count to fit renewal budget, model 3-year costs before any acquisitions.

6. **SEO link farm penalties** — hub-and-spoke + sequential navigation creates dense link graph that matches spam patterns. Add rel="nofollow noopener" to all internal network links before network exceeds 10 sites, implement robots.txt, include "this is a meme network" disclosure, avoid anchor text optimization.

7. **Domain registrar API approval delays** — Cloudflare, Namecheap, Porkbun require manual approval for API access (3-7 business days). Apply for API access FIRST before writing any code, apply to 2-3 registrars in parallel, provide clear use case, have payment method on file.

8. **GitHub API rate limits** — repo creation limited to ~20-30/hour. Throttle to 15 repos/hour maximum, check X-RateLimit-Remaining header, implement exponential backoff on 403 errors, use SQLite queue for pending deployments.

9. **WHOIS privacy auto-renewal failures** — privacy costs $0.50-2/year extra, payment failures expose personal info. Budget for privacy in cost calculations, enable auto-renewal, use dedicated email for registrations, prefer registrars with free privacy (Cloudflare, Porkbun).

10. **Imgur API TOS violations** — terms prohibit bulk downloading and republishing. Read API TOS for all sources (Reddit, Google, Imgur, Twitter/X), prefer Reddit API (more permissive), include source attribution, consider linking vs re-hosting, document fair use checklist.

## Implications for Roadmap

Based on research, the roadmap should follow a dependency-driven build order that derisks critical integrations early. The architecture suggests 6-7 phases with clear validation gates. Components with external dependencies (authentication, APIs, budget tracking) must be built first. The hub-and-spoke linking should be deferred until multiple sites exist to test navigation.

### Phase 1: State Foundation & Budget Control
**Rationale:** All other components depend on persistent state and cost tracking. Budget enforcement must be rock-solid before spending real money on domains or APIs.

**Delivers:** SQLite database with schema (memes, domains, sites, deployments, budget tables), repository pattern implementation, budget manager with atomic operations, CLI scaffold with Commander.js

**Addresses:** State persistence (table stakes), budget management (table stakes), configuration file (table stakes)

**Avoids:** Budget tracking race conditions (Pitfall #13), database corruption (Pitfall #6 risk)

**Research flags:** Standard patterns, skip research-phase. SQLite + kysely is well-documented, budget enforcement is straightforward state management.

### Phase 2: Content Pipeline (Scraping + Verification)
**Rationale:** Need validated content before testing domain acquisition or deployment. Vision AI verification is a core differentiator that must be proven early. Deduplication prevents wasted budget on duplicate analysis.

**Delivers:** Reddit scraper with OAuth refresh token flow, vision AI integration (Claude primary, GPT-4V fallback), perceptual hashing for deduplication, rate limiting and circuit breaker patterns, content stored in SQLite

**Addresses:** Multi-source scraping (differentiator), vision AI verification (differentiator), content deduplication (table stakes), retry logic (table stakes)

**Avoids:** Reddit OAuth expiry (Pitfall #1 - CRITICAL), vision AI false positives (Pitfall #3 - CRITICAL), vision AI cost explosion from duplicates (Pitfall #14), Imgur TOS violations (Pitfall #10 - CRITICAL)

**Research flags:** NEEDS RESEARCH-PHASE. Vision AI prompt engineering for political figure identification is niche. Must test Claude and GPT-4V content policies with JD Vance images. Reddit OAuth refresh flow is standard but critical.

### Phase 3: Domain Acquisition (Manual Import First)
**Rationale:** Domain acquisition is high-risk (real money spent). Start with manual CSV import to test site generation and deployment without spending. Then add registrar API integration with mock mode. Validate renewal pricing before any automatic purchases.

**Delivers:** Manual domain import via CSV (no API needed), domain availability checker, Cloudflare API integration with test domain purchase, DNS configuration automation, registrar API adapter pattern (support multiple registrars)

**Addresses:** Domain availability checking (table stakes), DNS configuration (table stakes), manual overrides (table stakes)

**Avoids:** Domain registrar API approval delays (Pitfall #5 - CRITICAL), domain renewal cost shock (Pitfall #7 - CRITICAL), WHOIS privacy loss (Pitfall #6), transfer lock (Pitfall #16)

**Research flags:** NEEDS RESEARCH-PHASE. Registrar API specifics (Cloudflare vs Namecheap vs Porkbun) require current documentation. Renewal pricing must be verified. DNS configuration patterns are registrar-specific.

### Phase 4: Site Generation & Single Site Deployment
**Rationale:** Generate static HTML and prove deployment pipeline works end-to-end with one test site before scaling. Validate GitHub + Vercel integration, custom domain connection, and deployment verification.

**Delivers:** HTML template system (plain template literals, no library), favicon generation (SVG), site builder for single meme sites, GitHub repo creation (Octokit), Vercel deployment via GitHub integration, custom domain connection, deployment verification

**Addresses:** Static site generation (table stakes), deployment verification (table stakes), aesthetic consistency (differentiator), source attribution (differentiator)

**Avoids:** Vercel function timeout (Pitfall #15), favicon filename conflicts (Pitfall #17), GitHub repo name collisions (Pitfall #19), DNS propagation delays (Pitfall #12)

**Research flags:** Standard patterns, skip research-phase. Static site generation with templates is straightforward. GitHub + Vercel deployment is well-documented (already used for vance.digital).

### Phase 5: Network Topology (Hub + Sequential Nav)
**Rationale:** Requires multiple sites to test hub gallery and prev/next navigation. Hub-and-spoke topology and sequential navigation are key differentiators but only work with 3+ sites deployed.

**Delivers:** Hub gallery generation at vance.digital, hub-and-spoke bidirectional linking, sequential prev/next navigation, incremental network updates (only regenerate affected sites), nofollow tags on internal links

**Addresses:** Hub-and-spoke topology (differentiator), sequential navigation (differentiator)

**Avoids:** SEO link farm penalties (Pitfall #9 - CRITICAL), link rot (Pitfall #18)

**Research flags:** Standard patterns, skip research-phase. Link generation is straightforward, nofollow implementation is well-documented.

### Phase 6: Autonomous Mode & Multi-Source Scraping
**Rationale:** Once core pipeline works (scrape → verify → acquire → deploy → link), add cron compatibility and expand to additional scraper sources (Imgur, Google Images). This is where the system becomes truly autonomous.

**Delivers:** CLI autonomous command (one-shot, cron-compatible), system cron integration (not node-cron daemon), Imgur scraper strategy, Google Images scraper (with query counting), comprehensive logging and error handling, webhook notifications (Slack/Discord/email)

**Addresses:** Autonomous mode (differentiator), multi-source scraping (differentiator), status/progress logging (table stakes), webhook notifications (differentiator)

**Avoids:** Google API cost explosion (Pitfall #2 - CRITICAL), silent cron failures (Pitfall #20), timezone confusion (Pitfall #20)

**Research flags:** NEEDS RESEARCH-PHASE. Google Custom Search API current pricing/limits must be verified. Imgur API terms and rate limits need review. System cron configuration is platform-specific.

### Phase 7: Polish & Operational Features
**Rationale:** System is functional, now add operational convenience features like rollback, spend analytics, and improved CLI UX.

**Delivers:** Rollback capability (delete repos, remove DNS, mark domains unused), spend analytics dashboard (cost per domain, API trends), list/inventory commands (list-domains, list-sites, list-memes), manual override commands, export/backup functionality

**Addresses:** Rollback capability (table stakes), spend analytics (differentiator), list/inventory (table stakes), manual overrides (table stakes)

**Avoids:** N/A (polish phase, no critical pitfalls introduced)

**Research flags:** Standard patterns, skip research-phase. CRUD operations and analytics queries are straightforward.

### Phase Ordering Rationale

- **Phase 1 first:** State management and budget tracking are foundational. No other work can proceed safely without these.
- **Phase 2 before Phase 3:** Must prove content verification works before spending money on domains. Vision AI false positives are expensive mistakes.
- **Phase 3 split (manual → API):** Manual import allows testing deployment without registrar API approval delays or spending. Proves site generation works before risking real money.
- **Phase 4 before Phase 5:** Must have deployed sites before testing network linking. Hub gallery needs content to display.
- **Phase 6 deferred:** Autonomous mode only valuable once core pipeline is proven reliable. Cron automation magnifies failures if pipeline is buggy.
- **Phase 7 last:** Operational niceties only matter once system is functional and generating value.

**Dependency graph:**
```
Phase 1 (State) → Phase 2 (Content) → Phase 3 (Domains) → Phase 4 (Deploy) → Phase 5 (Network) → Phase 6 (Autonomous) → Phase 7 (Polish)
                                                              ↓
                                        Budget Manager (always consulted)
```

**Critical path validation:**
- Phase 2 must complete before Phase 3 (don't buy domains for unverified content)
- Phase 4 must complete before Phase 5 (can't link sites that don't exist)
- Phase 6 must wait for Phase 5 (autonomous mode needs full pipeline working)

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2 (Content Pipeline):** Vision AI prompt engineering for political figure identification is niche. Must test Claude Vision API and GPT-4V with actual JD Vance images to validate identification accuracy and check content policy restrictions. Reddit OAuth2 refresh token flow is critical and must be implemented correctly from day one.

- **Phase 3 (Domain Acquisition):** Registrar API specifics vary significantly. Need current documentation for Cloudflare Registrar API (domain search, purchase, DNS), Namecheap API, and Porkbun API. Must verify renewal pricing for target TLDs (.xyz, .site, .online) as this impacts budget modeling. DNS configuration patterns differ by registrar.

- **Phase 6 (Autonomous Mode):** Google Custom Search API current pricing, rate limits, and free tier quota (is 100/day still valid in 2026?) must be verified. Imgur API terms of service review required (bulk scraping policies). System cron configuration is platform-specific (Linux vs macOS).

Phases with standard patterns (skip research-phase):

- **Phase 1 (State Foundation):** SQLite with better-sqlite3 is well-documented. Budget tracking is standard state management. Commander.js CLI patterns are mature.

- **Phase 4 (Site Generation & Deployment):** Static site generation with template literals is straightforward. GitHub + Vercel deployment pipeline already proven with vance.digital. Octokit and Vercel CLI documentation is comprehensive.

- **Phase 5 (Network Topology):** Link generation and nofollow implementation are well-documented. Hub gallery is standard list rendering.

- **Phase 7 (Polish):** CRUD operations for rollback and inventory are standard database operations. Analytics queries are straightforward aggregations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Technologies are mature and stable, but version numbers based on January 2025 data must be verified. Playwright, Anthropic SDK, Octokit versions need npm registry check. |
| Features | HIGH | Feature categorization based on established patterns in CLI automation tools and domain management systems. MVP scope is well-defined. |
| Architecture | HIGH | Component boundaries, patterns (command, repository, strategy, circuit breaker), and build order follow proven practices. SQLite for state, system cron for scheduling are battle-tested choices. |
| Pitfalls | MEDIUM | Critical pitfalls (OAuth expiry, API costs, rate limits, renewal pricing) are well-documented failure modes, but specific 2026 values (Vercel project limits, Google API costs, Reddit rate limits) need verification. |

**Overall confidence:** MEDIUM

The research provides a solid foundation for roadmap creation with clear recommendations and risk mitigation strategies. The architecture patterns and component boundaries are based on established best practices. However, several critical dependencies require verification:

### Gaps to Address

These gaps must be resolved during phase planning or before implementation:

- **Vision AI political content policies (2026):** Claude and GPT-4V safety filters may block political figure analysis. Must test with actual JD Vance images before Phase 2. If blocked, may need alternative verification approach (Microsoft Azure Vision, Google Cloud Vision, or self-hosted model).

- **Vercel project limits (current):** Historical data suggests 100-200 projects per free tier account, but this changes. Must verify via Vercel dashboard or support. If limit is low (<100), may need alternative architecture (single project with dynamic routing) or upgrade to Pro plan ($20/month).

- **Domain renewal pricing (2026):** TLD renewal rates fluctuate. Must check Cloudflare, Namecheap, Porkbun pricing pages for .xyz, .site, .online domains before budgeting. Difference between acquisition and renewal pricing is critical for long-term budget modeling.

- **Google Custom Search API pricing/limits (current):** Training data shows 100 queries/day free, then $5/1000 queries, but this may have changed. Verify with Google Cloud Platform documentation. If costs too high, pivot to Bing Search API (3,000 free/month) or SerpAPI.

- **Registrar API approval timelines:** Cloudflare, Namecheap, Porkbun require manual review for API access. Apply immediately (before Phase 3) to avoid blocking development. Approval can take 3-7 days. Have backup plan (manual CSV import) if denied.

- **Reddit API rate limits (2026):** OAuth2 flow and rate limits are well-documented historically but may have changed. Verify current limits in official Reddit API docs before Phase 2. Critical for autonomous mode viability.

**Validation strategy:** Create pre-phase checklists for phases requiring verification (Phase 2, 3, 6). Each checklist must confirm current API documentation, test critical integrations with real APIs, and validate cost assumptions before proceeding.

## Sources

### Research Constraints

**IMPORTANT:** This research was conducted without access to Context7, WebSearch, or Brave API. All recommendations are based on training data (knowledge cutoff: January 2025) and should be validated against current 2026 documentation before implementation.

### Primary (HIGH confidence)

Training data covering:
- CLI framework patterns (Commander.js, oclif, Inquirer/Enquirer)
- Web scraping architectures (Playwright, Puppeteer, rate limiting, deduplication)
- SQLite best practices (better-sqlite3, kysely, WAL mode, transactions)
- GitHub API documentation (Octokit, rate limiting, repo creation)
- Vercel platform patterns (CLI, GitHub integration, custom domains)
- Domain registration patterns (Cloudflare, Namecheap, Porkbun)
- OAuth2 authentication flows (Reddit API specifics)

### Secondary (MEDIUM confidence)

Training data covering:
- Vision AI capabilities (Claude 3.5 Sonnet/Opus, GPT-4V) for image classification
- Vision API pricing estimates (~$0.015-0.04 per image)
- Domain pricing patterns (.xyz, .site, .online TLDs)
- ICANN domain policies (60-day transfer lock, WHOIS privacy)
- SEO link farm detection patterns (Google Webmaster guidelines)

### Tertiary (LOW confidence - needs validation)

Training data from January 2025:
- Specific version numbers (Playwright ^1.40+, Anthropic SDK ^0.30+, etc.)
- Vercel project limits (~100-200 for free tier)
- Google Custom Search API quotas (100 queries/day free)
- Reddit API rate limits (60 requests/minute)
- GitHub repo creation limits (~20-30/hour)

**Verification required before implementation:**
- npm registry for all package versions (Playwright, Anthropic SDK, Octokit, better-sqlite3, etc.)
- Vercel project limits (check dashboard or contact support)
- Google Custom Search API current pricing and quotas
- Reddit API current rate limits and OAuth2 flows
- Vision API (Claude, GPT-4V) pricing for 2026
- Registrar API documentation (Cloudflare, Namecheap, Porkbun)
- Domain renewal pricing for target TLDs (.xyz, .site, .online)

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*
