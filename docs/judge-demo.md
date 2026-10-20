# Judge-ready synthetic demo

This is the primary demonstration path for Reclaim Labs. It is a **fictional test case**, not a real claimant, real holding, submitted claim, or verified recovery.

## Scenario

A family has old investment paperwork belonging to a deceased relative. They do not know whether the shares or dividends remain with the company/RTA or have been transferred to IEPF. Use only these fictional inputs:

- Claimant context: **Family / heir**.
- Custody: **Not sure yet**.
- Company/RTA name: blank.
- Death-related evidence available: **No / not sure yet**.
- Heir-authority evidence available: **No / not sure yet**.

Do not enter names, account values, PAN, certificates, document text, or credentials.

## Walkthrough

1. Start the server with the documented Node setup and open `http://localhost:3000`.
2. On Home, show the trust boundary. The app must not claim that an asset exists.
3. Open **Discover → guided IEPF journey**.
4. Select **Family / heir** explicitly. No claimant context is preselected.
5. Select **Not sure yet** for custody and leave the company/RTA field blank.
6. Review the result. It should identify the route as **verify custody**, show **needs more information**, retain IEPF/MCA/NSDL source references, and show the official handoff. It must not declare ownership, eligibility, an amount, a deadline, or an approved claim.
7. Move to the checklist. Mark one preparation item reviewed, then save the local preparation case.
8. Open **Cases** and show the route, missing information, source references, reviewed-item progress, local timeline, and next action.
9. Reload or restart the browser session and reopen Cases. The case should remain in local preparation state. A reviewed item is not a filing receipt and the initial timeline is not a submission.
10. Explain that the next real-world action is to verify custody and current official/company/RTA instructions directly. The app has not searched an individual registry.

## Expected evidence

The automated equivalent is `tests/app-flow.test.mjs`, test **“judge demo completes the synthetic inherited-shares case from uncertainty to tracked preparation”**. It checks:

- `verify-custody` route selection.
- `needs-more-information` confidence.
- Four missing-information items.
- Official IEPF source handoff visible.
- One reviewed checklist item retained in the saved case.
- Case persistence and resume behavior.
- No institution-confirmed, recovery, amount, or approved-claim language.

## Central claim, stated accurately

> Reclaim Labs turns a fragmented recovery process into an evidence-backed, trackable next step while explicitly identifying what it cannot yet verify.

In this prototype, “trackable” means browser-local preparation state and user-reported progress. It does not mean an official case tracker, claim receipt, shared family account, or recovery result. The evidence is synthetic and automated; no human or independently verified real-case result is implied.
