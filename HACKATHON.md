# OKX Dev Day 2026 submission map

## Track

**Build a Company** — Agentverse is a standardized, free A2MCP service and a visual mission console.

## Working service

- Descriptor: `GET /api/a2mcp/compose`
- Invocation: `POST /api/a2mcp/compose`
- Input: `goal`, optional `maxAgents`, fixed `riskMode=confirm-before-action`
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

## Remaining marketplace step

After deployment produces a stable HTTPS endpoint, register Agentverse as an OKX.AI ASP and publish the endpoint as an A2MCP free service. Registration is intentionally kept outside the code build because it creates an external marketplace identity and requires the team owner's account confirmation.

## Official references

- https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp
- https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a
- https://web3.okx.com/onchainos/dev-docs/okxai/user
