# Implementation and test status

**Last updated:** 2026-10-20

## Stage status

| Stage | Status | Evidence |
| --- | --- | --- |
| Stage 1 — audit and scope freeze | Complete | `docs/initial-audit.md`, `docs/requirements.md`, and source research notes |
| Stage 2 — verified source corpus | Partial | RBI records are verified; IEPF/MCA records are official destinations with access blocked in the audit |
| Stage 3 — IEPF family/heir vertical slice | Implemented locally | Explicit self/family choice, deterministic custody routing, four-part result, source-labelled route checklist, official handoff links where appropriate, and local case creation are implemented |
| Stage 4 — UDGAM preparation journey | Implemented locally | RBI-backed search-input preparation, official handoff, checklist, and local case creation are implemented |
| Stage 5 — progress and family organizer | Partial | Local demo Cases destination, reviewed-item counts, user-reported action/submission/resolution statuses, timeline, Home summary, and reset/export controls are implemented; shared family records remain backlog |
| Stage 6 — Qwen3-8B integration | Blocked / boundary ready | No provider endpoint or credential is configured; deterministic fallback is required and will be tested |
| Stage 7 — security and regression | Implemented locally / browser partial | Node tests cover domain, i18n, fallback, malformed URLs, health, traversal, and status semantics; static smoke passes. Browser storage-failure and full click-through remain manual work. |
| Stage 8 — demo readiness | Partial | Five-destination responsive UI, English/Hindi dictionaries, visible demo mode, reset confirmation, fallback states, non-root Docker configuration, and health check are present; Docker runtime remains unverified. |

## Checks

- `sh ./test.sh`: **passed** in the default worker PATH; it ran the POSIX smoke suite because Node.js is not on that PATH.
- `PATH=<pinned Node 22.14.0> npm.cmd test`: **passed**, all 13 behavioral tests.
- `PATH=<pinned Node 22.14.0> sh ./test.sh`: **passed**, all 13 behavioral tests.
- `npm ci --ignore-scripts`: **passed** with the temporary pinned Node 22.14.0 runtime; there are no runtime dependencies.
- `node server.mjs` + HTTP smoke: **passed** for the index, browser domain-module delivery, `/healthz`, and source-path traversal rejection.
- Built-in browser preview: **Home rendered successfully at 310px viewport** with five navigation controls, language selector, trust copy, and both journey cards. Browser click dispatch timed out, so full interactive browser journeys remain unverified.
- Docker build: **blocked**; Docker is not installed in the worker.

## Language status

- English: implemented and translation-call coverage tested.
- Hindi: implemented and translation-call/key-parity coverage tested; native-language procedural review remains recommended.
- Kannada: not advertised; intentionally incomplete/deferred.
