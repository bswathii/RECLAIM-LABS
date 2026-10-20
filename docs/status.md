# Implementation and test status

**Last updated:** 2026-10-20

## Stage status

| Stage | Status | Evidence |
| --- | --- | --- |
| Stage 1 — audit and scope freeze | Complete | `docs/initial-audit.md`, `docs/requirements.md`, and source research notes |
| Stage 2 — verified source corpus | Partial | RBI FAQ/NSDL guidance support published preparation routes; IEPF/MCA detail is blocked. DFS title-only content remains hidden; IRDAI/MITRA are research-only. Source access A–E findings and manual review process are recorded. |
| Stage 3 — IEPF family/heir vertical slice | Implemented locally | Explicit self/family choice, deterministic custody routing, four-part result, source-labelled route checklist, official handoff links where appropriate, and local case creation are implemented |
| Stage 4 — UDGAM preparation journey | Implemented locally | RBI-backed search-input preparation, official handoff, checklist, and local case creation are implemented |
| Stage 5 — progress and family organizer | Partial | Real/local and isolated demo cases, reviewed items, independent evidence/link-click/submission/response/recovery reports, legacy user-reported status timeline, Home summary, family-role labels, review dates and namespace-specific deletion. Shared access/notifications remain backlog. |
| Stage 6 — Qwen3-8B integration | Blocked / boundary ready | Endpoint/key missing; exact-model/browser-exposure checks pass and deterministic fallback is tested. No inference attempted. |
| Stage 7 — security and regression | Implemented locally / browser partial | 57 Node tests cover domain, actual-controller persistence/isolation/language/drafts/storage failures, fallback and HTTP security. Document/storage boundaries are stubbed; full browser/native action/layout checks remain open. |
| Stage 8 — demo readiness | Partial | Five-destination UI, English/Hindi core copy, isolated labelled demo, reset confirmation, fallback, non-root Docker configuration and health endpoint present; real browser interaction and Docker runtime unverified. |
| Catalogue discovery | Implemented locally | Four published records across two route families; one review-only record hidden. Search/filter/provenance/details, conservative user-evidence relevance, conflicts and case saving have Node coverage; no individual registry search. |
| Discovery utility / monetization | Instrumentation only | Optional local elapsed-time/self-report collection and a counterbalanced official-source comparison protocol exist. No participants, demonstrated improvement, paid feature, RevenueCat integration or purchase test. |

## Checks

- `sh ./test.sh` with pinned Node **22.14.0** on PATH: **57 passed, 0 failed, 0 skipped**, all offline. `node --test --test-reporter=spec` also passed. Baseline before catalogue work was 23 tests.
- `sh ./test.sh` without Node on PATH: static smoke **passed**. This is a reduced fallback, not a behavioral-suite pass.
- `npm run catalogue:check` / `node scripts/check-catalogue.mjs`: **passed**, four published records, one under review. No source refresh, individual lookup or date update performed.
- `npm run qwen:check` / `node scripts/check-qwen-config.mjs`: **expected blocker exit 1**; exact model valid, browser exposure PASS, endpoint/key missing, inference not attempted.
- `npm ci --ignore-scripts --offline`: **passed**, using pinned Node 22.14.0 and the installed npm CLI. The temporary runtime's own npm copy was incomplete (`node-gyp` missing); using the intact installed npm CLI succeeded without repository/global changes. There are no external packages.
- HTTP smoke against the running server: **200** for `/`, `/healthz`, `/app.mjs`, `/styles.css` and the three new domain modules (`opportunities`, `opportunity-copy`, `case-events`). Malformed-URL/traversal regression tests also pass.
- Built-in browser preview: Home rendered, including real/local mode copy in the catalogue pass. Earlier Home observation was at a narrow 310px viewport. Click dispatch timed out; full browser journeys/downloads/focus/layout remain unverified. Controller tests are not browser evidence.
- Docker build: **blocked**; Docker is not installed in the worker.

## Language status

- English: core workflow/catalogue copy implemented and translation-call coverage tested.
- Hindi: core copy, catalogue details/preparation prompts and state continuity tested through selected controller paths; native-language procedural review remains open. Original official excerpts remain in source language, and some UI strings are controller-local bilingual literals rather than dictionary keys.
- Kannada: not advertised; intentionally incomplete/deferred.
