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

The current character direction follows the nine user-supplied September 7 reference boards: one rounded ivory robot body, oversized head, black oval eyes, blush accents, cyan chest core and colored capability cubes. Eight visual variants cover research, trading, risk, audit, finance, creation, life and development. Profile panels explain capability blocks and props separately from real skills and services.

Additional checks cover all ten task cycles, paired asset exchange without phase-boundary jumps, receipt sequencing, always-Demo provenance, six loadouts, actual Three scene construction, clickable stations, equipment state differences and resource cleanup. The Three scene test checks object state using a text-canvas stand-in; it does not certify browser pixels, GPU behavior or device frame rate.


## Reference-led Agent redesign

A new built-in-imagegen transparent 4×2 sprite atlas (1536×1024, 384×512 cells) is used in Canvas, the directory and Agent profiles. The atlas has modest baked glows and a nearly frontal view; it is not an eight-direction walking atlas. The original reference images are visual guidance, not a source of example ratings, identities, balances or LIVE activity.

First-person robots use shared rounded geometry: head, torso, short hinged arms and legs, oval eyes, cheeks, chest core, capability cube, translucent top cube and role-specific handheld props. Movement adds alternating gait, direction changes, blinking, head tilt, handoff, working pulses and a temporary capability crown on the collaboration leader. Other participants remain identifiable. Distant faces omit tiny accents, and existing quality reductions remain in place. No complex PBR, shadow maps or large model textures were introduced.

The shared AgentState includes an eight-way variant. Shared avatarMotion drives movement cues and cooperation in both renderers. Known collaborators use the same variant across every instance and profile. Canvas selection now covers the full body and head cube. The pure tests cover variant identity, silhouette proportions, clickable body/head/cube, alternating gait, forward handoff, composite/split sequencing, full-body hit areas and deterministic sampling. Browser visual inspection and actual device FPS measurements remain unperformed.

### Scene-backed dossiers and distinct body families
Agent detail routes now expand into a scene-backed dossier: identity/services on the left, a large character and derived capability labels centrally, current simulated state/history and public rating on the right, and a six-step collaboration strip. Source metrics remain sourced from the catalog; unavailable review text and skill levels are not invented. Mobile uses a vertical layout. Selecting a first-person actor preserves its exact instance in WorldProvider, disables movement while a sheet is open, and leaves the world clock running. Recent history is newest-first.
Eight shared designs now vary in pastel body material, head geometry and body proportions. The new generated atlas uses explicit source crops in `avatar-sprite.ts`, preserving aspect ratio when drawn on Canvas; 3D skins and proportions use the same role definition. No downloaded textures, shadow maps or extra renderers were added. The atlas was made with built-in image generation. Object-level tests cover eight distinct skin colors and silhouettes alongside shared identity/actions; production build and route response checks passed. Browser visual QA and real-device frame rates remain unmeasured.

### Refined first-person architecture and materials
The walk renderer now uses smooth specular shell materials, inset dark face visors with lit eyes, outlined translucent capability cubes and role-colored shoulder/back details. Near/far geometry and detail visibility tiers keep the expensive articulated parts close to the camera. All eight existing role skins/proportions remain shared with the actor identity system.
The first-person world now has layered ivory floating terraces, gold edge inlays, curved bridge undersides, clear-span arches, distant monumental terraces, instanced route pulses and animated data curtains. Collaboration uses eight docking translucent modules, capability beams, rising sparks and a receipt delivered to the reality entrance, all driven by the existing world phase. Walkable floor elevations and connections are unchanged. No shadow maps, PBR textures or postprocessing stack were introduced.
Object tests verify floor heights, bridge coverage, assembly/receipt sequencing, adaptive particle counts, finite transforms, material/LOD behavior and cleanup. Production compilation passes; no browser visual QA or actual-device FPS has been measured.

### Names and architectural detailing
All visible walk-mode Agent instances now carry their exact public-catalog name in a camera-facing text sprite. Long names wrap without truncation; shared identities reuse one texture. Nameplates compensate for distance, rise above composite crowns, obey depth occlusion and can be clicked to inspect the exact instance. Hidden actors also hide their names.
Scene detailing now includes subtle procedural limestone grain, a single batched paving-joint layer across circles and bridges, a thick elevated collaboration rotunda, and region-specific library/compute shelving, settlement rings, security rings and a reality gate curtain. No image textures were added for stone or paving. Tests cover name retention/wrapping, shared textures, distance scaling, occlusion configuration and disposal in addition to the architecture and collaboration tests. Browser appearance and actual device FPS are not verified by these tests.

### IGNIX linked-token identities
`/api/ignix` reads the official unauthenticated launch index and accepts only explicit `asp.matched === 'linked'` associations with numeric Agent IDs and valid token contracts. IDs, not names, join the OKX catalog. Multiple tokens can belong to one Agent; its USD revenue is not summed again per token. Missing revenue differs from zero. The UI calls this IGNIX-linked identity, not an independent Agentverse audit.
Associated profiles are fetched separately from OKX.AI overview pages and only added when their exact IDs match. Initial evidence includes four IGNIX associations and three readable OKX profiles (11025, 11031, 11110). Profile 11192 returned 404 and is not fabricated. Stable ID sorting prevents nameplate instances from changing on refresh. The snapshot has its own timestamp.
The index is checked every 20 minutes while the page is active, with an R2-backed last-success cache, in-flight deduplication and failure cooldown. On failure, previous records remain explicitly cached/stale; a valid empty list removes marks. IG badges appear on Canvas actors, first-person head markers/name-linked inspection, directory entries and profile portraits. Details show linked tokens, contract, curve/graduation status, IGNIX's Agent-level escrow settlement revenue in USD and the source timestamp.
Sources: https://ignix.bot/docs/agent-verification ; https://ignix.bot/docs/developers/http-api ; https://ignix.bot/docs/verifiability . Official launch frontend confirms USD formatting for asp.rev and `/launch?token=` links. This integration performs no wallet connection, signing, launching, approval, purchase or other transaction.
Validated: exact-ID/contract filtering, no fuzzy identity matching, no duplicate revenue summation, missing-vs-zero handling, absent-profile behavior, IG sprite visibility and exact-instance picking; local fresh sync returned four associations and three profiles. Browser visual QA remains unperformed.

Cloud-only OKX retrieval failures retain previously verified profiles and the bundled verified snapshot, including when an older R2 cache contains an empty profile list. Per-profile provenance records the last successful OKX read independently from the IGNIX timestamp; the dossier labels each retained profile as cached. Fresh successful associations remain authoritative, so removed links cannot be resurrected by profile fallback. Regression tests cover empty old caches, partial refreshes, original timestamps and association removal.
