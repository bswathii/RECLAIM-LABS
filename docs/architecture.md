# Reclaim Labs — actual architecture

## Current shape

The first implementation is a dependency-free, responsive web application with exactly five primary destinations: Home, Discover, Cases, Assistant, and Settings.

- `public/index.html` is the browser entry point.
- `public/styles.css` contains the accessible visual system and responsive layout.
- `public/app.mjs` renders the views and handles browser interactions.
- `src/domain/i18n.mjs` contains core English/Hindi dictionaries; `opportunity-copy.mjs` localizes catalogue records and the controller contains some bilingual UI strings. Official excerpts remain in their original language. Kannada is not advertised.
- `src/domain/opportunities.mjs` is the versioned editorial catalogue and pure search/relevance layer. Publication status is separate from source-verification status and opportunity type.
- `src/domain/case-events.mjs` records independent user reports, mode filtering and user-chosen review dates without promoting reports into official status.
- `src/domain/rules.mjs` is a pure deterministic rules module for IEPF routing, UDGAM preparation, checklists, progress, and case transitions.
- `src/domain/sources.mjs` is the structured, versioned source register used by the UI and tests.
- `src/domain/assistant.mjs` implements the structured deterministic fallback used by browser code.
- `server/qwen-config.mjs` is an unserved, server-only Qwen configuration/status boundary. It does not call a provider.
- `server.mjs` is a small Node built-in HTTP server for local use and Docker; there are no runtime npm dependencies.
- `tests/` contains pure domain tests, actual-controller integration tests with document/storage stubs, real HTTP tests, and a reduced POSIX static fallback when Node is unavailable. No browser layout is exercised by the Node controller harness.

## Trust and data flow

1. User input is limited to workflow choices, optional non-sensitive clues, evidence availability and explicit self-reports. No document text or personal identifier values are requested.
2. The catalogue search finds published routes; relevance scoring explains topical fields. Institution/product words alone never establish ownership. Only sufficient topical relevance plus explicit personal-evidence confirmation can suggest a user-evidence-only lead. Conflicts take precedence. Neither search nor scoring calls a live individual database. The workflow rules map structured answers to a route; the assistant cannot change that route.
3. Source records carry a source ID, URL, access date, status, excerpt/paraphrase, and open questions.
4. User-facing route guidance separates verified RBI facts from IEPF/MCA destination links whose page content was blocked during this audit.
5. Real/local mode is the default and uses `reclaim-labs-local-v2`; isolated demo uses `reclaim-labs-demo-v1`. Strict case flags prevent cross-mode display. Confirmed reset removes the active namespace only. Storage failures are explained; in-memory navigation continues. Local storage is neither encryption nor multi-user access control.
6. Checklist state means `reviewed`; the legacy case state machine separately means preparing, user-reported action, submission, or resolution. Institution-confirmed is not exposed and is normalized away when loading local case data. Each transition is validated by the pure state machine.
7. Independent evidence-collected, portal-opened, submission-reported, response-reported and recovery-reported events have timestamps and provenance. They do not advance that state machine or imply earlier events occurred. `portal-opened` means a click was observed, not a verified page load; no success amount is collected or inferred.
8. Cases can retain source IDs, the assessment, reviewed items, a family-role label and a user-selected next-review date. Home and Cases derive summaries from the same mode-local records. The date is not a legal deadline, notification or background job.
9. Optional timed discovery tasks save local elapsed time and self-reported relevance/comprehension. Event counts are local cases, not users or independently verified outcomes. There is no server analytics pipeline or completed comparative study. JSON export contains cases only.

## Editorial catalogue boundary

Four published records cover two launch categories: two preparation journeys and two search/reference routes. They do not represent four personal assets. The DFS gateway record remains under review and hidden from ordinary results and case creation. Data includes stable IDs, official URLs, source IDs, manual verification dates, source-content dates where known, access class, limitations, and null amounts/deadlines. `npm run catalogue:check` validates metadata offline; it neither refreshes sources nor changes verification dates. See `docs/source-register.md` for the manual review process and research-only insurance/MITRA records.

## AI boundary

The permitted model is `Qwen/Qwen3-8B`. `server/qwen-config.mjs` reads only server-side environment values, validates that exact model identifier, reports endpoint/key presence without returning their values, and scans the browser-served `public/` and `src/domain/` roots for Qwen configuration markers. The browser build uses only the deterministic fallback and labels it as such. No API key, endpoint, or model placeholder is read by client code. `npm run qwen:check` is an offline check and never calls inference.

## Intentional simplifications

- No authentication, database, RLS, uploads, or institutional status integration.
- The five-destination shell is client-rendered and uses the same case state for Home and Cases.
- No scraping or portal credential storage.
- No automatic notice monitoring or personalized deadline inference.
- No payment, filing, or percentage-of-recovery flow.
