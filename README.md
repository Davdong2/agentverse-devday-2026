# Agentverse — Civilization Observer

A world-first Chinese interactive simulation based on the supplied Agentverse V0.1 document and the user's expanded civilization brief. The home page is a continuous, zoomable world rather than a catalog dashboard.

## Experience

- One central collaboration disk, surrounded by research, genesis, memory, compute, market, risk, reality, energy, and unexplored domains.
- 600 explicitly simulated instances mapped to 20 real OKX.AI profiles. The instance count is not the marketplace's number of distinct Agents, and no real Agent behavior is asserted.
- Continuous 80-second collaboration state machine: request, approach, docking, composite formation, sequential research/risk/audit/execution, result delivery, simulated rewards, separation, and skill growth.
- World/region/Agent zoom levels, drag and two-finger navigation, keyboard-accessible region and zoom controls, pause, speed control, stage selection, real profile/service panels, and current-session simulation memories.
- Six hypothetical world events: NVIDIA information storm, BTC volatility storm, liquidity tide, X Layer expansion, protocol risk contamination, and a resources/energy loop. Events change flows, colors, rings, routing or network expansion. They are prominently labeled simulations.
- Real BTC market mode uses the OKX public ticker endpoint. A 24h price change <= -2% maps to a volatility storm, >= +2% to a tide, and otherwise to calm. This visual interpretation is not investment advice and is not a claim that liquidity was independently measured. Other event types are not connected to real news feeds.
- Assets near the reality portal are conceptual mappings, not real ownership, tokenization, or live quotes.

## Data and persistence

`/api/agents` reads https://www.okx.ai/zh-hans/agents and normalizes public names, categories, descriptions, ratings, sales, starting prices and avatars. The latest successful response is saved in WORLD_STORE (R2), cached for 20 minutes, and refreshed on page open and every 20 minutes. On source failure, it returns the latest saved real snapshot with its timestamp and explicit snapshot status. Public HTML occasionally does not contain the expected embedded catalog; no authenticated endpoints or signing mechanisms are bypassed.

`/api/agents/[id]` reads actual public service records. The bundled data covers all 20 profiles, with the first nine services or fewer per profile. Loaded count and total count are distinct.

`/api/world-signal` reads https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT without authentication, validates last/open24h/ts, caches briefly and persists a fallback. Stale data remains labeled. No fabricated live market values are supplied.

Simulation progress and memories are session-only and reset on page reload. Actual catalog ratings and sales remain separate from simulated rewards and skills. External descriptions are inert, untrusted text; no service is commissioned and no trade is executed.

## Scene photography

The photography dialog pauses the scene and exports region, weather, collaboration stage, camera, team, selected profile and simulation history as structured JSON. The optional server image-generation route supports the expanded civilization state and saves results to R2.

OPENAI_API_KEY is required as a server secret to enable generation. It is currently unconfigured, so the UI disables paid generation and explains why. No paid generation has been tested. Conditional R2 request claims prevent concurrent submissions using the same request ID. See .env.example; never put secrets in client code.

## Validation

- TypeScript check and production build.
- Original 20-profile visual mapping checks.
- New collaboration tests: all ten regions, all nine phases, continuous trajectories including cycle boundaries, physical approach/docking/separation, and market-weather thresholds.
- HTTP 200 home render; successful real BTC signal retrieval.
- Civilization photography accepts a valid state and returns 503 not_configured without billing; invalid stage returns 400.
- The new observer view has not undergone browser interaction/visual QA in this revision. Earlier browser checks applied to the prior four-station interface, not this redesign.

## Assets and runtime

Original generated panoramic world artwork plus six-family character atlas; the functional Canvas layer renders routes, populations and collaborative state. Canvas stops redrawing unchanged paused frames. Reduced-motion preferences pause the simulation initially. The site uses the existing Vinext/React/Cloudflare architecture and installed Shadcn Sheet, Dialog and Tabs primitives.

Optional WebMCP `select_agent` validates a known ID and opens the same real profile panel. It never executes a service or transaction.
