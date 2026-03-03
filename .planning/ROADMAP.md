# Roadmap: Domainweave

**Project:** Autonomous CLI tool that grows a network of JD Vance meme microsites
**Core Value:** Turn on the system, give it a budget, and it autonomously grows across the internet with zero manual intervention
**Depth:** Standard (5-8 phases)
**Created:** 2026-03-02

## Phases

- [ ] **Phase 1: State Foundation & CLI Scaffold** - Database, budget tracking, and CLI interface
- [ ] **Phase 2: Content Pipeline** - Scraping, vision AI verification, deduplication
- [ ] **Phase 3: Domain Management** - Manual import and automated domain acquisition
- [ ] **Phase 4: Site Generation & Deployment** - HTML generation, GitHub repos, Vercel deployment
- [ ] **Phase 5: Network Topology** - Hub gallery, hub-and-spoke linking, sequential navigation
- [ ] **Phase 6: Autonomous Mode** - Cron-compatible orchestration and error handling

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. State Foundation & CLI Scaffold | 0/0 | Not started | - |
| 2. Content Pipeline | 0/0 | Not started | - |
| 3. Domain Management | 0/0 | Not started | - |
| 4. Site Generation & Deployment | 0/0 | Not started | - |
| 5. Network Topology | 0/0 | Not started | - |
| 6. Autonomous Mode | 0/0 | Not started | - |

## Phase Details

### Phase 1: State Foundation & CLI Scaffold

**Goal:** User can initialize the system, view status, and track budget without executing any external actions

**Depends on:** Nothing (foundation phase)

**Requirements:** CLI-01, CLI-04, CLI-05, CLI-06, CLI-07, BUDG-01, BUDG-02, BUDG-03, BUDG-04

**Success Criteria** (what must be TRUE):
1. User can run `domainweave init` and get a working config.json and SQLite database created
2. User can run `domainweave status` and see network stats (0 sites, 0 memes, 0 domains, $0 spent)
3. User can run `domainweave budget` and see spending breakdown with monthly cap configured
4. System logs all operations to stdout with timestamps and severity levels
5. Config file contains placeholders for API keys (Reddit, Anthropic, Cloudflare, GitHub, Vercel)

**Plans:** TBD

**Research Needed:** No - SQLite with better-sqlite3 and Commander.js CLI patterns are well-documented

---

### Phase 2: Content Pipeline

**Goal:** System can autonomously find, verify, and store JD Vance memes from multiple sources

**Depends on:** Phase 1 (needs state storage and budget tracking)

**Requirements:** CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, CONT-08

**Success Criteria** (what must be TRUE):
1. User can run a scraping command and system retrieves JD Vance memes from Reddit
2. System passes each image through Claude Vision API and correctly identifies whether it is a JD Vance meme
3. System rejects news photos, other people, and non-meme content automatically
4. System detects and skips duplicate images (same meme found on multiple sources)
5. User can see stored memes in database with source URL, verification confidence score, and scrape date

**Plans:** TBD

**Research Needed:** Yes - Vision AI prompt engineering for political figure identification needs validation; Reddit OAuth refresh flow is critical; Content policy restrictions on political figures must be tested

---

### Phase 3: Domain Management

**Goal:** User can import owned domains manually and system can automatically acquire cheap domains with budget enforcement

**Depends on:** Phase 1 (needs budget enforcement)

**Requirements:** DOM-01, DOM-02, DOM-03, DOM-04, DOM-05, DOM-06

**Success Criteria** (what must be TRUE):
1. User can run `domainweave ingest domains.csv` and see domains added to database
2. System checks domain availability via Cloudflare API before attempting purchase
3. System acquires a domain only if price is under ceiling (default $2/year) and monthly budget not exceeded
4. System automatically configures DNS records pointing new domain to Vercel
5. System tracks acquisition cost, renewal cost projection, and next renewal date for each domain
6. System stops acquisitions when monthly cap is reached and logs alert

**Plans:** TBD

**Research Needed:** Yes - Registrar API specifics (Cloudflare vs Namecheap vs Porkbun) vary; Renewal pricing for target TLDs must be verified; DNS configuration patterns are registrar-specific

---

### Phase 4: Site Generation & Deployment

**Goal:** System can generate a static microsite for one meme and deploy it live on a custom domain

**Depends on:** Phase 1 (needs state), Phase 2 (needs content), Phase 3 (needs domains)

**Requirements:** DEPL-01, DEPL-02, DEPL-03, DEPL-04, DEPL-05, DEPL-06, DEPL-07

**Success Criteria** (what must be TRUE):
1. System generates static HTML page showing one meme with source attribution, date, and share button
2. System creates a GitHub repository for the site and pushes HTML to it
3. System deploys the site to Vercel and connects the custom domain automatically
4. User can visit the custom domain in browser and see the meme site with dark minimal aesthetic and fade-in animation
5. System verifies deployment with HTTP 200 check and marks site as live in database
6. Site displays an SVG favicon generated from domain initials

**Plans:** TBD

**Research Needed:** No - Static site generation and GitHub + Vercel deployment already proven with vance.digital

---

### Phase 5: Network Topology

**Goal:** Multiple meme sites are interconnected with hub gallery and sequential navigation

**Depends on:** Phase 4 (needs deployed sites)

**Requirements:** NET-01, NET-02, NET-03, NET-04, NET-05

**Success Criteria** (what must be TRUE):
1. vance.digital displays a gallery of all deployed memes with clickable links to each domain
2. Every meme site has a link back to vance.digital hub
3. Every meme site has prev/next arrows that navigate to neighboring sites in sequence
4. User can browse the entire network by clicking prev/next arrows without returning to hub
5. Hub site automatically regenerates and redeploys when new sites are added to network

**Plans:** TBD

**Research Needed:** No - Link generation and hub gallery are straightforward HTML rendering

---

### Phase 6: Autonomous Mode

**Goal:** System runs autonomously via cron with full pipeline orchestration and graceful error handling

**Depends on:** Phase 1-5 (needs full pipeline working)

**Requirements:** CLI-02, CLI-03, AUTO-01, AUTO-02, AUTO-03, AUTO-04

**Success Criteria** (what must be TRUE):
1. User can run `domainweave run` and system executes full pipeline (scrape → verify → acquire → deploy → link) in a single command
2. User can run `domainweave run --dry-run` and see preview of actions without spending money or deploying
3. System handles errors gracefully (failed deployments, API timeouts, rate limits) without crashing
4. System resumes from last successful state on next run (does not repeat completed work)
5. User can add `domainweave run` to system cron and network grows autonomously over time

**Plans:** TBD

**Research Needed:** Yes - Google Custom Search API pricing/limits must be verified; Imgur API TOS needs review; System cron configuration is platform-specific

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-02 | 6 phases derived from research | Research suggested 7 phases but combined polish features into other phases to stay within standard depth (5-8) |
| 2026-03-02 | Phase 3 includes both manual and API acquisition | Manual import derisks domain acquisition before registrar API approval |
| 2026-03-02 | Phase 6 keeps autonomous mode separate | Cron automation magnifies failures if pipeline is buggy; must prove reliability first |

---

*Last updated: 2026-03-02 after roadmap creation*
