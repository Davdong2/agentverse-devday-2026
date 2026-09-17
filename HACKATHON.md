# OKX Dev Day 2026 submission map

## Track

**Build a Company** — Agentverse is a standardized, free A2MCP service and a visual mission console.

## Working service

- Product: https://agentverse-world.davdong2359.chatgpt.site/
- Descriptor: `GET https://agentverse-world.davdong2359.chatgpt.site/api/a2mcp/compose`
- Invocation: `POST https://agentverse-world.davdong2359.chatgpt.site/api/a2mcp/compose`
- Input: `goal`; optional `assetSymbol`, `chainId`, `contractAddress`, `maxAgents`; fixed `riskMode=confirm-before-action`
- Output: a structured mission with verifiable OKX.AI Agent IDs, Service IDs, prices, source timestamps and safety policy
- Billing: free (`HTTP 200`, no x402)
- Side effects: none; the service is read-only

This follows the official A2MCP free-endpoint requirement: a standardized task accepts parameters and returns a clear result directly with HTTP 200.

## End-to-end demo

1. Open the Mission Console.
2. Enter: `研究 BTC 市场状态，并检查一个 X Layer 代币的合约风险`.
3. Generate a mission.
4. Show the returned Agent IDs, Service IDs, prices and OKX.AI links.
5. Open one source link to verify the service.
6. Show the request receipt and explicit no-payment/no-execution policy.
7. Open `/world` to show how real mission events can be visualized without presenting simulations as transactions.

## Build-period evidence

- Commit 1 is the pre-hackathon baseline copied from the 12 September delivery.
- Later commits contain only official-build-period work.
- The original ZIP remains outside this repository and should be preserved unchanged.

## Marketplace status

The stable public HTTPS endpoint is deployed and self-checked. Agentverse still needs to be registered as an OKX.AI ASP and submitted as a free A2MCP service. Registration requires the team owner to supply and explicitly confirm the identity name, one-sentence description and avatar before the external identity can be created.

## Submission package

- Public product and endpoint: ready
- Build-period commit history: ready
- Public review repository: https://github.com/Davdong2/agentverse-devday-2026
- OKX.AI listing URL: pending owner-confirmed ASP registration
- 2–4 minute demo video: follow [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- Form-ready field checklist: [SUBMISSION.md](./SUBMISSION.md)

## Official references

- https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp
- https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a
- https://web3.okx.com/onchainos/dev-docs/okxai/user
