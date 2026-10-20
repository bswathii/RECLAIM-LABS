# Reclaim Labs

Reclaim Labs is a source-traceable recovery preparation companion for India. The launch build covers exactly two financial journeys:

- **IEPF** for unclaimed shares and dividends, with a family/heir assessment and route distinction between a possible company/RTA suspense path and a possible IEPF/MCA path.
- **RBI UDGAM** for preparing an official unclaimed-deposit search.

It does not confirm that an asset exists, estimate a recovery amount, file a claim, hold money, submit documents, act as a middleman, or guarantee an outcome.

## Current implementation

This is a dependency-free Node 22 web app with exactly five primary destinations: **Home, Discover, Cases, Assistant, and Settings**. The browser uses local demo persistence only; there is no authentication, database, document upload, portal scraping, or government-portal credential handling. Every screen carries a synthetic-demo banner.

The rules engine is in `src/domain/rules.mjs`. Source records are in `src/domain/sources.mjs`. The assistant is currently a deterministic, source-labelled fallback. The Qwen3-8B configuration boundary is kept in the unserved `server/` directory; no provider endpoint is configured.

## Requirements

- Node.js 22.14.0, pinned in `.nvmrc`.
- npm bundled with Node.
- No external npm packages are required.

The default OmniRush worker PATH did not include Node.js or Docker. The full Node suite was later verified with a temporary, pinned Node 22.14.0 runtime; Docker remains unavailable. The POSIX static smoke suite also runs without Node.

## Setup

```sh
npm ci
```

There are no runtime dependencies; `npm ci` verifies the lockfile and creates the local project installation directory without a global install.

## Run

```sh
npm start
```

Open <http://localhost:3000>. The server is a small Node built-in HTTP server that serves `public/`, the read-only browser domain modules under `/src/`, and `/healthz`. It rejects malformed encodings and path traversal.

## Test

The one project test command is:

```sh
sh ./test.sh
```

With Node.js, it runs the full Node test suite (`node --test`) covering deterministic routes, source IDs, confidence boundaries, checklist safety, UDGAM preparation, status semantics, progress, English/Hindi translation coverage, fallback citations, unsupported-answer rejection, malformed URLs, health, and path traversal. Without Node.js, it runs the available offline static smoke suite and says that behavioral tests remain blocked.

To validate the Qwen boundary offline without calling an inference provider:

```sh
npm run qwen:check
```

The check validates `QWEN_MODEL` exactly as `Qwen/Qwen3-8B`, scans the browser-served `public/` and `src/domain/` roots for endpoint/model/key markers, withholds configured values, and reports missing `QWEN_ENDPOINT` and `QWEN_API_KEY` as blockers. It exits non-zero while the endpoint or key is absent. It never performs inference.

## Docker build and run

```sh
docker build -t reclaim-labs .
docker run --rm -p 3000:3000 reclaim-labs
```

The Docker build runs `npm test` in the checks stage before producing the runtime image.
The runtime image copies only the server, public assets, and browser domain modules, runs as the non-root `node` user, and exposes a `/healthz` health check. Docker is not installed in the current worker, so an actual image build remains unverified.

## Deployment

Deploy the container to an approved host that supports a Node 22 container, or deploy the `public/` assets together with the read-only `src/domain/` modules under the `/src/` URL path. Set `PORT` only if the host requires a different listen port. Do not put `QWEN_API_KEY` in the browser or in a public environment variable.

## Qwen3-8B status

The permitted model identifier is `Qwen/Qwen3-8B`. The repository contains `.env.example` placeholders and a server-only status boundary, but it does not claim live Qwen inference. Run `npm run qwen:check` to validate the exact model and see the missing endpoint/key blocker without making a network request. A future server adapter must validate the provider, rate-limit requests, retrieve approved source excerpts, validate source IDs and output status, reject unsupported claims, and fall back on timeout/error. See `docs/architecture.md` and `docs/known-limitations.md`.

## Repeatable demo walkthrough

1. Start on **Home** in synthetic demo mode and read the trust boundary.
2. Open **Discover → IEPF**. Explicitly choose **Family / heir**; no legally meaningful option is preselected.
3. Choose **Not sure yet** for custody and leave the company label empty to see the information gap state.
4. Review **Here is the next place to check**, the suggested route, the four evidence sections, sources, and preparation checklist. The app must not call this an asset match.
5. Open the appropriate official destination yourself, then create a local demo case.
6. Open **Cases**, review preparation items, report an external action, report a submission, and optionally mark it resolved by you. These are not institution-confirmed outcomes.
7. Open **Settings** to inspect local-only storage, source status, language, export, and the confirmed reset action.
8. Repeat with **Discover → UDGAM**. Confirm that the app prepares the search without collecting account numbers or credentials.
9. Ask **Assistant** about UDGAM or IEPF. The UI identifies the deterministic fallback and follows the selected English/Hindi language; it does not pretend Qwen is connected.

## Supported languages

English and Hindi cover the complete core experience and are backed by centralized dictionaries and coverage tests. Kannada is intentionally not advertised until it can be fully translated and reviewed for procedural fidelity.

## Storage and privacy

Demo state is stored in `localStorage` under the `reclaim-labs-demo-v1` namespace. It remains in the current browser, is not cloud-synchronized, and may be lost when browser data is cleared. Reset requires confirmation and only removes this demo namespace. Do not enter Aadhaar, PAN, account numbers, passwords, OTPs, government-portal credentials, or document contents.

## Project records

- `docs/initial-audit.md` — evidence-based Stage 1 audit.
- `docs/requirements.md` — frozen revised scope.
- `docs/architecture.md` — actual architecture and trust boundaries.
- `docs/source-register.md` — source register and verification gaps.
- `docs/status.md` — implementation and test status.
- `docs/known-limitations.md` — blocked and unverified work.
- `docs/backlog.md` — deferred work and revival conditions.
- `docs/blueprint-compliance-audit.md` — requirement matrix with evidence, status, risk, and blockers.
- `docs/manual-usability-test.md` — repeatable first-time-user, multilingual, keyboard, and responsive test plan.
