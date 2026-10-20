# Reclaim Labs — current launch scope

## Product promise

Reclaim Labs is a guided recovery and financial-organization layer around official Indian institutions. It helps a person understand where to search, prepare non-sensitive information, open the correct official destination, and keep a coherent follow-up record. It does not hold money, file a claim, act as a middleman, or confirm eligibility.

## Launch categories

1. **Unclaimed shares and dividends — IEPF**: the flagship family/heir workflow. The product distinguishes a possible company/RTA suspense-account route from a possible IEPF/MCA route, but the user must confirm the actual status with the relevant institution. The UI exposes both the deceased-family-member journey and the explicit uncertain-custody journey.
2. **Unclaimed bank deposits — RBI UDGAM**: a search-preparation workflow. UDGAM search results do not equal an approved or paid claim.

No EPF, insurance, post-office, mutual-fund, or other recovery workflow is in launch scope. IRDAI/MITRA sources are research-only; their presence in the source directory is not a working claim journey.

## Required user-visible behavior

- Explain the trust posture on the landing page.
- Ask only non-sensitive, workflow-relevant questions.
- Distinguish topical `relevant opportunity`, explicit-user-evidence-only `potential personal match`, `insufficient information`, and a catalogue no-match. Never describe a catalogue search as an individual asset lookup. A selected bank/product alone cannot be a personal match; conflicts override evidence confirmation. No source-confirmed individual match is available.
- Never display a recovered amount, a guarantee, a fabricated deadline, or an official confirmation.
- Provide source links and verification status beside procedural guidance.
- Publish only source-backed records with provenance, dates, evidence prompts, next official action, and limitations. Keep under-review records out of discovery and case creation.
- Let the user create a local preparation case, review next actions, report evidence/link-click/submission/response/recovery separately, and choose an in-app review date and family-role label. Reports are not independent confirmations.
- Start in real-catalogue/local-record mode. Keep synthetic demo in a separate namespace, with `DEMO DATA — NOT A REAL FINANCIAL MATCH` on every demo screen. Confirm deletion and preserve the other mode.
- Provide an explicit fallback when the Qwen endpoint is not configured.
- Measure discovery utility before monetization through optional local timed tasks and a documented comparison protocol, without claiming a completed study. Official routes stay free; there is no working premium purchase or RevenueCat entitlement.

## Data boundary

The MVP must not request Aadhaar, PAN, bank account numbers, passwords, OTPs, government-portal credentials, document text/uploads, or family names. Personal-evidence confirmation is a user report, not extraction or inspection. Local preparation state and synthetic demo state use isolated browser-local namespaces; there is no cloud sync, app-level encryption, server database or authentication.

## Acceptance boundary

The acceptance task is to discover a relevant route, explain the next official action and remaining uncertainty, save/revisit a case, and keep reports distinct from official outcomes. The deceased-family-member IEPF, UDGAM preparation, and uncertain-custody slices must all be discoverable and work. Automated controller/domain tests support these behaviors; browser click-through and independent participant comprehension remain separate verification gaps.
