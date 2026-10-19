# Reclaim Labs

Reclaim Labs is a source-traceable recovery preparation companion for India. The launch build covers exactly two official destinations:

- **IEPF** for unclaimed shares and dividends, with a family/heir assessment and route distinction between a possible company/RTA suspense path and a possible IEPF/MCA path.
- **RBI UDGAM** for preparing an official unclaimed-deposit search.

It does not confirm that an asset exists, estimate a recovery amount, file a claim, hold money, submit documents, act as a middleman, or guarantee an outcome.

## Current implementation

This is a dependency-free Node 22 web app. The browser uses local demo persistence only; there is no authentication, database, document upload, portal scraping, or government-portal credential handling. Every screen carries a synthetic-demo banner.

The rules engine is in `src/domain/rules.mjs`. Source records are in `src/domain/sources.mjs`. The assistant is currently a deterministic, source-labelled fallback. The Qwen3-8B boundary is documented and kept server-side, but no provider endpoint is configured.

## Requirements

- Node.js 22.14.0, pinned in `.nvmrc`.
- npm bundled with Node.
- No external npm packages are required.

The current OmniRush worker did not have Node.js or Docker installed, so full Node and container checks are explicitly marked blocked in `docs/status.md`. The POSIX static smoke suite can still run in the worker.

## Setup

```sh
npm ci
```

There are no runtime dependencies; `npm ci` verifies the lockfile and creates the local project installation directory without a global install.

## Run

```sh
npm start
```

Open <http://localhost:3000>. The server is a small Node built-in HTTP server and serves only the `public/` directory.

## Test

The one project test command is:

```sh
sh ./test.sh
```

With Node.js, it runs the full Node test suite (`node --test`) covering deterministic routes, source IDs, confidence boundaries, checklist safety, UDGAM preparation, status transitions, progress, fallback citations, and unsupported-answer rejection. Without Node.js, it runs the available offline static smoke suite and says that behavioral tests remain blocked.

## Docker build and run

```sh
docker build -t reclaim-labs .
docker run --rm -p 3000:3000 reclaim-labs
```

The Docker build runs `npm test` in the checks stage before producing the runtime image.

## Deployment

Deploy the container to an approved host that supports a Node 22 container, or deploy the `public/` assets together with the read-only `src/domain/` modules under the `/src/` URL path. Set `PORT` only if the host requires a different listen port. Do not put `QWEN_API_KEY` in the browser or in a public environment variable.

## Qwen3-8B status

The permitted model identifier is `Qwen/Qwen3-8B`. The repository contains `.env.example` placeholders and a structured fallback boundary, but it does not claim live Qwen inference. A future server adapter must validate the provider, rate-limit requests, retrieve approved source excerpts, validate source IDs and output status, reject unsupported claims, and fall back on timeout/error. See `docs/architecture.md` and `docs/known-limitations.md`.

## Repeatable demo walkthrough

1. Start in synthetic demo mode and read the trust boundary.
2. Choose **IEPF**, select **Family / heir**, and choose either **Already with IEPF** or **Company/RTA suspense**. Leave custody unknown once to see the information gap state.
3. Answer only whether family/heir evidence is available; do not enter sensitive documents.
4. Review the route, confidence label, evidence gaps, source chips, and preparation checklist.
5. Open the official IEPF/MCA destination yourself, then create a demo case.
6. Open **Tracker**, check preparation items, and advance the case through the allowed statuses.
7. Reset demo data from **Privacy** to repeat the flow.
8. Try **UDGAM** and confirm that the app prepares the search without collecting an account number or credentials.
9. Ask the assistant about UDGAM or IEPF. The UI identifies the deterministic fallback; it does not pretend Qwen is connected.

## Project records

- `docs/initial-audit.md` — evidence-based Stage 1 audit.
- `docs/requirements.md` — frozen revised scope.
- `docs/architecture.md` — actual architecture and trust boundaries.
- `docs/source-register.md` — source register and verification gaps.
- `docs/status.md` — implementation and test status.
- `docs/known-limitations.md` — blocked and unverified work.
- `docs/backlog.md` — deferred work and revival conditions.
