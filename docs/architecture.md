# Reclaim Labs — actual architecture

## Current shape

The first implementation is a dependency-free, responsive web application with exactly five primary destinations: Home, Discover, Cases, Assistant, and Settings.

- `public/index.html` is the browser entry point.
- `public/styles.css` contains the accessible visual system and responsive layout.
- `public/app.mjs` renders the views and handles browser interactions.
- `src/domain/i18n.mjs` is the centralized English/Hindi dictionary. Kannada is intentionally not advertised until the core experience is fully translated and reviewed.
- `src/domain/rules.mjs` is a pure deterministic rules module for IEPF routing, UDGAM preparation, checklists, progress, and case transitions.
- `src/domain/sources.mjs` is the structured, versioned source register used by the UI and tests.
- `src/domain/assistant.mjs` implements the structured deterministic fallback used by browser code.
- `server/qwen-config.mjs` is an unserved, server-only Qwen configuration/status boundary. It does not call a provider.
- `server.mjs` is a small Node built-in HTTP server for local use and Docker; there are no runtime npm dependencies.
- `tests/` contains Node tests for domain behavior and a POSIX smoke test for environments without Node.

## Trust and data flow

1. User input is limited to workflow choices and optional non-sensitive labels.
2. The rules module maps structured answers to a route; the assistant cannot change that route.
3. Source records carry a source ID, URL, access date, status, excerpt/paraphrase, and open questions.
4. User-facing route guidance separates verified RBI facts from IEPF/MCA destination links whose page content was blocked during this audit.
5. Demo case state is namespaced under `reclaim-labs-demo-v1` in local storage. A reset requires confirmation and removes that namespace only.
6. Checklist state means `reviewed`; status state separately means preparing, user-reported action, user-reported submission, or user-reported resolved. An institution-confirmed state is reserved for a future genuine integration.
7. Every status transition is validated by the pure state machine before it is saved.

## AI boundary

The permitted model is `Qwen/Qwen3-8B`. `server/qwen-config.mjs` reads only server-side environment values, validates that exact model identifier, reports endpoint/key presence without returning their values, and scans the browser-served `public/` and `src/domain/` roots for Qwen configuration markers. The browser build uses only the deterministic fallback and labels it as such. No API key, endpoint, or model placeholder is read by client code. `npm run qwen:check` is an offline check and never calls inference.

## Intentional simplifications

- No authentication, database, RLS, uploads, or institutional status integration.
- The five-destination shell is client-rendered and uses the same case state for Home and Cases.
- No scraping or portal credential storage.
- No automatic notice monitoring or personalized deadline inference.
- No payment, filing, or percentage-of-recovery flow.
