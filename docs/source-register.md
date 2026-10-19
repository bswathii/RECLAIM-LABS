# Official source register

**Register date:** 2026-10-19 (Asia/Calcutta)

The UI must not present an unverified record as a verified fact. `verified` means the official page content was retrieved and supports the listed paraphrase. `official-destination` means the link is an official destination but its procedural content was not relied on in this audit. `access-blocked` means the official page returned an access error to the research fetcher and must be rechecked before procedural claims are added.

| ID | Institution | URL | Accessed | Status | Supported use |
| --- | --- | --- | --- | --- | --- |
| `SRC-RBI-UDGAM-FAQ` | Reserve Bank of India | https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3579 | 2026-10-19 | verified | UDGAM searches unclaimed deposits/accounts across participating banks; UDGAM does not settle claims; users claim from the respective bank; individual search needs account-holder name, bank, and an additional identifier or address. |
| `SRC-RBI-DEA-FAQ` | Reserve Bank of India | https://www.rbi.org.in/Scripts/FAQView.aspx?Id=165 | 2026-10-19 | verified | DEA Fund coverage, 10-year transfer rule, bank/legal-heir claim path, and no specific claim time limit stated in the scheme FAQ. |
| `SRC-RBI-UDGAM-PORTAL` | Reserve Bank of India | https://udgam.rbi.org.in/ | 2026-10-19 | official-destination | Open the official UDGAM search portal. The app does not reproduce portal results. |
| `SRC-IEPFA-HOME` | IEPF Authority, Ministry of Corporate Affairs | https://www.iepf.gov.in/ | 2026-10-19 | access-blocked | Official destination for current IEPF instructions. The current audit could not retrieve the page, so this build does not present IEPF page details as verified facts. |
| `SRC-MCA-HOME` | Ministry of Corporate Affairs | https://www.mca.gov.in/ | 2026-10-19 | access-blocked | Official destination for current MCA filing instructions. The current audit could not retrieve the page. |

## Open verification questions

- Recheck the current IEPF Authority instructions and MCA Form IEPF-5 flow from the official pages before treating any route-specific document requirement as verified.
- Verify the current company/RTA suspense-account procedure from the relevant company/RTA source before adding institution-specific checklist requirements.
- Verify whether any official notice feed can support individualized advance alerts. Until then, Reclaim Labs only supports user-created reminders.
