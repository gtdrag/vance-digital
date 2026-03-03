# Phase 1: State Foundation & CLI Scaffold - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `domainweave` CLI tool with SQLite state management and budget tracking. User can run `init`, `status`, and `budget` commands. No external actions — purely local foundation. All operations log to stdout with timestamps and severity levels. Config file holds placeholders for API keys.

</domain>

<decisions>
## Implementation Decisions

### CLI Output Style
- Rich terminal UI — colored output, box-drawing characters, tables
- Spinners + step logs in interactive mode; plain text logs when output is piped or in `--quiet` mode
- Informative by default — show key steps as they happen (e.g., "Creating database... done"). Use `--quiet` to suppress
- All commands support `--json` flag for machine-readable output (table default for humans, JSON for machines)
- CLI registered as both `domainweave` (full name) and `dw` (shortcut alias)
- TypeScript project

### Config & Init Flow
- Hybrid init: `domainweave init` creates config and database immediately with sensible defaults, then prints guidance to customize
- XDG-compliant data storage: config in `~/.config/domainweave/`, data in `~/.local/share/domainweave/`
- API keys: environment variables are primary (`DOMAINWEAVE_ANTHROPIC_KEY`, etc.), config file values as fallback. Env always overrides config
- Required keys: Reddit, Anthropic, Cloudflare, GitHub, Vercel — all as placeholders in initial config

### Budget Display & Alerts
- Default monthly budget cap: $25/month
- `domainweave budget` shows projections — upcoming renewals and estimated API costs based on recent usage
- Budget projections include a "Next 30 days" section

### Database Schema
- Full schema upfront — create all tables (config, transactions, memes, domains, deployments, sites, nostr_keypairs) at init time
- Versioned SQL migrations from day one
- Include `nostr_keypairs` table (npub, nsec_encrypted, relay_urls, created_at) — future-proofing for Nostr distribution channel

### Claude's Discretion
- Color scheme and semantic color usage (success/warning/error indicators)
- Status command layout design (dashboard vs summary)
- Budget spending categories and breakdown structure
- Domain renewal cost handling (included in cap vs tracked separately)
- Budget history retention approach
- Monthly reset mechanism (calendar month vs rolling window)
- Error message style (with/without hints)
- Init-time API key validation behavior
- Package manager selection
- Single vs split database files
- Stats query approach (live queries vs summary table)
- Logging library choice
- CLI framework choice (Commander.js or alternatives)

</decisions>

<specifics>
## Specific Ideas

- User expressed interest in Nostr protocol as a zero-cost distribution channel alongside domains — each npub = one piece of media. Schema should accommodate this future direction.
- CLI should feel polished — rich terminal UI reference, not bare-bones output

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html`: Static landing page with dark minimal aesthetic (#0a0a0a bg, white text, fade-up animations) — establishes the visual brand for the project
- `favicon.svg`: SVG favicon already exists for the hub site

### Established Patterns
- Dark minimal aesthetic is the project's visual identity — any CLI branding should complement this
- Project is deployed on Vercel (`.vercel/` directory exists)

### Integration Points
- Greenfield Node.js project — no `package.json`, no `src/`, no existing TypeScript setup. Phase 1 creates the entire project scaffold from scratch.
- `.gitignore` exists but will need Node.js entries added

</code_context>

<deferred>
## Deferred Ideas

- **Nostr distribution channel** — Create npub per meme, publish to relays, zero-cost viral growth. Hub account reposts everything for discovery. Explore as a new phase or project direction expansion.
- Nostr's censorship resistance means no centralized way to stop network growth — only individual relay filtering. This changes the growth/cost calculus fundamentally compared to domain-only approach.

</deferred>

---

*Phase: 01-state-foundation-cli-scaffold*
*Context gathered: 2026-03-02*
