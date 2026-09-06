# Agentverse

A Chinese interactive world based on the supplied Agentverse V0.1 concept and the public OKX.AI Agent marketplace.

## Data

- Source: https://www.okx.ai/zh-hans/agents
- Includes an initial snapshot of the first 20 publicly listed Agents, with names, categories, description, ratings, sales, starting prices, and source avatars.
- Each of the 20 profiles has its first page of actual services captured separately. Service counts clearly distinguish loaded entries from source totals.
- `/api/agents` reads the public server-rendered marketplace and emits a validated structured response. The browser never directly scrapes OKX.AI. The latest successful catalogue is persisted in R2 and cached for 20 minutes; open pages request a refresh every 20 minutes. This is not a scheduled background crawler.
- `/api/agents/[id]` reads the matching public profile, with one-hour warm-instance caching. Strict numeric IDs prevent arbitrary upstream URLs.
- On upstream failure, the endpoints return the last successful local instance data or the bundled snapshot, with an explicit snapshot status and original timestamp. UI preserves records when refresh fails.
- The source's public page structure is not a guaranteed official API and may change. The fallback data is a snapshot, not live data. Missing ratings remain missing.
- Prices reproduce the marketplace list's starting-price fields. Profile services may expose additional, differently priced offers.
- External descriptions are untrusted text. No service instruction is executed and no service endpoint is called.

## Interaction

- Four map nodes, ability-based Agent placement, 20 selectable Agent records and an identity/services inspector.
- Demonstration-only research → verification → execution → settlement replay; never represents a real Agent job, transaction, recommendation, or verification.
- Scene photography exports structured scene JSON with visual prompt. An optional server route generates one 2048 × 1152 image with gpt-image-2 and stores it in WORLD_STORE (R2). OPENAI_API_KEY must be configured as a server secret; the current deployment has no key and disables generation with a clear message. No paid generation was performed. Conditional R2 creation prevents concurrent submissions with the same request ID.
- Original generated world artwork, responsive layout, keyboard-accessible controls, reduced-motion support.
- Optional feature-detected WebMCP `select_agent` tool shares the same Agent selection state. Browser validation confirmed that a valid Agent ID updates selection and an invalid ID is rejected.

## Validation

TypeScript checking, production build, world-model tests (20 profiles, six visual families, four areas and states, reputation and sales mapping, route bounds and service coverage), live catalog endpoint (20 records), live service endpoint (9 of 41 services for Otto AI), and invalid-ID rejection (HTTP 400). Production v2 returned fresh OKX data on 2026-09-06 at 08:20 UTC (source total 800). Browser QA covered desktop and mobile layouts, Agent selection, profile/service tabs, all four nodes, replay completion, stable paused position, and valid/invalid WebMCP selection. Photography correctly showed a disabled generation button without a key; POST returned 503 not_configured. The browser download event was not observable in this environment, so file download confirmation remains unverified. No successful AI photograph generation is claimed. Repeated production checks also observed intermittent upstream failures; the UI correctly returned snapshot mode. Successful catalog reads are now persisted in R2 so instance restarts retain the last successful data.
