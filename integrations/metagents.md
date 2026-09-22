# MetAgents Integration Audit

Audit date: **2026-09-22**

## Conclusion

MetAgents cannot currently be used as Agentverse's programmatic `Agent Brain / Runtime` through a verified public integration.

The official Terms say Release 1 provides a hosted Super Agent, Google sign-in, a one-time X Layer Payment Wallet bind, X Layer USDC deposits, and credit-metered Super Agent turns. They explicitly say Agent Studio, user-owned agents, and OKX.AI ASP publication are product direction and do not promise those features are available today.

Agentverse must therefore keep `createMetAgent()`, `getMetAgent()` and `getMetAgentStatus()` behind a `NOT_CONNECTED` adapter.

## Official documentation

- [Terms of Service](https://metagents.ai/terms)
- [Privacy Policy](https://metagents.ai/privacy)
- [Official product](https://metagents.ai/)

No public developer documentation, OpenAPI specification, external OAuth-client flow, API-key flow, webhook contract, SDK package, ABI or contract-address registry was found.

## Contract addresses

| Contract               | Network | Address                                       | Status          |
| ---------------------- | ------- | --------------------------------------------- | --------------- |
| Agent registry/runtime | X Layer | Not published                                 | `NOT_CONNECTED` |
| Product treasury       | X Layer | Not accepted as an Agent integration contract | Out of scope    |

The public product describes X Layer USDC deposits to a published treasury. That is a custodial billing flow, not evidence of an Agent registry or runtime contract.

## ABI

No public ABI for an Agent registry, Agent runtime, capability registry, task executor or Agent ownership contract was found.

## API

The Privacy Policy acknowledges a same-origin “metagents API,” but does not publish it as a supported external developer interface. The Terms prohibit scraping and reverse engineering. Agentverse will not inspect or depend on private product endpoints.

Confirmed product behavior:

- hosted Super Agent chat;
- persisted threads, messages and run records;
- credit usage and per-model billing records;
- public Web3-data lookups;
- no onchain transaction execution by Super Agent.

Not confirmed as public developer behavior:

- create a user-owned Agent;
- fetch an Agent by stable external ID;
- read Agent status;
- configure Agent prompts, tools or workflow programmatically;
- receive task/run webhooks;
- execute tools through a third-party API.

## SDK

No official public MetAgents SDK or package was found.

## Authentication

Current product authentication, according to official Terms and Privacy Policy:

1. Google OAuth 2.0 / OpenID Connect is the only sign-in and recovery method.
2. Requested scopes are `openid`, `email`, and `profile`.
3. Product sessions use an HttpOnly `ma_session` cookie.
4. Registration binds one X Layer OKX Wallet EOA through an EIP-191 `personal_sign` proof.
5. Contract wallets are rejected in Release 1.

None of these documents defines a third-party API credential or delegated Agentverse authorization flow.

## Available functions

| Function              | Current status  | Reason                                                             |
| --------------------- | --------------- | ------------------------------------------------------------------ |
| `useSuperAgent()`     | `EXTERNAL_ONLY` | Available inside the hosted product after sign-in and credit setup |
| `createMetAgent()`    | `NOT_CONNECTED` | No public API/SDK/contract                                         |
| `getMetAgent()`       | `NOT_CONNECTED` | No public external ID/read contract                                |
| `getMetAgentStatus()` | `NOT_CONNECTED` | No status API/webhook                                              |
| `configurePrompt()`   | `NOT_CONNECTED` | No developer contract                                              |
| `configureTools()`    | `NOT_CONNECTED` | No developer contract                                              |
| `runTask()`           | `NOT_CONNECTED` | Hosted Super Agent behavior is not a public runtime API            |

## Events

No public protocol events or webhook event schema for Agent creation, task execution, status changes or billing were found.

## Limitations

- Agent Studio and user-owned Agents cannot be treated as live based on marketing language.
- The hosted Super Agent does not execute onchain transactions on the user's behalf.
- Product billing is custodial: deposited USDC is credited to an internal balance and cannot be withdrawn externally in Release 1.
- A bound Payment Wallet is not an Agent identity.
- A private same-origin API is not a supported public API.

## Test transaction

No write transaction was sent.

No API request to private MetAgents product endpoints was made. A create-Agent test is blocked because no supported external endpoint, SDK or ABI is published.

## Source

- [MetAgents Terms, sections 2, 4, 5 and 6](https://metagents.ai/terms)
- [MetAgents Privacy Policy, sections 2–8](https://metagents.ai/privacy)
