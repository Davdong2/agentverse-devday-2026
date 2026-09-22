# TapeOut X Layer Integration Audit

Audit date: **2026-09-22**

## Conclusion

TapeOut currently provides a real circuit/processor and circuit-container product, but it is not documented as a native Agent identity protocol.

A Container belongs to a circuit and is controlled by the circuit NFT's current holder. Selling or transferring the circuit transfers control of everything in the Container. Agentverse may use a verified Container as one component of an Agent Passport only after an explicit application-level binding is signed and stored; it must not relabel the Container itself as a protocol-native Agent identity.

The official product labels X Layer support as a test phase. It says contracts are not sealed and have not been independently audited. On X Layer, the current UI states that Containers can be opened and inspected, while sending assets out and withdrawing are not yet wired up.

## Official documentation

- [TapeOut official product](https://www.tapeout.net/)
- [TapeOut official whitepaper](https://www.tapeout.net/TapeOut-Protocol.pdf)
- [X Layer network information](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information)
- [X Layer RPC endpoints](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/rpc-endpoints/rpc-endpoints)

The official product is the only current public integration surface found. No separate public developer portal for TapeOut X Layer was found.

## Contract addresses

| Contract                            | Network | Address                                                | Status          |
| ----------------------------------- | ------- | ------------------------------------------------------ | --------------- |
| TapeOut Factory                     | X Layer | Not published in stable developer documentation        | `EXTERNAL_ONLY` |
| Processor/Circuits                  | X Layer | Per-project address, resolved through official product | `EXTERNAL_ONLY` |
| Transistors                         | X Layer | Per-project address, resolved through official product | `EXTERNAL_ONLY` |
| Circuit Account / Container gateway | X Layer | Not published in stable developer documentation        | `EXTERNAL_ONLY` |
| Circuit Account implementation/lens | X Layer | Not published in stable developer documentation        | `EXTERNAL_ONLY` |

The official frontend necessarily has runtime configuration, but Agentverse does not treat minified frontend internals as a stable, supported developer-address registry.

The official homepage publishes BNB Chain addresses. Those are not substituted for X Layer addresses.

## ABI

The product frontend calls EVM contracts and displays processor/circuit/Container operations, but no complete public X Layer ABI artifact or versioned package was found.

Agentverse will not copy human-readable ABI fragments out of the frontend bundle and present them as a supported contract API. A stable ABI must come from official developer documentation, a verified official repository, or verified explorer artifacts tied to officially published addresses.

## API

No public TapeOut REST/GraphQL developer API contract was found.

The official web app performs product reads and wallet-assisted transactions. That confirms the product exists, but does not create a supported server-to-server API for Agentverse.

## SDK

No official public TapeOut SDK package or versioned integration library was found.

## Authentication

- Public reads: X Layer JSON-RPC / contract reads.
- Writes: injected wallet transaction on the correct chain.
- Container control: follows the current circuit NFT holder, not the address that paid the opening fee.
- Agent binding: no protocol-native authentication/linking method was found.
- TapeSend: no supported authentication or encryption-key contract was found in current official developer material.

## Available functions

| Function                 | Current status         | Notes                                                                                                   |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `getContainer()`         | `EXTERNAL_ONLY`        | Official product can inspect a circuit Container; stable integration ABI/address registry not published |
| `createContainer()`      | `EXTERNAL_ONLY`        | Official wallet UI; requires a real TapeOut circuit and opening fee                                     |
| `verifyContainerOwner()` | `EXTERNAL_ONLY`        | Concept is real: control follows circuit holder; adapter awaits stable ABI/addresses                    |
| `bindContainer()`        | `NOT_CONNECTED`        | Would currently be an Agentverse association, not TapeOut protocol state                                |
| `generateAgentProfile()` | Local preparation only | May generate files, but cannot claim DeWEB deployment                                                   |
| `deployToDeWEB()`        | `NOT_CONNECTED`        | No supported X Layer deployment API/SDK found                                                           |
| `sendMessage()`          | `NOT_CONNECTED`        | No verified TapeSend API/SDK/ABI found                                                                  |
| `getMessages()`          | `NOT_CONNECTED`        | No verified TapeSend index/read API found                                                               |
| `getConversation()`      | `NOT_CONNECTED`        | No verified TapeSend conversation contract found                                                        |

## Events

No stable X Layer event reference was found for:

- Container opened/activated;
- Container controller/owner changed;
- DeWEB deployment/version updated;
- TapeSend message sent/received.

The official product clearly relies on onchain events for circuit discovery, but Agentverse will not freeze an inferred event schema without official publication and chain verification.

## Limitations

- A circuit Container is an ERC-6551-like asset account controlled through a circuit NFT; it has no private key.
- It cannot safely represent an Agent until the underlying circuit and owner are verified and the Agentverse binding is explicit.
- Container assets follow circuit ownership.
- The official product warns X Layer contracts are in a test phase and not independently audited.
- X Layer Container asset withdrawal is not currently wired into the product UI.
- DeWEB and TapeSend cannot be placed in the MVP completion path yet.
- A `tape://...` format must not be generated from guessed components. The canonical network-wide naming format needs official documentation and a verified real circuit.

## Test transaction

No state-changing transaction was sent.

Read-only product verification passed: the official site exposes X Layer/Base processor views and a circuit Container open/inspect flow, with explicit test-phase and feature-limit warnings.

`createContainer()` was not tested because it would spend gas/opening fees and requires a user-selected real circuit. TapeSend could not be tested because no supported public integration surface was found.

## Source

- [TapeOut official product](https://www.tapeout.net/)
- [TapeOut official whitepaper](https://www.tapeout.net/TapeOut-Protocol.pdf)
- [Official X Layer mainnet details: chain ID 196 and RPC URLs](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information)
