# Domainweave

## What This Is

A CLI tool that autonomously builds and grows a network of interconnected microsites, each featuring a unique JD Vance meme. It scrapes memes from the internet using vision AI to verify content, acquires cheap domains, deploys each as a minimal standalone site to Vercel via GitHub, and links them together in a hub-and-spoke network with vance.digital as the hub. A cron job keeps the network growing over time.

## Core Value

Turn on the system, give it a budget, and it autonomously grows a network of meme sites across the internet with zero manual intervention.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] CLI tool that orchestrates the full pipeline end-to-end
- [ ] Meme scraping from Reddit, Google Images, Imgur, Twitter/X
- [ ] Vision AI filtering to confirm images are JD Vance memes (not news photos, not other people)
- [ ] Cheap domain acquisition via registrar APIs (Cloudflare, Namecheap, Porkbun)
- [ ] Manual domain import via CSV for domains user already owns
- [ ] Automated DNS configuration pointing domains to Vercel
- [ ] Site generation: each site shows one meme + source attribution + date + share button + navigation
- [ ] GitHub repo creation and Vercel deployment per site (reuse vance.digital pipeline)
- [ ] Hub site at vance.digital showing gallery of all memes with links to each domain
- [ ] Hub-and-spoke linking: every site links back to hub, hub links to all sites
- [ ] Sequential navigation: prev/next arrows linking neighboring sites
- [ ] SQLite database tracking domains, memes, deployments, spending
- [ ] Budget manager with monthly cap ($50/month), per-domain price ceiling, spend alerts
- [ ] Cron-compatible autonomous mode: scrape → acquire → deploy → link on schedule
- [ ] Dark minimal aesthetic matching vance.digital (fade-in animation, clean typography)
- [ ] SVG favicon auto-generated from domain initials

### Out of Scope

- SEO optimization or keyword stuffing — not gaming search engines, just claiming real estate
- User accounts or authentication — these are static sites
- CMS or admin panel — everything managed via CLI
- Mobile app — web only
- Monetization (ads, affiliate) — pure meme network, no revenue intent
- Morphing/evolving art — pivoted to curated meme content
- Multiple content types — JD Vance memes only for v1

## Context

- vance.digital already deployed to Vercel via GitHub (repo: gtdrag/vance-digital)
- Deployment pipeline proven: gh repo create → git push → vercel --prod → vercel domains add
- User's GitHub: gtdrag, Vercel: gtdrags-projects
- Public domain art was the original content idea; pivoted to JD Vance memes for shareability
- Vision AI (Claude, GPT-4V) can reliably identify specific people and distinguish memes from news photos
- Meme sources: Reddit API (r/PoliticalHumor, r/memes), Google Custom Search API, Imgur API, Twitter/X
- Budget ceiling: ~$50/month covering domain registration + image API calls + Vercel (free tier if possible)
- Cheap TLDs (.xyz, .site, .online) run $1-3/year

## Constraints

- **Budget**: $50/month hard cap — system must enforce this and stop acquisitions when reached
- **Vercel rate limits**: Deploy max ~10 sites/hour to avoid API throttling
- **Content legality**: Memes are generally fair use but avoid scraping from paywalled sources
- **Registrar APIs**: Require approved accounts and API keys (Cloudflare, Namecheap)
- **Vision API cost**: ~$0.01-0.04 per image analysis — budget must account for scraping volume
- **GitHub**: Free tier allows unlimited public repos

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JD Vance memes over morphing art | More shareable, funnier, clearer identity | — Pending |
| vance.digital as hub | Already deployed, domain matches theme perfectly | — Pending |
| Cron job over daemon | Simpler, more reliable, easier to debug | — Pending |
| SQLite over Postgres | Local CLI tool, no need for server DB | — Pending |
| One meme per site | Keeps sites ultra-minimal, maximizes domain count | — Pending |
| Static HTML over framework | No build step, instant deploy, zero dependencies | — Pending |

---
*Last updated: 2026-03-02 after initialization*
