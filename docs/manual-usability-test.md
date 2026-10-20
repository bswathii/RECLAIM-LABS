# Manual usability test plan

**Status: protocol, not a completed participant study.** Run at 375px and desktop width with a fresh browser profile. Use isolated demo mode and synthetic labels for scenarios; never enter credentials, identifiers, document contents or family names. Opening an official page is optional and must not turn into a real claim submission. Record actual failures, not an assumed pass.

## Path 1 — discover a bank-deposit route without personal evidence

1. Start on Home; verify the default mode says real catalogue/local preparation and no individual database search. Switch to the isolated demo; verify the exact banner `DEMO DATA — NOT A REAL FINANCIAL MATCH`.
2. In Discover, search `UDGAM`, then try `old bank deposit` and Hindi `पुराना बैंक खाता`. Verify RBI preparation/search routes appear, not personal holdings.
3. Open the RBI UDGAM search route. Read its source IDs, verification date, source record date, access class D, limitations and next action. Explain that the official portal searches participating banks and the respective bank handles a claim.
4. Leave personal evidence empty. Institution/product terms alone must never produce a potential-personal-match label. Save a case, reload, and verify Home/Cases show the same preparation record.
5. Click its official link. On return, verify the case has a click event only: no assumed page load, submission, response or recovery. Add an independent evidence report, user-selected review date and family-role label. Verify the review date appears on Home; no notification is promised.

## Path 2 — explicit user evidence and conflicting evidence

1. Still in demo, search with institution `Reserve Bank of India`, product `unclaimed deposits`, and no evidence confirmation. Verify topical relevance only. This is a test of route vocabulary, not confirmation that RBI holds a person's account.
2. Select `Old statement` and explicitly confirm checking a **fictional** personal record relating to the institution/product. Verify any potential-personal-match label says user evidence only; details say the app has not read the document or verified the result.
3. Select the conflicting-evidence box and resubmit. Open details: the state must become insufficient information and explain the conflict, even while evidence confirmation is checked.
4. Save a preparation case; it must not say an institution has confirmed ownership, submission, eligibility or money. Report submission, response and recovery separately; verify none implies another occurred. Cancel the recovery confirmation first, then accept; no amount appears.

## Path 3 — no route, under-review source, and mode isolation

1. Search `zzzz-no-catalogue-route` and verify the empty state says no individual search was performed. It must not say the person has no recoverable asset.
2. Clear the search. Confirm the DFS title-only gateway is not published as an actionable result. Settings may list research-only IRDAI/MITRA sources; neither should have an insurance/mutual-fund claim workflow.
3. Change language, create a synthetic case, switch to real/local mode and verify it is absent. Create a different synthetic test case there only if using a disposable test profile; switch back and verify isolation.
4. Cancel deletion; records must remain. Confirm deletion in demo; real/local records must remain untouched. Export cases from Settings and inspect the downloaded JSON for the correct mode and cases only; it is not an official record or full workspace backup.

## Scenario A — illustrative family/heir IEPF

1. Start on Home and say aloud what the product does and does not verify.
2. Open Discover → guided IEPF journey.
3. Explicitly choose **Family / heir**; verify neither answer is preselected.
4. Choose **Not sure yet** for custody and leave the company label empty.
5. Verify the result says **Here is the next place to check**, **Suggested route**, and not “possible match” or “confirmed”.
6. Confirm the four result sections explain the inputs, suggestion, gaps, and next action.
7. Inspect the official destinations, return to the app, review checklist items, and create the demo case. Do not treat a blocked IEPF/MCA page as verified procedure.
8. Open Cases and verify the same route, source references, reviewed-item progress, timeline, and next action.
9. Report an external action, then a submission, then mark it resolved by you. Verify no status says institution-confirmed.

## Scenario B — UDGAM preparation

1. From Discover, open the guided UDGAM journey.
2. Answer “No / not sure yet” for each availability question.
3. Verify the plan lists missing preparation information but never asks for the values.
4. Open the official UDGAM portal, return to the app, and create the synthetic case.
5. In Cases, verify the search preparation record is distinct from a claim or payment result.

