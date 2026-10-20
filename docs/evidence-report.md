# Reclaim Labs — real-value and reproducibility evidence report

**Report date:** 2026-10-20 (Asia/Calcutta)

## Evidence classes

This report separates:

- **Public fact:** a statement visible in an approved official source.
- **Synthetic case:** fictional claimant context and answers exercised by automated tests or the walkthrough.
- **Simulated outcome:** a local preparation state or user-reported event; not an institution result.
- **Real-user observation:** a session performed by a person other than the implementer and recorded with consent.
- **Independently verified real case:** an institution-confirmed search, claim, amount, submission, or recovery.

Only the first two classes are currently available for the recovery cases below. There are **no recorded real-user sessions, no independently verified claimant cases, no submitted claims, and no recovery amounts**. The project does not claim that a simulated preparation case recovered money.

## Public source evidence

| Source | Current observation | Product boundary |
| --- | --- | --- |
| RBI UDGAM FAQ — [RBI FAQ](https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3579) | Public fetch returned the FAQ dated **March 5, 2024**. It describes UDGAM as a centralized search facility for participating banks, says registration uses name/mobile, lists individual search inputs, and says claims are made through the respective bank. | Reclaim Labs asks only whether preparation information is available; it does not collect PAN, account values, credentials, or search results. |
| RBI UDGAM portal — [UDGAM](https://udgam.rbi.org.in/) | Official portal destination is listed and the public application shell was reachable in the prior source investigation. | Reclaim Labs opens the destination; it does not reproduce or assert a search result. |
| NSDL investor guide — [NSDL guide](https://nsdl.com/an-investors-guide-to-claim-unclaimed-shares-and-dividends) | Public fetch returned the investor guide page. The page describes old/unclaimed shares and dividends, IEPF transfer context, and an official-process guide; the fetched page reported **Last Updated: 20 October 2026**. | The guide is general information. Current IEPF/MCA/company/RTA instructions still require institution confirmation. |
| IEPF Authority / MCA | Official destinations are recorded, but the research fetcher previously received HTTP 403. | Destination links are handoff links, not proof that current page text or document requirements were verified. |

The source register contains exact URLs, access dates, support statements and open questions in `docs/source-register.md`. Source dates do not mean that Reclaim Labs monitors an individual financial record.

## Recovery-preparation cases

### Case A — inherited shares/dividends, custody unknown

| Field | Evidence |
| --- | --- |
| Case class | **Synthetic claimant context**, modeled on the documented IEPF family/heir route. No real person or company record used. |
| Inputs | Claimant = heir; custody = unknown; no company/RTA name; death-certificate and heir-authority evidence unavailable. |
| Expected behavior | Do not select a legally meaningful route by default. Explain that custody must be checked; show missing information; retain source-labelled preparation items. |
| Observed behavior | `assessIepf()` returns route `verify-custody`, confidence `needs-more-information`, four missing-information items, and `isOfficiallyConfirmed: false`. The checklist contains `confirm-route`, `heir-evidence`, `issuer-reference`, and `official-handoff`. `tests/integration.test.mjs` verifies the assessment/checklist/source retention. |
| Handoff/tracking | The user can inspect the official IEPF/MCA destinations, review checklist items, create a local case, and track reviewed items/status. The timeline is local preparation/user-report state, not an institution receipt. |
| Value hypothesis | Removes the need to decide between company/RTA and IEPF/MCA before the user knows custody; makes the information gap explicit. **Not measured with real users.** |
| Limitation | IEPF/MCA procedural pages were not readable to the research fetcher; no filing or eligibility result was verified. |

### Case B — old bank deposit, missing bank and additional identifier

| Field | Evidence |
| --- | --- |
| Case class | **Synthetic UDGAM preparation case**, grounded in the RBI FAQ. No account number, PAN, name, credential, or search result entered. |
| Inputs | Holder-name availability = yes; bank = no; additional identifier/address = no. |
| Expected behavior | Identify UDGAM as the official search route, expose the two missing preparation items, never ask for or store their sensitive values, and distinguish search from claim settlement. |
| Observed behavior | `buildUdgumPlan()` returns `needs-more-information`, missing `Bank name` and `Additional identifier or address`, no `accountNumber` field, and `isOfficiallyConfirmed: false`. The checklist and case retain RBI FAQ/portal sources. `tests/integration.test.mjs` verifies these conditions; controller tests verify save/reload and portal-click independence. |
| Handoff/tracking | The user opens the official UDGAM destination, returns, saves a local preparation case, reviews checklist items, reports a link click or later action separately, and can choose an in-app review date. No submission or result is inferred. |
| Value hypothesis | Turns a broad “old account” problem into a concrete preparation list and official next action. **No completion-time or recovery improvement has been measured.** |
| Limitation | UDGAM itself was not searched by the app; no participating-bank result or claim outcome is represented. |

### Case C — IEPF route already suspected, but documents are incomplete

| Field | Evidence |
| --- | --- |
| Case class | **Synthetic family/heir case** with custody `iepf`, company label present, death-certificate and heir-authority availability incomplete. |
| Expected behavior | Keep the IEPF route deterministic, show route-specific preparation items, and never infer eligibility, amount, deadline, ownership or filing success. |
| Observed behavior | `assessIepf()` returns the IEPF route and `suggested-route` confidence, while `buildIepfChecklist()` keeps evidence and official-handoff items. The rules tests verify no amount/deadline/guarantee language. The UI preserves the draft and reviewed checklist state through navigation/language changes. |
| Value hypothesis | Separates “I know the likely route” from “I have the required evidence ready.” **No real claimant test performed.** |
| Limitation | Route guidance is preparation only; current authority/company/RTA requirements must be checked directly. |

## False-match and inapplicable checks

| Scenario | Expected | Observed evidence |
| --- | --- | --- |
| Institution/product words only, such as RBI + unclaimed deposits | Topical relevance only; not a personal match. | `tests/opportunities.test.mjs` and `tests/app-flow.test.mjs` verify `relevant-opportunity` and `isIndividualMatch: false`. |
| User explicitly reports an old statement that relates to the selected institution/product | A potential personal match may be suggested as **user evidence only**, never an official result. | Opportunity/controller tests verify the explicit evidence threshold and `isOfficiallyConfirmed: false`; the UI states the app did not read or verify the document. |
| Evidence is marked conflicting | Insufficient information must override the evidence signal. | Domain/controller tests verify `conflicting-evidence` precedence and the insufficient state. |
| DFS title-only gateway or under-review source | Hidden from default discovery and cannot be saved as an actionable case. | Catalogue tests verify one under-review record is excluded and save is rejected. |
| Unsupported question or unrelated recovery category | Refuse or fall back to approved source corpus; never invent a route. | Assistant fallback tests verify out-of-corpus refusal; catalogue tests verify no-result behavior. |

## Measurable value: what is and is not demonstrated

**Demonstrated by automated evidence:** deterministic route selection, missing-information disclosure, source retention, checklist progress, local case continuity, explicit uncertainty, false-match boundaries, safe official handoff, discoverability of journeys A/B/C, and the end-to-end synthetic judge demo. The current suite has 69 passing tests on Node 22.14.0.

**Not demonstrated:** faster discovery, higher task completion, improved comprehension, successful claims, recovery rates, recovered amounts, legal eligibility, institution-confirmed outcomes, real-user satisfaction, or conversion. `docs/manual-usability-test.md` contains a counterbalanced Reclaim Labs versus official-source-only protocol with time-to-route, next-action comprehension and false-positive measures. No participant data has been collected.

## Docker reproducibility evidence

### Verification in this environment

Docker Desktop 4.96.0 was available with a `linux/arm64` engine. `docker build --no-cache -t reclaim-labs:local .` completed successfully using the multi-architecture `node:22.14.0-bookworm-slim` base. The build-stage `npm test` reported 69 passing tests. A detached container was started on host port 3138; `/`, `/healthz`, and `POST /api/assistant` returned HTTP 200, with the assistant using `provider: "deterministic-fallback"` because no Qwen endpoint/key was supplied. A second container was held for eight seconds and reported Docker health status `healthy`; its `/healthz` returned HTTP 200. Logs showed `Reclaim Labs is running at http://localhost:3000`. Both containers were stopped and removed after verification.

### Reproduction commands for a machine with Docker

Run from the repository root:

```sh
docker build --no-cache -t reclaim-labs:local .
docker run -d --name reclaim-labs-test -p 3000:3000 --env QWEN_MODEL=Qwen/Qwen3-8B --env QWEN_ENDPOINT= --env QWEN_API_KEY= reclaim-labs:local
curl -fsS http://127.0.0.1:3000/healthz
curl -fsS http://127.0.0.1:3000/ | grep -F "Reclaim Labs"
curl -fsS -X POST http://127.0.0.1:3000/api/assistant -H 'content-type: application/json' --data '{"question":"How does UDGAM work?","language":"en"}'
docker inspect --format '{{.State.Health.Status}}' reclaim-labs-test
docker logs reclaim-labs-test
docker stop reclaim-labs-test
docker rm reclaim-labs-test
docker build --no-cache -t reclaim-labs:local-rebuild .
```

Expected fallback response includes `provider: "deterministic-fallback"`, a source-backed UDGAM answer, and no key/authorization/endpoint. The health response is `{"ok":true,"service":"reclaim-labs"}`. Do not put a real key in shell history; use a protected environment or secret mechanism only when testing a real provider. The Dockerfile runs `npm test` in its checks stage, copies the server-only adapter/configuration, runs as the non-root `node` user, and defines a `/healthz` healthcheck.

## Verification classification

- **Automated tests:** 69 passing offline on pinned Node 22.14.0.
- **Live public-source fetches:** RBI UDGAM FAQ and NSDL guide fetched and inspected; IEPF/MCA procedure remains access-blocked.
- **Simulated cases:** Cases A–C and false-match scenarios above; all claimant details are synthetic.
- **Real-user tests:** none.
- **Independently verified real-case outcomes:** none.
- **Live Qwen provider:** not verified in this environment; credentials/provider access are not part of the evidence above.
- **Docker:** verified on Windows ARM64 Docker Desktop for build, 69-test build stage, container HTTP smoke, deterministic fallback, non-root runtime configuration and healthy healthcheck. A full visual browser click-through inside the container remains unverified.
