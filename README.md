# Agentverse — 观察世界 / 进入世界

A Chinese world-first website built from the supplied Agentverse brief, with public OKX.AI profile data and explicitly simulated behavior. Soft original isometric artwork, ivory geometry, pale teal atmosphere and generous negative space replace the dashboard-led home page.

## Experience

- The default Canvas overview contains 50 simulated instances mapped to real public profiles. Ten clickable regions: 协作中心、研究区、创生区、记忆库、算力站、交易市场、安全区、现实入口、能源站、未知世界.
- Selecting a region animates a camera zoom and navigates to `/regions/[slug]`, retaining the world scene. Selecting an Agent opens the third-level scene-backed profile at `/regions/[slug]/agents/[id]` with identity, interpreted skill blocks, actual services, rating, sales, starting price, source status and clearly marked simulation history.
- “进入世界” lazily loads a lightweight Three.js first-person renderer with simple low polygon platforms, bridges and modular organisms. WASD/arrow keys move; drag turns the view; clicks inspect Agents and regions. Phones have a joystick and drag-look. Walk bounds follow the same platform and bridge topology used for rendering.
- WorldProvider persists source data, simulation time, weather, events, history and walker position above all routes. Both cameras sample the same deterministic AgentState using the same clock. There is no second simulation on camera switch. Progress persists across client navigation and resets on reload.
- One continuous 18-second collaboration cycle: request → approach → dock → composite → sequential work → result delivery → simulated rewards → split → growth. Pause, speed and stage controls act on shared time.
- Real catalog deltas and BTC ticker updates enter a short event feed and briefly highlight the corresponding region in both views. Demo events remain marked. The feed distinguishes a profile appearing in the current fetched catalog from verified creation of a new Agent.

## Data boundaries

`/api/agents` reads https://www.okx.ai/zh-hans/agents, normalizes public names, categories, descriptions, ratings, sales, starting prices and avatars, and stores successful snapshots in WORLD_STORE (R2). The page synchronizes on entry and every 20 minutes. Server caching is 20 minutes. If the public page omits the expected embedded catalog or fails, the last real snapshot is returned with its timestamp and explicit cache status. Bundled fallback: 20 real profiles. The source's total count is distinct from loaded profiles and the 50 simulated instances.

`/api/agents/[id]` reads public service records with a 20-minute cache; an open profile checks again every 20 minutes. Bundled fallback covers all 20 profiles with up to nine services each. Loaded and total service counts remain distinct. Unknown profile routes explain missing data rather than substitute a different identity.

`/api/world-signal` reads the unauthenticated OKX BTC-USDT ticker, validates last/open24h/ts, caches for one minute and persists a fallback. A 24h change <= -2% maps to a storm, >= +2% to a tide, otherwise calm. This is an artistic price-change mapping, not an independently measured liquidity indicator. Fresh market events take priority over the ordinary demo. Stale signals remain labeled.

The header distinguishes `资料 LIVE / 缓存` from `行为 Demo`. Catalog data and real market signals never make Agent movement or cooperation real. Collaboration, task execution, rewards, growth, hypothetical news, RWA nodes and resource flows are simulations. X Layer WebSocket events, live news, stocks and real A2A/payment records are not connected. No service is commissioned and no transaction is executed.

## Rendering and performance

The overview remains Canvas. Three.js is loaded only for walking. Simple shared geometries/materials, no large textures, shadows or complex PBR. The first-person renderer adapts resolution, particles and distant non-team Agent visibility when observed frame rate is low. The four current collaborators remain visible. Hidden pages suspend world updates and rendering; GPU resources and input handlers are released on unmount. Reduced-motion preferences pause the initial simulation.

Desktop 60 FPS and mobile 30 FPS are targets, not measured guarantees. This revision has not received browser visual/interaction testing or physical-device GPU profiling. Automated checks verify deterministic shared positions, all nine phase boundaries, continuous docking and separation, market thresholds, all ten walkable region centers, uninterrupted bridges, out-of-world rejection, and mapping to real profiles. TypeScript, production build and server route smoke checks are also used. Pure state-sampling timing is not renderer FPS.

## Optional scene photography

The photography dialog pauses the scene and exports a structured description. The optional image-generation endpoint saves to R2 and uses conditional request claims to prevent duplicate request IDs. OPENAI_API_KEY is currently unconfigured; paid generation is disabled and has not been tested. The optional feature is not required for exploring either camera mode. Never expose secrets in client code.

## Runtime

Vinext / React / Cloudflare Workers, Shadcn Sheet/Dialog/Tabs, Canvas and lazily loaded Three.js. The existing private Sites project is preserved. Public external descriptions are untrusted inert text. Optional WebMCP selection validates known IDs and only opens profiles.

## Crypto task refinement

Ten small interactive workstations now show crypto concepts inside the world: collaboration settlement, BTC research, Agent identity, hash/receipt archives, execution queues, ETH/USDC asset exchange, authorization checks, oracle-style signal packaging, Gas supply and cross-domain discovery. These are labeled Demo; no transaction is submitted. Both Canvas and Three.js use `cryptoTaskState` for matching step, token positions, lift, visibility and receipt timing. Overview annotations appear at closer zoom, with only restrained market/security activity at world scale.

Six functional loadouts add scanning visors, colored waist rings, interface blocks, message/metadata crystals and permission shields to the nonhuman Agents. The four central collaborators have explicit research/security/interface/trading loadouts. Working accessories move with the shared clock; moving Agents turn toward their route. Profile panels explain the props separately from real skills and services.

Additional checks cover all ten task cycles, paired asset exchange without phase-boundary jumps, receipt sequencing, always-Demo provenance, six loadouts, actual Three scene construction, clickable stations, equipment state differences and resource cleanup. The Three scene test checks object state using a text-canvas stand-in; it does not certify browser pixels, GPU behavior or device frame rate.
