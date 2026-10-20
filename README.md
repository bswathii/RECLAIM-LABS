# Reclaim Labs

Reclaim Labs is a source-traceable recovery preparation companion for India. The launch build covers two financial categories through three discoverable preparation journeys:

- **IEPF** for unclaimed shares and dividends, with a family/heir assessment and route distinction between a possible company/RTA suspense path and a possible IEPF/MCA path.
- **RBI UDGAM** for preparing an official unclaimed-deposit search.

The three entry journeys are: **A — deceased family member's shares/dividends**, **B — an individual's potentially unclaimed bank deposit**, and **C — an uncertain share-recovery route where custody is not known**. Journey C uses the IEPF custody-verification flow and never redirects an uncertain share case into UDGAM.

It does not confirm that an asset exists, estimate a recovery amount, file a claim, hold money, submit documents, act as a middleman, or guarantee an outcome.

## Current implementation

This is a dependency-free Node 22 web app with exactly five primary destinations: **Home, Discover, Cases, Assistant, and Settings**. It opens in real-catalogue/local-preparation mode. A separate, explicitly labelled synthetic demo is available from the header. Neither mode is connected to individual asset records.

- **Discover:** search English/Hindi clues, filter category and verification status, inspect provenance and preparation prompts, open the official destination, and save a case. Four published records represent two core preparation journeys and two reference/search routes across the same two categories, **not four separate recoverable assets**. The Home and Cases screens also expose all three judge journeys, including the uncertain-custody variant. A DFS gateway entry remains under review and hidden.
- **Relevance, not ownership:** institution/product words are topical only. Explicitly reported personal evidence can suggest a potential personal match, never an independently verified match; conflicting evidence yields insufficient information. No document is uploaded or read.
- **Cases:** reviewed preparation items, separate evidence/link-click/submission/response/recovery reports, family-role labels without names, and a user-chosen in-app review date. Link clicks do not prove page load or submission. No amount or official deadline is inferred.
- **Settings:** namespace-specific export/deletion and optional local timed discovery tasks. No participant study or improvement claim exists. The prototype is free; premium/RevenueCat features are hypotheses, not working purchases.

There is no authentication, server database, upload, portal scraping, credential handling, or live individual registry search. Domain data is in `src/domain/opportunities.mjs` and `src/domain/sources.mjs`; workflow rules are in `src/domain/rules.mjs`. The assistant uses the server-only Qwen adapter when configured and the deterministic, source-labelled fallback otherwise.

## Requirements

- Node.js 22.14.0, pinned in `.nvmrc`.
- npm bundled with Node.
- No external npm packages are required.

The full suite is verified on pinned Node 22.14.0. Docker is unavailable in the development worker, so container build/run remains unverified. A POSIX shell and Perl are needed only for the reduced static fallback when Node is absent.

## Setup

```sh
npm ci
```

There are no runtime dependencies; `npm ci` verifies the lockfile and creates the local project installation directory without a global install.

## Run

```sh
npm start
```

Open <http://localhost:3000>. The server is a small Node built-in HTTP server that serves `public/`, the read-only browser domain modules under `/src/`, `/healthz`, and the server-only `POST /api/assistant` route. It rejects malformed encodings and path traversal.

## Test

The one project test command is:

```sh
sh ./test.sh
```

With Node.js, it runs all **69 tests** offline: catalogue provenance/publication, conservative relevance and conflicting evidence, workflow rules, case-event independence, discoverability of journeys A/B/C, the synthetic judge-demo journey, actual-controller persistence/mode isolation/language/draft handling, Qwen adapter request/validation/fallback behavior, and HTTP security/health. The controller harness stubs document/storage boundaries; it is **not a real-browser or layout test**. Without Node.js, the command runs only static smoke and explicitly says behavioral tests remain blocked; that is not a full-suite pass.

To validate the editorial catalogue without fetching live sources:

```sh
npm run catalogue:check
```

This checks publication gates and metadata, not current portal availability. Source investigation and the manual refresh process are in `docs/source-register.md`.

To validate the Qwen boundary offline without calling an inference provider:

```sh
npm run qwen:check
```

The check validates `QWEN_MODEL` exactly as `Qwen/Qwen3-8B`, scans the browser-served `public/` and `src/domain/` roots for endpoint/model/key markers, withholds configured values, and reports missing `QWEN_ENDPOINT` and `QWEN_API_KEY` as blockers. It exits non-zero while the endpoint or key is absent. It never performs inference.

## Docker Desktop build and run

The repository remote is `https://github.com/bswathii/RECLAIM-LABS`. Docker Desktop on Windows ARM64 can build the official multi-architecture `node:22.14.0-bookworm-slim` base image used below. No Qwen endpoint or key is required for the deterministic journeys.

### Fresh clone (PowerShell)

```powershell
git clone https://github.com/bswathii/RECLAIM-LABS.git
Set-Location .\RECLAIM-LABS
```

### Build and start

```sh
docker build -t reclaim-labs .
docker run --rm -p 3000:3000 reclaim-labs
```

PowerShell equivalent, with a named container so logs and stop commands are easy to reproduce:

```powershell
docker build --no-cache -t reclaim-labs:local .
docker run --name reclaim-labs -d -p 3000:3000 --env PORT=3000 reclaim-labs:local
Start-Process "http://localhost:3000"
```

