# Ignix Integration Audit

Audit date: **2026-09-22**

## Conclusion

Ignix is the only one of the three protocols with a documented, anonymous public read API and a published X Layer deployment registry suitable for immediate limited integration.

Agentverse currently connects only the read-only launch index. Writes remain `EXTERNAL_ONLY` until the complete launch authorization contract is documented and a bounded test transaction is explicitly authorized.

The product model needs one important correction: Directed Vault is a launch-time, single-recipient routing choice for **trading tax**. It is not a mutable general-purpose Agent revenue splitter and it is not automatically the same thing as an Agent Treasury.

## Official documentation

- [Introduction](https://ignix.bot/docs)
- [HTTP API](https://ignix.bot/docs/developers/http-api)
- [Deployment addresses](https://ignix.bot/docs/developers/addresses)
- [Token metadata](https://ignix.bot/docs/developers/token-metadata)
- [Token types](https://ignix.bot/docs/developers/token-types)
- [Bonding-curve trading](https://ignix.bot/docs/developers/curve-trading)
- [Events and indexing](https://ignix.bot/docs/developers/events)
- [Launch flow](https://ignix.bot/docs/launching-a-token)
- [Vault templates](https://ignix.bot/docs/vault-templates)
- [Agent linking and verification](https://ignix.bot/docs/agent-verification)

## Contract addresses

Network: **X Layer mainnet, chain ID 196**

| Contract            | Address                                      | Purpose                                               |
| ------------------- | -------------------------------------------- | ----------------------------------------------------- |
| IgnixManager        | `0x96b51c57e5346d0c0198899243cf851d1e23c309` | Creation, curve trading, graduation and primary reads |
| IgnixLaunchFactory  | `0x5fe101caed11883ee133eb3ffd013f0cd27bb9d3` | CREATE2 token deployer                                |
| IgnixV4Router       | `0xb47b2f991d4014d2c4a2bbac6dd6fe3ed8884985` | Protected V4 settlement router                        |
| IgnixTaxHook        | `0xeb7e2bba4579705b608c466317d47817c9e16080` | V4 tax/protection hook                                |
| IgnixLpLocker       | `0x560d9f6025c3537e7610695c760ada761d0a0d6a` | V4 LP permanent holder                                |
| IgnixV2Locker       | `0xed707fc375c6a27e4330d3d38a939ba55bb2b99a` | V2 LP permanent holder                                |
| VaultRegistry       | `0xce65471a6c6950e17f4b527b20b0af8a8f905311` | `templateId → factory` official registry              |
| SystemFactory       | `0xb6f6e4d08f7895e0dc685144fc3ff1272649b6cc` | Template 0 factory                                    |
| StockFactory        | `0x347ba34a85514a2b8eb5d95c3e53878dd52d7780` | Template 1 factory                                    |
| IgnixBuybackFactory | `0x042b20147250f730f040f961858a7597fe952f30` | Buyback custody for linked Agents                     |

Official verification rules:

- token is current-generation Ignix: `IgnixManager.tokens(token).creator != address(0)`;
- official Vault for token: `IgnixManager.vaultOf(token)`;
- official template factory: `VaultRegistry.factoryOf(templateId)`.

Bytecode or event signatures alone are not accepted as proof of official status.

## ABI

No complete versioned ABI package was found, but official docs publish supported fragments sufficient for a bounded typed reader.

Manager reads/writes documented:

```solidity
IgnixManager.tokens(address token)
IgnixManager.pairOf(address token)
IgnixManager.vaultOf(address token)
IgnixManager.buy(address token, uint256 amountIn, uint256 minTokensOut)
IgnixManager.buyTo(address token, uint256 amountIn, uint256 minTokensOut, address recipient)
IgnixManager.sell(address token, uint256 tokenIn, uint256 minQuoteOut)
IgnixManager.sellFrom(address token, address payer, address recipient, uint256 tokenIn, uint256 minQuoteOut, uint256 deadline, bytes authorization)
IgnixManager.sellNonces(address payer)
IgnixManager.cancelSellAuthorizations()
```

Token/tracker reads documented:

```solidity
name()
symbol()
decimals()
taxBuyBps()
taxSellBps()
protectionActive()
protectionEndsAt()
pair()
tracker()
taxSink()
unlocked()
allAssets()
withdrawableOf(address holder, address asset)
claimAll()
```

Earlier contract generations may not expose newer getters. An RPC failure must be distinguished from a confirmed contract revert; a failed read does not prove zero tax or absence of a feature.

## API

Base URL: `https://api.ignix.bot`

Documented, anonymous, read-only endpoints:

```text
GET /v1/launches?limit=50&page=1
GET /v1/launches/{token}
GET /v1/launches/{token}/candles?interval=3600
```

The API provides display and index data including token metadata, creator, quote asset, progress, graduation flag, last fill price, volume, trade count, holder count, dividend share/tracker and template ID.

Important boundaries:

- the index may lag the chain;
- amount fields are strings in smallest units;
- image, description and social links are offchain;
- fund, quote, tax, graduation and routing decisions must use current contract state;
- live launch responses currently contain an `asp` object, but `asp` fields are not listed in the public HTTP API schema;
- Agentverse may display an `asp.matched === "linked"` association as official-index evidence, but may not treat `asp.rev` as Treasury balance, claimable Vault revenue or transaction authorization.

The marketing page shows a `POST /v1/ignix/sign` example. It is not documented in the developer HTTP API, so Agentverse does not treat it as a supported third-party launch endpoint.

## SDK

No official public Ignix SDK package was found.

Agentverse should use:

1. documented read-only HTTP endpoints for discovery/display;
2. X Layer JSON-RPC with minimal audited ABI fragments for onchain reads;
3. the official Ignix product UI for launch writes until a supported third-party authorization contract is documented.

## Authentication

| Operation                   | Authentication / authorization                                                 |
| --------------------------- | ------------------------------------------------------------------------------ |
| Read HTTP API               | None                                                                           |
| Read contracts              | None; public RPC                                                               |
| Link OKX Agent              | Owner-address message signature; offchain, no gas                              |
| Launch token                | Platform authorization followed by wallet confirmation/onchain deployment      |
| Curve buy with native OKB   | Wallet transaction with exact `msg.value`                                      |
| Curve buy with ERC-20 quote | Bounded approval to current Manager, then wallet transaction                   |
| Adapter sell                | Seller approval to Manager plus EIP-712 authorization bound to calling adapter |
| Claim dividends             | Holder wallet transaction to tracker                                           |

`sellFromOrigin` is allowlisted and must not be used by third-party Agentverse integration.

## Available functions

| Agentverse function        | Current status         | Implementation rule                                                                 |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `listLaunches()`           | `VERIFIED`             | Official anonymous HTTP API                                                         |
| `getAgentToken()`          | `VERIFIED`             | Single-token HTTP read, then onchain verification for fund state                    |
| `readLaunchContracts()`    | `EXTERNAL_ONLY`        | Addresses and fragments verified; typed reader is next implementation step          |
| `createAgentToken()`       | `EXTERNAL_ONLY`        | Official Ignix launch UI only                                                       |
| `configureDirectedVault()` | `EXTERNAL_ONLY`        | Launch-time single recipient; immutable after launch                                |
| `getTreasury()`            | `NOT_CONNECTED`        | Requires a defined Treasury address and source-specific reads                       |
| `getRevenue()`             | `NOT_CONNECTED`        | Must separate Agent escrow revenue, Vault tax, claimable amounts and wallet balance |
| `buy()` / `sell()`         | Out of MVP 2.0 Phase 1 | User explicitly excluded automatic trading                                          |

## Events

Current-version starting block: `68373506`.

Officially documented Manager events:

```solidity
event TokenCreated(
  address indexed token,
  address indexed creator,
  address indexed quote,
  uint256 graduation,
  string metadataURI,
  address vault,
  address tracker,
  uint16 templateId
);

event Trade(
  address indexed token,
  address indexed trader,
  bool isBuy,
  uint256 grossQuoteAmount,
  uint256 netQuoteAmount,
  uint256 curveQuoteAmount,
  uint256 tokenAmount,
  uint256 platformFee,
  uint256 taxFee,
  uint128 collected
);

event Graduated(
  address indexed token,
  bytes32 indexed poolId,
  uint256 lpTokenId,
  address vault,
  uint128 quoteInjected,
  uint128 tokenInjected
);

event GraduatedV2(
  address indexed token,
  address indexed pair,
  address vault,
  uint128 quoteInjected,
  uint128 tokenInjected
);
```

Dividend trackers emit `Streaming` and `Claimed`.

Index events by `(blockNumber, logIndex)` and rewind affected block ranges on a chain reorganization.

## Limitations

- There is no onchain curve quote function; callers must reproduce the exact rounding and fee formula.
- Pre-graduation token transfers are restricted to/from Manager.
- `buyTo` is public, but must deliver launch tokens directly to the end user.
- `sellFrom` requires an EIP-712 authorization tied to the calling adapter and a single-use nonce.
- Directed Vault supports one immutable recipient, not an editable split.
- Tax Distribution Vault can support multiple fixed recipients, but that is a different template and still locks configuration at launch.
- Agent linking is offchain ownership verification. Verified revenue display does not grant Agentverse control of the Agent payout address.
- Buyback Escrow is a constrained, revocable authorization with only buy/burn destinations; it is not a general Treasury.

## Test transaction

No state-changing transaction was sent.

Read-only checks on 2026-09-22:

- official launch index returned a successful response and launch records;
- X Layer RPC returned `chainId = 196`;
- at block `71,315,379`, `eth_getCode` returned non-empty code for:
  - IgnixManager;
  - IgnixLaunchFactory;
  - VaultRegistry;
  - IgnixBuybackFactory.

This proves the documented addresses contain deployed code at the audit block. It does not by itself prove every implementation detail or authorize a write.

## Source

- [Ignix HTTP API](https://ignix.bot/docs/developers/http-api)
- [Ignix deployment addresses](https://ignix.bot/docs/developers/addresses)
- [Ignix curve trading](https://ignix.bot/docs/developers/curve-trading)
- [Ignix events and indexing](https://ignix.bot/docs/developers/events)
- [Ignix Vault templates](https://ignix.bot/docs/vault-templates)
- [Ignix Agent linking and verification](https://ignix.bot/docs/agent-verification)
- [X Layer RPC endpoints](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/rpc-endpoints/rpc-endpoints)
