import type { IntegrationManifest } from './types';

export const integrationAuditDate = '2026-09-22';

export const integrationCatalog: IntegrationManifest[] = [
  {
    id: 'metagents',
    name: 'MetAgents',
    proposedRole: 'Agent Brain / Runtime',
    verifiedRole: 'Hosted Super Agent product',
    status: 'not-connected',
    summary:
      'Release 1 publicly confirms a hosted Super Agent, Google sign-in, an X Layer payment-wallet bind, USDC deposits and credit-metered turns. It does not publish a developer API for creating user-owned Agents.',
    sdk: 'No official public SDK or package was found.',
    api: 'A same-origin product API is acknowledged by the privacy policy, but no public developer contract or supported external endpoint is published.',
    authentication:
      'Google OAuth/OIDC is the only account sign-in. Wallet ownership is proven with EIP-191 personal_sign during product registration; this is not a third-party developer credential.',
    limitations: [
      'The terms explicitly describe Agent Studio, user-owned Agents and OKX.AI ASP publishing as product direction, not currently promised Release 1 functionality.',
      'No public create/get/status Agent endpoints, API keys, OAuth client flow, webhook contract, ABI or SDK were found.',
      'The terms prohibit scraping and reverse engineering, so Agentverse will not discover or depend on private product endpoints.',
    ],
    capabilities: [
      {
        id: 'useSuperAgent',
        label: 'Use hosted Super Agent',
        mode: 'write',
        status: 'external-only',
        authentication: 'Google sign-in + bound X Layer EOA + credits',
        notes:
          'Available inside the MetAgents product, not as a public Agentverse API.',
        sourceIds: ['metagents-terms', 'metagents-privacy'],
      },
      {
        id: 'createMetAgent',
        label: 'Create user-owned Agent',
        mode: 'write',
        status: 'not-connected',
        authentication: 'Not published',
        notes: 'No supported public endpoint or SDK is documented.',
        sourceIds: ['metagents-terms'],
      },
      {
        id: 'getMetAgent',
        label: 'Read Agent',
        mode: 'read',
        status: 'not-connected',
        authentication: 'Not published',
        notes: 'No external identifier or read contract is documented.',
        sourceIds: ['metagents-terms'],
      },
      {
        id: 'getMetAgentStatus',
        label: 'Read Agent status',
        mode: 'read',
        status: 'not-connected',
        authentication: 'Not published',
        notes: 'No status API or webhook contract is documented.',
        sourceIds: ['metagents-terms'],
      },
    ],
    contracts: [
      {
        name: 'MetAgents protocol contracts',
        network: 'X Layer',
        address: null,
        status: 'not-published',
        abi: 'not-published',
        notes:
          'The public product describes a treasury deposit flow, but does not publish an Agent registry/runtime contract for integration.',
      },
    ],
    checks: [
      {
        label: 'Public create-Agent contract test',
        result: 'Not run: no supported endpoint, SDK or ABI is published.',
        status: 'blocked',
      },
      {
        label: 'State-changing transaction',
        result: 'None sent.',
        status: 'not-run',
      },
    ],
    sources: [
      {
        id: 'metagents-terms',
        label: 'MetAgents Terms of Service',
        url: 'https://metagents.ai/terms',
        kind: 'official-docs',
      },
      {
        id: 'metagents-privacy',
        label: 'MetAgents Privacy Policy',
        url: 'https://metagents.ai/privacy',
        kind: 'official-docs',
      },
      {
        id: 'metagents-product',
        label: 'MetAgents product',
        url: 'https://metagents.ai/',
        kind: 'official-product',
      },
    ],
  },
  {
    id: 'tapeout',
    name: 'TapeOut',
    proposedRole: 'Agent Identity Layer',
    verifiedRole: 'Circuit, processor and circuit-container protocol',
    status: 'external-only',
    summary:
      'TapeOut publicly exposes processors, circuits and circuit-owned containers. A Container follows ownership of a circuit NFT; it is not documented as a native Agent identity registry.',
    sdk: 'No official public TapeOut SDK or supported package was found.',
    api: 'No public developer API contract was found. The official web app reads contracts directly and exposes product UI.',
    authentication:
      'Read operations are public chain reads. Writes require an injected wallet transaction on the selected chain.',
    limitations: [
      'The official product labels X Layer support as a test phase: contracts are not sealed and have not been independently audited.',
      'The X Layer product UI says containers can currently be opened and inspected, but asset sending-out/withdrawal is not wired up there yet.',
      'No stable X Layer deployment-address document or complete public ABI artifact was found.',
      'TapeSend and an external DeWEB deployment API/SDK were not found in current official developer material.',
      'Binding a TapeOut circuit/container to an Agent would currently be an Agentverse application-level association, not a protocol-native Agent link.',
    ],
    capabilities: [
      {
        id: 'getContainer',
        label: 'Inspect circuit Container',
        mode: 'read',
        status: 'external-only',
        authentication: 'Public chain read',
        notes:
          'Available through the official product; no stable Agentverse adapter ABI has been accepted.',
        sourceIds: ['tapeout-product'],
      },
      {
        id: 'createContainer',
        label: 'Open circuit Container',
        mode: 'write',
        status: 'external-only',
        authentication: 'Wallet transaction + opening fee',
        notes:
          'Official product flow only. It requires a real TapeOut circuit first.',
        sourceIds: ['tapeout-product'],
      },
      {
        id: 'bindContainer',
        label: 'Bind Container to Agent',
        mode: 'write',
        status: 'not-connected',
        authentication: 'No protocol flow published',
        notes:
          'Would be an Agentverse association unless TapeOut publishes an Agent registry/link method.',
        sourceIds: ['tapeout-product'],
      },
      {
        id: 'verifyContainerOwner',
        label: 'Verify circuit holder / Container controller',
        mode: 'read',
        status: 'external-only',
        authentication: 'Public chain read',
        notes:
          'Concept is supported by the product, but the X Layer ABI/address surface is not yet published as a stable integration contract.',
        sourceIds: ['tapeout-product'],
      },
      {
        id: 'deployToDeWEB',
        label: 'Deploy Agent profile to DeWEB',
        mode: 'deploy',
        status: 'not-connected',
        authentication: 'Not published for X Layer',
        notes: 'No supported upload/deploy API or SDK was found.',
        sourceIds: ['tapeout-product'],
      },
      {
        id: 'sendTapeMessage',
        label: 'TapeSend message',
        mode: 'message',
        status: 'not-connected',
        authentication: 'Not published',
        notes:
          'No official public API, SDK, ABI or current product route was found.',
        sourceIds: ['tapeout-product'],
      },
    ],
    contracts: [
      {
        name: 'TapeOut X Layer Factory / Container contracts',
        network: 'X Layer',
        address: null,
        status: 'not-published',
        abi: 'not-published',
        notes:
          'The official app has runtime configuration, but Agentverse will not treat frontend internals as a stable developer contract.',
      },
    ],
    checks: [
      {
        label: 'Official X Layer product surface',
        result:
          'Found: processor/circuit views and Container open/inspect UI, marked test phase.',
        status: 'passed',
      },
      {
        label: 'Container write test',
        result:
          'Not run: would spend gas/opening fee and no user-selected circuit was supplied.',
        status: 'not-run',
      },
      {
        label: 'TapeSend test',
        result: 'Blocked: no supported public integration surface was found.',
        status: 'blocked',
      },
    ],
    sources: [
      {
        id: 'tapeout-product',
        label: 'TapeOut official product',
        url: 'https://www.tapeout.net/',
        kind: 'official-product',
      },
      {
        id: 'tapeout-whitepaper',
        label: 'TapeOut official whitepaper',
        url: 'https://www.tapeout.net/TapeOut-Protocol.pdf',
        kind: 'official-docs',
      },
      {
        id: 'xlayer-network',
        label: 'X Layer network information',
        url: 'https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information',
        kind: 'official-docs',
      },
    ],
  },
  {
    id: 'ignix',
    name: 'Ignix',
    proposedRole: 'Agent Economy Layer',
    verifiedRole: 'X Layer launchpad, curve trading and Vault templates',
    status: 'connected-read',
    summary:
      'The documented anonymous HTTP API is connected for display/index data. Contract reads are valid for fund-critical state, but Agentverse has not enabled wallet writes, launch authorization, trading or Vault claims.',
    sdk: 'No official public SDK package was found. The docs provide HTTP endpoints, contract addresses, function signatures, formulas and events.',
    api: 'GET /v1/launches, GET /v1/launches/{token}, and candles are documented as anonymous read-only endpoints. Index data may lag the chain.',
    authentication:
      'Read API: none. Agent linking: Owner-address message signature. Launch: platform authorization plus wallet transaction. Trading/claims: wallet transaction and, where required, token allowance or EIP-712 authorization.',
    limitations: [
      'The public developer API does not document a supported third-party token-launch endpoint. A launch-signing route shown on the marketing page is not treated as a stable API contract.',
      'Directed Vault is selected at launch, routes trading tax to one immutable recipient, and has no post-launch reconfiguration function in current contracts.',
      'Directed Vault tax revenue is not the same as OKX.AI service revenue, Agent Treasury balance or total Agent income.',
      'The official launch index includes an asp object in live responses, but asp fields are not listed in the public HTTP API schema; Agentverse treats them as index display evidence, not fund state.',
      'Fund, routing, graduation, tax, Vault and claim decisions require current onchain reads. The API is not authoritative for those decisions.',
    ],
    capabilities: [
      {
        id: 'listLaunches',
        label: 'List launch index',
        mode: 'read',
        status: 'verified',
        authentication: 'None',
        notes:
          'Connected at /api/ignix for display and association discovery only.',
        sourceIds: ['ignix-http'],
      },
      {
        id: 'getAgentToken',
        label: 'Read a token record',
        mode: 'read',
        status: 'verified',
        authentication: 'None',
        notes:
          'Documented single-token HTTP read; onchain confirmation remains required for fund state.',
        sourceIds: ['ignix-http', 'ignix-token-metadata'],
      },
      {
        id: 'readLaunchContracts',
        label: 'Read Manager / token / Vault state',
        mode: 'read',
        status: 'external-only',
        authentication: 'Public X Layer RPC',
        notes:
          'Official addresses and ABI fragments are published, but a complete typed Agentverse reader is not implemented yet.',
        sourceIds: ['ignix-addresses', 'ignix-curve', 'ignix-token-types'],
      },
      {
        id: 'createAgentToken',
        label: 'Launch token',
        mode: 'write',
        status: 'external-only',
        authentication: 'Platform authorization + wallet transaction',
        notes:
          'Use the official Ignix launch flow until a supported third-party launch contract/API is documented and tested.',
        sourceIds: ['ignix-launch'],
      },
      {
        id: 'configureDirectedVault',
        label: 'Choose Directed Vault recipient',
        mode: 'write',
        status: 'external-only',
        authentication: 'Launch-time wallet flow',
        notes:
          'A single recipient is fixed at launch; this is not a mutable post-launch split.',
        sourceIds: ['ignix-vaults'],
      },
      {
        id: 'getTreasury',
        label: 'Read Agent Treasury',
        mode: 'read',
        status: 'not-connected',
        authentication:
          'Requires a verified treasury definition and onchain reader',
        notes:
          'Ignix vaultOf(token) identifies a Vault, not an Agentverse Treasury balance model.',
        sourceIds: ['ignix-addresses', 'ignix-vaults'],
      },
      {
        id: 'getRevenue',
        label: 'Read Agent revenue',
        mode: 'read',
        status: 'not-connected',
        authentication: 'Requires source-specific onchain accounting',
        notes:
          'Verified Agent revenue, claimable Vault tax and wallet balance are distinct measures and must not be combined.',
        sourceIds: ['ignix-agent-linking', 'ignix-vaults'],
      },
    ],
    contracts: [
      {
        name: 'IgnixManager',
        network: 'X Layer (196)',
        address: '0x96b51c57e5346d0c0198899243cf851d1e23c309',
        status: 'verified',
        abi: 'documented-fragments',
        notes: 'Primary curve, creation, graduation and read entry point.',
      },
      {
        name: 'IgnixLaunchFactory',
        network: 'X Layer (196)',
        address: '0x5fe101caed11883ee133eb3ffd013f0cd27bb9d3',
        status: 'verified',
        abi: 'documented-fragments',
        notes: 'CREATE2 token deployer.',
      },
      {
        name: 'VaultRegistry',
        network: 'X Layer (196)',
        address: '0xce65471a6c6950e17f4b527b20b0af8a8f905311',
        status: 'verified',
        abi: 'documented-fragments',
        notes: 'Onchain templateId → official factory registry.',
      },
      {
        name: 'SystemFactory',
        network: 'X Layer (196)',
        address: '0xb6f6e4d08f7895e0dc685144fc3ff1272649b6cc',
        status: 'verified',
        abi: 'documented-fragments',
        notes: 'Template 0 factory.',
      },
      {
        name: 'StockFactory',
        network: 'X Layer (196)',
        address: '0x347ba34a85514a2b8eb5d95c3e53878dd52d7780',
        status: 'verified',
        abi: 'documented-fragments',
        notes: 'Template 1 tokenized-equity Vault factory.',
      },
      {
        name: 'IgnixBuybackFactory',
        network: 'X Layer (196)',
        address: '0x042b20147250f730f040f961858a7597fe952f30',
        status: 'verified',
        abi: 'documented-fragments',
        notes: 'Buyback custody for linked Agents; not a general Treasury.',
      },
    ],
    checks: [
      {
        label: 'Anonymous launch-index read',
        result:
          'Passed: official API returned HTTP success and launch records on 2026-09-22.',
        status: 'passed',
      },
      {
        label: 'X Layer RPC and official contract code',
        result:
          'Passed at block 71,315,379: chainId 196 and non-empty code at Manager, LaunchFactory, VaultRegistry and BuybackFactory.',
        status: 'passed',
      },
      {
        label: 'State-changing transaction',
        result:
          'None sent. No token, Vault, approval, trade or claim was created.',
        status: 'not-run',
      },
    ],
    sources: [
      {
        id: 'ignix-http',
        label: 'Ignix HTTP API',
        url: 'https://ignix.bot/docs/developers/http-api',
        kind: 'official-docs',
      },
      {
        id: 'ignix-addresses',
        label: 'Ignix deployment addresses',
        url: 'https://ignix.bot/docs/developers/addresses',
        kind: 'official-docs',
      },
      {
        id: 'ignix-token-metadata',
        label: 'Ignix token metadata',
        url: 'https://ignix.bot/docs/developers/token-metadata',
        kind: 'official-docs',
      },
      {
        id: 'ignix-token-types',
        label: 'Ignix token types',
        url: 'https://ignix.bot/docs/developers/token-types',
        kind: 'official-docs',
      },
      {
        id: 'ignix-curve',
        label: 'Ignix curve trading',
        url: 'https://ignix.bot/docs/developers/curve-trading',
        kind: 'official-docs',
      },
      {
        id: 'ignix-events',
        label: 'Ignix events and indexing',
        url: 'https://ignix.bot/docs/developers/events',
        kind: 'official-docs',
      },
      {
        id: 'ignix-agent-linking',
        label: 'Ignix Agent linking and verification',
        url: 'https://ignix.bot/docs/agent-verification',
        kind: 'official-docs',
      },
      {
        id: 'ignix-launch',
        label: 'Ignix launch flow',
        url: 'https://ignix.bot/docs/launching-a-token',
        kind: 'official-docs',
      },
      {
        id: 'ignix-vaults',
        label: 'Ignix Vault templates',
        url: 'https://ignix.bot/docs/vault-templates',
        kind: 'official-docs',
      },
      {
        id: 'ignix-api',
        label: 'Ignix official launch index',
        url: 'https://api.ignix.bot/v1/launches',
        kind: 'official-api',
      },
      {
        id: 'xlayer-rpc',
        label: 'X Layer RPC documentation',
        url: 'https://web3.okx.com/onchainos/dev-docs/xlayer/developer/rpc-endpoints/rpc-endpoints',
        kind: 'official-docs',
      },
    ],
  },
];

export function integrationById(id: IntegrationManifest['id']) {
  return integrationCatalog.find((integration) => integration.id === id);
}
