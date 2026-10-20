# Reclaim Labs — frozen launch scope

## Product promise

Reclaim Labs is a guided recovery and financial-organization layer around official Indian institutions. It helps a person understand where to search, prepare non-sensitive information, open the correct official destination, and keep a coherent follow-up record. It does not hold money, file a claim, act as a middleman, or confirm eligibility.

## Launch categories

1. **Unclaimed shares and dividends — IEPF**: the flagship family/heir workflow. The product distinguishes a possible company/RTA suspense-account route from a possible IEPF/MCA route, but the user must confirm the actual status with the relevant institution.
2. **Unclaimed bank deposits — RBI UDGAM**: a search-preparation workflow. UDGAM search results do not equal an approved or paid claim.

No EPF, insurance, post-office, mutual-fund, or other recovery workflow is in launch scope.

## Required user-visible behavior

- Explain the trust posture on the landing page.
- Ask only non-sensitive, workflow-relevant questions.
- Use labels such as `user-reported`, `official procedure`, `verified source`, `needs more information`, `suggested route`, and `demo data`. Reserve `possible match` for a future genuine registry-search integration; the MVP must not use it without a search.
- Never display a recovered amount, a guarantee, a fabricated deadline, or an official confirmation.
- Provide source links and verification status beside procedural guidance.
- Let the user create a local demo case, see its next action and progress, and return to its timeline.
- Keep the demo banner visible on every screen and provide a reset/delete action.
- Provide an explicit fallback when the Qwen endpoint is not configured.

## Data boundary

The MVP must not request Aadhaar, PAN, bank account numbers, passwords, OTPs, government-portal credentials, or document uploads. The demo stores synthetic workflow state in browser local storage only. No server database or authentication is introduced until it is needed for a real multi-user product.

## Acceptance boundary

The product is successful when a stranger can complete the IEPF family/heir vertical slice, open the official next step, create and revisit a case, and understand exactly what Reclaim Labs has and has not verified. UDGAM must have an equivalent preparation-and-handoff path.