## Scenario C — language continuity

1. Start an IEPF workflow in English and choose a claimant context.
2. Switch to Hindi from the header or Settings without leaving the workflow.
3. Verify the answers, route, source links, checklist state, and case data remain unchanged while labels switch language.
4. Ask the Assistant a UDGAM question and verify the fallback answer is Hindi and states that live AI is unavailable.
5. Confirm Kannada is not advertised as a supported language.

## Keyboard/accessibility pass

- Tab through the header, language control, primary nav, reset control, cards, radios, form fields, external links, and checklist.
- Confirm every focus indicator is visible and every form control has a label or accessible name.
- Confirm status updates are announced through the live region.
- Confirm at 375px the bottom navigation remains reachable and does not obscure the current control.
- Repeat at 768px and 1280px. Inspect overflow, long Hindi text, source links, catalogue details and review-date controls; controller tests do not prove layout.
- Block browser storage or exhaust the test profile's quota. Verify visible warnings and continued in-memory navigation, then verify deletion failures are not announced as successful.

## Comparative discovery study — predeclared protocol

**Question:** Does the preparation layer help someone find a relevant official route and understand the next action more reliably/faster than reading the same official sources directly? This is not a recovery or subscription-conversion study.

### Conditions and tasks

- **A — Reclaim Labs:** fresh isolated demo, selected English/Hindi, no saved cases. Settings → Start timed discovery task starts the optional local timer. Stop at a relevant opportunity's detail form, report relevance/comprehension, then finish. Do not log in to an official portal.
- **B — Official-source-only:** the same browser/language/device, starting from a fixed sheet of the RBI UDGAM portal/FAQ and NSDL guide URLs in `docs/source-register.md`, without Reclaim Labs guidance. Use an external stopwatch. This compares guidance against direct source use, not a claim that the official government gateway has been fully audited.
- Use fictional bank-account and inherited-share tasks. Example: identify where to investigate an old bank deposit and name information to arrange; identify how to distinguish an unknown share-custody route and what remains to be checked with the company/RTA. Success is not completing a claim or finding a holding.
- Counterbalance A→B and B→A across participants and rotate matched task variants. Record task/category and order; report carryover limitations rather than claiming a randomized clinical result. Recruit with consent and record language familiarity without collecting names or identifiers in this repository.
- Predeclare a five-minute task cap, identical assistance policy (no hints beyond the task), and stopping rule before the first session. Count timeouts, failures and withdrawals explicitly; do not discard them from the denominator.

### Measures and scoring

| Measure | Definition and evidence |
| --- | --- |
| Time to relevant route | Seconds from task reveal to correct official destination identified, capped at the declared timeout. App timer is local elapsed time and can include interruptions; note them. |
| Relevant route found | Independent observer checks the destination against the task rubric. A user's relevance checkbox alone is self-report, not validated success. |
| Next-action comprehension | 0: incorrect/unknown; 1: destination or preparation only; 2: correct destination plus next preparation action and an explicit unverified fact. Agree on source-backed answers before sessions. |
| False-positive/trust error | Participant thinks a holding, eligibility, payout, page load or submission was confirmed when it was not. Record count and explanation without personal data. |
| User-reported relevance | Local checkbox, reported separately from observer scoring. No population success rate inferred from the app's local cases. |
| Follow-through stages | Evidence, clicked link, submission, response and recovery each have separate local reports. These are not study participants, institutional receipts or independently verified recoveries. |

For a real study, retain consented observations in an approved private research location, not committed raw notes. A redacted row schema is: `participant_code, condition, order, task_variant, language, elapsed_seconds, timed_out, observer_route_correct, comprehension_0_2, trust_error, user_relevant, interruption_flag`. No names, account values, documents or secret material belong in it.

Report sample size, denominator, missing/timeout counts, language/device mix, median time and paired differences with uncertainty appropriate to the sample. Separate self-report from observer judgement. Publish negative or mixed results too. **No participant data has been collected and no improvement, recovery rate or monetization result is asserted by this protocol.**
