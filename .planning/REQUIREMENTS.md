# Requirements: Domainweave

**Defined:** 2026-03-02
**Core Value:** Turn on the system, give it a budget, and it autonomously grows a network of JD Vance meme sites across the internet with zero manual intervention.

## v1 Requirements

### CLI Foundation

- [ ] **CLI-01**: User can run `domainweave init` to create config file and SQLite database
- [ ] **CLI-02**: User can run `domainweave run` to execute full pipeline (scrape → verify → acquire → deploy → link)
- [ ] **CLI-03**: User can run `domainweave run --dry-run` to preview actions without executing
- [ ] **CLI-04**: User can run `domainweave status` to see network stats (sites, memes, domains, spend)
- [ ] **CLI-05**: User can run `domainweave budget` to see spending breakdown by category
- [ ] **CLI-06**: All operations log to stdout with configurable verbosity levels
- [ ] **CLI-07**: Config stored in `config.json` with registrar keys, Vercel token, budget caps, scraping prefs

### Content Pipeline

- [ ] **CONT-01**: System scrapes JD Vance memes from Reddit (r/PoliticalHumor, r/memes, etc.)
- [ ] **CONT-02**: System scrapes JD Vance memes from Google Custom Search API
- [ ] **CONT-03**: System scrapes JD Vance memes from Imgur
- [ ] **CONT-04**: System scrapes JD Vance memes from Twitter/X
- [ ] **CONT-05**: System passes each scraped image through Claude Vision API to verify it is a JD Vance meme
- [ ] **CONT-06**: Vision AI distinguishes memes from news photos, other people, and non-meme content
- [ ] **CONT-07**: System deduplicates images (perceptual hash) to avoid deploying the same meme twice
- [ ] **CONT-08**: Verified memes stored locally with metadata (source URL, date scraped, confidence score)

### Domain Acquisition

- [ ] **DOM-01**: User can run `domainweave ingest domains.csv` to import owned domains
- [ ] **DOM-02**: System auto-acquires cheap domains via Cloudflare Registrar API
- [ ] **DOM-03**: System filters domains by price ceiling (configurable, default $2/year)
- [ ] **DOM-04**: System auto-configures DNS records pointing acquired domains to Vercel
- [ ] **DOM-05**: System tracks domain registration costs and projected renewal costs
- [ ] **DOM-06**: System stops acquisitions when monthly budget cap is reached

### Deployment

- [ ] **DEPL-01**: System creates a GitHub repo per site (via Octokit)
- [ ] **DEPL-02**: System generates static HTML per site: one meme image + source attribution + date + share button + navigation
- [ ] **DEPL-03**: System deploys each site to Vercel and connects custom domain
- [ ] **DEPL-04**: System generates SVG favicon from domain initials for each site
- [ ] **DEPL-05**: System verifies deployment success (HTTP 200 check)
- [ ] **DEPL-06**: Sites use dark minimal aesthetic with fade-in animation (matching vance.digital)
- [ ] **DEPL-07**: System rate-limits deployments to avoid Vercel/GitHub API throttling

### Network

- [ ] **NET-01**: vance.digital serves as hub site showing gallery of all memes with links to each domain
- [ ] **NET-02**: Every spoke site links back to the hub (vance.digital)
- [ ] **NET-03**: Sequential prev/next navigation arrows link neighboring sites
- [ ] **NET-04**: Hub site auto-regenerates and redeploys when new sites are added to the network
- [ ] **NET-05**: Each site has a share button (copy link to clipboard)

### Budget & State

- [ ] **BUDG-01**: SQLite database tracks all domains, memes, deployments, and spending
- [ ] **BUDG-02**: Monthly spending cap enforced across all categories (domains, API calls)
- [ ] **BUDG-03**: System alerts when spending reaches 80% of monthly cap
- [ ] **BUDG-04**: Domain renewal costs tracked and projected for budget planning

### Automation

- [ ] **AUTO-01**: CLI designed as one-shot command compatible with system cron
- [ ] **AUTO-02**: Autonomous mode: scrape → verify → acquire → deploy → link in a single run
- [ ] **AUTO-03**: System handles errors gracefully (failed deploys, API timeouts) without crashing the run
- [ ] **AUTO-04**: System resumes from last successful state on next run (idempotent)

## v2 Requirements

### Content Expansion

- **CONT-V2-01**: Additional meme sources (TikTok screenshots, Facebook, meme generators)
- **CONT-V2-02**: Content quality scoring (funnier memes ranked higher)
- **CONT-V2-03**: AI-generated captions or commentary per meme

### Domain Strategy

- **DOM-V2-01**: Multi-registrar support (Namecheap, Porkbun as fallbacks)
- **DOM-V2-02**: Expired domain hunting for domains with existing backlinks
- **DOM-V2-03**: Domain name generation based on meme content

### Network Growth

- **NET-V2-01**: Analytics per site (view counts via simple pixel tracker)
- **NET-V2-02**: Sitemap generation for each site
- **NET-V2-03**: Social media auto-posting when new sites deploy

## Out of Scope

| Feature | Reason |
|---------|--------|
| SEO optimization / keyword stuffing | Not gaming search engines, just claiming real estate |
| User accounts / authentication | Static sites only |
| CMS / admin panel | CLI-managed, no web admin |
| Mobile app | Web only |
| Monetization (ads, affiliate) | Pure meme network, no revenue intent |
| Dynamic server-side content | Static HTML only for simplicity and zero hosting cost |
| Content moderation / reporting | No user-generated content |
| Multiple content types | JD Vance memes only for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | — | Pending |
| CLI-02 | — | Pending |
| CLI-03 | — | Pending |
| CLI-04 | — | Pending |
| CLI-05 | — | Pending |
| CLI-06 | — | Pending |
| CLI-07 | — | Pending |
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| CONT-05 | — | Pending |
| CONT-06 | — | Pending |
| CONT-07 | — | Pending |
| CONT-08 | — | Pending |
| DOM-01 | — | Pending |
| DOM-02 | — | Pending |
| DOM-03 | — | Pending |
| DOM-04 | — | Pending |
| DOM-05 | — | Pending |
| DOM-06 | — | Pending |
| DEPL-01 | — | Pending |
| DEPL-02 | — | Pending |
| DEPL-03 | — | Pending |
| DEPL-04 | — | Pending |
| DEPL-05 | — | Pending |
| DEPL-06 | — | Pending |
| DEPL-07 | — | Pending |
| NET-01 | — | Pending |
| NET-02 | — | Pending |
| NET-03 | — | Pending |
| NET-04 | — | Pending |
| NET-05 | — | Pending |
| BUDG-01 | — | Pending |
| BUDG-02 | — | Pending |
| BUDG-03 | — | Pending |
| BUDG-04 | — | Pending |
| AUTO-01 | — | Pending |
| AUTO-02 | — | Pending |
| AUTO-03 | — | Pending |
| AUTO-04 | — | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 0
- Unmapped: 40 ⚠️

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after initial definition*
