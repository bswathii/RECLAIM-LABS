# Stage 1 audit — Reclaim Labs

**Audit date:** 2026-10-19 (Asia/Calcutta)
**Repository:** `C:\Users\bswat\Desktop\reclaim labs`
**Requested remote:** `https://github.com/bswathii/RECLAIM-LABS`

## Existing implementation

The directory was empty apart from the Git metadata and OmniRush attachment inbox when the audit began. There was no application source, package manifest, lockfile, README, test suite, environment example, build configuration, or entry point to preserve. The attached blueprint is a specification only; it explicitly says that it does not produce code, UI, or assets.

The attachment is intentionally not committed. `.opencode/` is ignored because it is worker/session material rather than product source.

## Git and repository evidence

- Git was initialized before this audit.
- The branch is `main`.
- `origin` is configured for fetch and push at `https://github.com/bswathii/RECLAIM-LABS`.
- There are no commits yet.
- No push is being performed: publishing requires an explicit user request.

## Environment evidence

Available in the worker shell:

- Git 2.56.0 for Windows.
- Bash, POSIX `sh`, and Perl.

Unavailable in the worker shell at audit time:

- Node.js and npm.
- Python.
- Docker.

The project therefore pins Node 22.14.0 and includes a Dockerfile for a clean Linux build, while the local smoke test remains runnable with the available POSIX shell. Full Node tests are marked blocked until Node or Docker is available.

## Source research evidence

- RBI's UDGAM FAQ was fetched successfully. It states that UDGAM is a search facility, not the claim-settlement channel; claims are made with the respective bank. It also lists the information categories needed for an individual search. See `SRC-RBI-UDGAM-FAQ` and `SRC-RBI-DEA-FAQ`.
- RBI's DEA Fund FAQ was fetched successfully and provides the 10-year transfer rule, the bank/legal-heir claim path, and the absence of a specific claim time limit in the scheme.
- `https://www.iepf.gov.in/` and `https://www.mca.gov.in/` returned HTTP 403 to the research fetcher. They are retained as official destinations, but IEPF/MCA procedural details are not marked verified in this build. The UI tells users to confirm current instructions on the official destination rather than presenting blocked-page assumptions as facts.
- No buildathon rules or submission instructions were present in the repository. Platform, hosting, and model requirements not stated in the supplied prompt remain unverified.

## Scope reconciliation

The supplied blueprint proposed five launch categories and a broader MVP. The revised product specification supersedes it:

| Blueprint proposal | Frozen decision |
| --- | --- |
| Five-category launch | Exactly two categories: IEPF shares/dividends and RBI UDGAM bank deposits |
| Discovery as aggregation | User-initiated official search preparation; no scraping or registry API assumption |
| Recovery-value hook | Honest progress, gaps, next action, timeline, and reminders; no amount estimates |
| AI as broad recovery assistant | Qwen3-8B is an optional server-side explanation layer only; deterministic rules own routing and status |
| Payment, filing, WhatsApp, native app | Deferred unless separately verified and required |
| Automatic notices/deadlines | Deferred; only user-created reminders until a verified notice source exists |
| Sensitive uploads/credentials | Excluded from MVP |

## Minimal implementation sequence

1. Freeze the source register and trust labels.
2. Implement a pure IEPF assessment/routing module for holder and family/heir scenarios.
3. Render the IEPF journey with route-specific preparation prompts and official handoff.
4. Add local demo-only case persistence, status transitions, progress, and timeline.
5. Add the UDGAM search-preparation journey using the verified RBI FAQ.
6. Add an explicitly labelled deterministic assistant fallback and a server-side Qwen adapter boundary without exposing credentials.
7. Run Node tests in a pinned environment and the local static smoke test in this worker.

## First vertical-slice acceptance criteria

- A stranger can choose IEPF, select a family/heir scenario, answer custody questions, and see a deterministic route.
- The route is labelled `possible match` or `needs more information`, never confirmed.
- The checklist distinguishes user acknowledgement from official verification and links to the source register.
- The official IEPF/MCA destination can be opened without Reclaim Labs claiming to file anything.
- A case can be created once, reopened from the tracker, and advanced only through valid statuses.
- A UDGAM user can prepare a search plan and open the RBI portal without entering account numbers, passwords, OTPs, or credentials.
- Demo mode is persistent and visible; reset removes only local demo data.
