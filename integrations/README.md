# Agentverse Integration Audit

Audit date: **2026-09-22 (Asia/Shanghai)**

This directory is the Phase 0 source of truth for Agentverse MVP 2.0. A capability is enabled only when an official document, official product surface, or reproducible onchain read establishes that it exists and defines how it may be called.

## Current real MVP decision

The product does not wait for unavailable protocol integrations and does not simulate them. The current release contains only:

1. the Agentverse world with behavior clearly labelled `Demo`;
2. real public OKX.AI Agent profiles and service details;
3. the working Agentverse Mission Composer flow;
4. read-only Ignix official-index associations when the API returns them; and
5. an explicit handoff to the official Ignix product for any token launch.

MetAgents creation/runtime, TapeOut identity, TapeSend, DeWEB, in-app Ignix writes, Treasury, and Revenue are excluded from the current product flow. They may only return after their official integration surfaces are published and verified.

## Status

| Protocol  | Proposed layer        | Verified current surface                                                             | Agentverse status |
| --------- | --------------------- | ------------------------------------------------------------------------------------ | ----------------- |
| MetAgents | Agent Brain / Runtime | Hosted Super Agent, Google sign-in, wallet bind, USDC credit billing                 | `NOT_CONNECTED`   |
| TapeOut   | Agent Identity        | Circuit/processor protocol and circuit-owned Containers; X Layer UI is in test phase | `EXTERNAL_ONLY`   |
| Ignix     | Agent Economy         | Read-only HTTP index plus documented X Layer contracts and official wallet UI        | `READ_CONNECTED`  |

## Architecture corrections

1. **MetAgents is not yet a public Agent-creation backend.** Its current Terms describe Agent Studio and user-owned agents as product direction, not promised Release 1 functionality.
2. **A TapeOut Container is not a native Agent identity.** It is controlled by the current holder of a circuit NFT. Any Agent ↔ Container link is an Agentverse association until TapeOut publishes a protocol-native Agent registry/link method.
3. **Ignix Directed Vault is not a general revenue router.** It sends trading tax to one recipient chosen at launch and cannot be reconfigured after launch in current contracts.
4. **Verified Agent revenue, Vault tax, Treasury wallet balance, and token trading data are separate measures.** Agentverse must never add or relabel them as one number.

## Adapter rule

Unavailable functions remain callable only through typed adapter interfaces. They return `NOT_CONNECTED` or `EXTERNAL_ONLY`; they never return simulated IDs, transaction hashes, balances, revenue, messages, Containers, DeWEB URLs, or successful deployment states.

See:

- [MetAgents](./metagents.md)
- [TapeOut](./tapeout.md)
- [Ignix](./ignix.md)
