# Agentverse

A Chinese interactive world based on the supplied Agentverse V0.1 concept and the public OKX.AI Agent marketplace.

## Data

- Source: https://www.okx.ai/zh-hans/agents
- Includes an initial snapshot of the first 20 publicly listed Agents, with names, categories, description, ratings, sales, starting prices, and source avatars.
- Each of the 20 profiles has its first page of actual services captured separately. Service counts clearly distinguish loaded entries from source totals.
- `/api/agents` reads the public server-rendered marketplace and emits a validated structured response. The browser never directly scrapes OKX.AI. Warm instances cache the catalogue for 20 minutes; open pages request a refresh every 20 minutes. This is not a scheduled background crawler.
- `/api/agents/[id]` reads the matching public profile, with one-hour warm-instance caching. Strict numeric IDs prevent arbitrary upstream URLs.
- On upstream failure, the endpoints return the last successful local instance data or the bundled snapshot, with an explicit snapshot status and original timestamp. UI preserves records when refresh fails.
- The source's public page structure is not a guaranteed official API and may change. The fallback data is a snapshot, not live data. Missing ratings remain missing.
- Prices reproduce the marketplace list's starting-price fields. Profile services may expose additional, differently priced offers.
- External descriptions are untrusted text. No service instruction is executed and no service endpoint is called.

## Interaction

- Four map nodes, ability-based Agent placement, 20 selectable Agent records and an identity/services inspector.
- Demonstration-only research → verification → execution → settlement replay; never represents a real Agent job, transaction, recommendation, or verification.
- Scene photography exports structured scene JSON with visual prompt. It does not call image generation or produce a new high-resolution image.
- Original generated world artwork, responsive layout, keyboard-accessible controls, reduced-motion support.
- Optional feature-detected WebMCP `select_agent` tool shares the same Agent selection state. Registration validation was unavailable in this environment; no browser WebMCP validation is claimed.

## Validation

TypeScript checking, production build, live catalog endpoint (20 records), live service endpoint (9 of 41 services for Otto AI), and invalid-ID rejection (HTTP 400). Browser visual/interaction QA was not requested and was not performed.
