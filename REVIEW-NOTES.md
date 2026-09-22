# A2MCP review follow-up — 2026-09-22

The owner requested investigation and resubmission after the fourth rejection.
OKX returned the same generic non-delivery reason. No review request ID, request
body or response was provided, so the specific reviewer failure is unconfirmed.

The official guide https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp says a
free endpoint returns HTTP 200 and its result directly; x402 is for paid calls.
There is no evidence that a free service needs a payment callback or a special
`deliveryStatus` schema. Our previous successful free buyer invocation proves
that one path worked, not that every input produces a satisfactory delivery.

## Reproduced defects

- POST `{ "goaal": "Audit this specific token" }` returned HTTP 200 with a BTC
  example. Unknown fields had been stripped before the empty-object test.
- POST `{ "goal": "Design an agent metaverse community event" }` returned
  unrelated Pokemon-card and ETF services. Ordinary English substrings could
  match service descriptions; English design intent was not recognized.
- The structured plan lacked a concise readable artifact and a prominent
  distinction between delivered planning and unexecuted downstream work.

## Corrections

- Reject unknown fields and missing business goals; reserve example fallback
  for genuinely empty requests/envelopes.
- Recognize English task intents and match nontrivial, non-stopword Latin terms
  as whole tokens. No match remains HTTP 422 rather than a fabricated success.
- Return `delivery.report`, the snapshot timestamp and an explicit declaration
  that no downstream work was executed. Preserve existing plan fields.
- Add result logs containing version, request ID, status and input source/error
  code, without logging customer goals, addresses or raw request bodies.
- Clarify ASP metadata: deliverable is a plan from a dated catalog, not live
  financial research, an audit, or an executed transaction.

## Validation

27 automated tests passed, including executable route tests for empty probes,
Chinese/English matching, unknown fields, invalid JSON, parameter limits and
unsupported goals. The production build succeeded. These checks support the
corrections but do not guarantee acceptance by OKX's reviewer.