Or use the checked-in Compose file:

```powershell
docker compose up --build
Start-Process "http://localhost:3000"
```

The server listens on `0.0.0.0` inside the container and the host port is `3000`. The application uses browser-local storage for preparation cases; the container does not provide a database or multi-user persistence.

### Check, logs, stop, rebuild

```powershell
docker run --rm reclaim-labs:local node --test
Invoke-WebRequest http://localhost:3000/healthz
docker logs -f reclaim-labs
docker stop reclaim-labs
docker rm reclaim-labs
docker compose down
docker build --no-cache -t reclaim-labs:local .
```

If the detached `docker run` command was used, open `http://localhost:3000` in a browser and use the Home cards for journeys A, B, and C. If `docker compose up` is running in the foreground, use another PowerShell window for the browser and health check.

The Docker build runs `npm test` in the checks stage before producing the runtime image.
The runtime image copies the HTTP server, server-only adapter/configuration, public assets, and browser domain modules, runs as the non-root `node` user, and exposes a `/healthz` health check. `QWEN_ENDPOINT` and `QWEN_API_KEY` are intentionally absent from the default Compose/run commands; the deterministic core journeys remain usable. If AI credentials are later configured, pass them only as runtime server environment variables and never bake them into the image.

## Deployment

Deploy the container to an approved host that supports a Node 22 container, or deploy the `public/` assets together with the read-only `src/domain/` modules under the `/src/` URL path. Set `PORT` only if the host requires a different listen port. Do not put `QWEN_API_KEY` in the browser or in a public environment variable.

## Qwen3-8B status

The permitted model identifier is `Qwen/Qwen3-8B`. The server adapter is implemented at `server/qwen-adapter.mjs` and is reached through `POST /api/assistant`; the browser uses that route and falls back locally when it is unavailable or unsafe. `QWEN_ENDPOINT` must be the complete OpenAI-compatible chat-completions URL, and `QWEN_API_KEY` is read only on the server. The adapter sends bounded non-sensitive questions with approved source excerpts, validates returned JSON/source IDs/status/claim language, and falls back on missing configuration, incompatibility, timeout, HTTP/network error, malformed output, or validation failure. `npm run qwen:check` is still an offline configuration check. No real provider request has been verified in this workspace because credentials are absent. See `docs/architecture.md` and `docs/known-limitations.md`.

## Repeatable walkthrough

1. Open **Home** and read the real-catalogue/local-records boundary. The three cards are labelled A, B, and C. For synthetic exploration, switch to the isolated demo; every demo screen says **DEMO DATA — NOT A REAL FINANCIAL MATCH**. Do not use personal records in walkthroughs.
2. Run **Journey A**: open the deceased-family-member IEPF card, choose **Family / heir**, select unknown custody, leave the company label empty, review **Needs more information**, inspect the company/RTA versus IEPF distinction and official sources, acknowledge a checklist item, and create a local case.
3. Run **Journey B**: open the UDGAM card with missing inputs. It asks whether information is available, not for identifiers or account numbers. Confirm that UDGAM is only a search facility and that any claim stays with the relevant bank, then open the official portal and save a local preparation case.
4. Run **Journey C**: open **Uncertain recovery route**. Use the fictional old-document scenario, keep custody unknown, and confirm the app routes to custody verification rather than assuming IEPF or substituting UDGAM. Save and reopen the case.
5. In **Cases**, review items, record separate user reports, choose a review date and family role, then reload. A link click must not mark submission; reports must never become official confirmation. Each case says whether it is demo data or user-reported local data.
6. Switch language mid-workflow, visit another destination, then resume. Answers and reviewed items should survive. Ask **Assistant** a supported question; without credentials it must show the deterministic fallback, while a validated provider response is labelled separately.
7. In **Settings**, inspect local storage, export cases, and cancel/confirm deletion. Switch modes to check the other namespace remains untouched.

See `docs/manual-usability-test.md` for three reproducible discovery paths, keyboard/layout checks, and an official-portal-only comparison protocol. These are test instructions, not participant results.

## Supported languages

English and Hindi cover core navigation, catalogue details, preparation prompts and workflows. Dictionaries, localized catalogue copy and controller-local bilingual strings are used; dictionary parity and selected controller paths are tested. Official source titles/excerpts remain in their original language. Native-language procedural review is still required. Kannada is not advertised.

## Storage and privacy

Real/local preparation state uses `localStorage` namespace `reclaim-labs-local-v2`; the isolated demo uses `reclaim-labs-demo-v1`. Case flags must match the active mode. Reset requires confirmation and removes only the active namespace. Data is not encrypted by this app or cloud-synchronized, and may be lost when browser data is cleared. Export downloads cases, not the full discovery/study state. Do not enter Aadhaar, PAN, account numbers, passwords, OTPs, government-portal credentials, document contents, or family names. Other scripts/users with access to this browser profile can access local storage; this is not a secure document vault.

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
- `docs/evidence-report.md` — source-backed synthetic cases, observed automated behavior, value limitations, and Docker reproduction evidence.
- `docs/judge-demo.md` — the primary synthetic inherited-shares walkthrough and its expected evidence.
- `docs/journeys.md` — the reviewer-facing A/B/C journey map and Docker acceptance walkthrough.
