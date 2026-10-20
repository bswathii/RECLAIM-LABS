# Official source register

**Register date:** 2026-10-20 (Asia/Calcutta)

The UI must not present an unverified record as a verified fact. `verified` means the official page content was retrieved and supports the listed paraphrase. `official-destination` means the link is an official destination but its procedural content was not relied on in this audit. `access-blocked` means the official page returned an access error to the research fetcher and must be rechecked before procedural claims are added.

| ID | Institution | URL | Accessed | Status | Supported use |
| --- | --- | --- | --- | --- | --- |
| `SRC-RBI-UDGAM-FAQ` | Reserve Bank of India | https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3579 | 2026-10-20 | verified | FAQ dated March 5, 2024. UDGAM searches participating banks; claims are made with the respective bank. Individual search preparation includes account-holder name, bank, and an identifier or address. Historical bank coverage is not advertised as current. |
| `SRC-RBI-DEA-FAQ` | Reserve Bank of India | https://www.rbi.org.in/Scripts/FAQView.aspx?Id=165 | 2026-10-19 | verified | DEA Fund coverage, 10-year transfer rule, bank/legal-heir claim path, and no specific claim time limit stated in the scheme FAQ. |
| `SRC-RBI-UDGAM-PORTAL` | Reserve Bank of India | https://udgam.rbi.org.in/ | 2026-10-19 | official-destination | Open the official UDGAM search portal. The app does not reproduce portal results. |
| `SRC-IEPFA-HOME` | IEPF Authority, Ministry of Corporate Affairs | https://www.iepf.gov.in/ | 2026-10-19 | access-blocked | Official destination for current IEPF instructions. The current audit could not retrieve the page, so this build does not present IEPF page details as verified facts. |
| `SRC-MCA-HOME` | Ministry of Corporate Affairs | https://www.mca.gov.in/ | 2026-10-19 | access-blocked | Official destination for current MCA filing instructions. The current audit could not retrieve the page. |
| `SRC-NSDL-IEPF-GUIDE` | National Securities Depository Limited (NSDL) | https://nsdl.com/an-investors-guide-to-claim-unclaimed-shares-and-dividends | 2026-10-20 | verified | NSDL publishes a general investor guide for checking and claiming unclaimed shares and unpaid dividends. It does not replace current institution-specific instructions. |
| `SRC-DFS-UNCLAIMED-GATEWAY` | Department of Financial Services | https://www.unclaimedassetsportal.in/ | 2026-10-20 | official-destination | Existing government gateway/index for unclaimed-asset destinations. The fetcher returned only the page title, so detailed gateway behavior remains unverified. |

## Open verification questions

- Recheck the current IEPF Authority instructions and MCA Form IEPF-5 flow from the official pages before treating any route-specific document requirement as verified.
- Verify the current company/RTA suspense-account procedure from the relevant company/RTA source before adding institution-specific checklist requirements.
- Verify whether any official notice feed can support individualized advance alerts. Until then, Reclaim Labs only supports user-created reminders.

## Strategic landscape finding

The official ecosystem already includes direct search destinations and an official financial gateway/index. Reclaim Labs is not differentiated by collecting links. Its current differentiation hypothesis is the guided, uncertainty-aware preparation layer: route questions, source-labelled explanations, non-sensitive checklists, user-reported case continuity, and clear separation between preparation and institution-confirmed outcomes. This is a product hypothesis, not validated market evidence.

## Requested-source access investigation — October 20, 2026

Classifications: **A** authorized live search/API; **B** public downloadable dataset; **C** curatable public information; **D** interactive official portal for the user; **E** insufficiently verified. None of the sources below was verified as an authorized individual-search API or imported individual dataset. Unknown update frequency means unknown, not continuous monitoring.

| Source / exact URL | Mode and retrieval evidence | Available data / date | Inputs and restrictions | Official next action / claim requirements | Refresh |
| --- | --- | --- | --- | --- | --- |
| Common Landing Portal — https://www.unclaimedassetsportal.in/ | **E**. Public GET returned title only. | Official Financial Gateway title; data date unknown. | Interactive destination, no personal records retrieved; inputs not verified. | Catalogue record remains **under-review and hidden**. No current detailed procedure inferred. | Unknown; manual verification only. |
| RBI UDGAM — https://udgam.rbi.org.in/unclaimed-deposits/ | **D**. Public GET returned application shell/title. RBI FAQ is **C** and was re-read successfully. | FAQ published 2024-03-05; no individual asset records. | FAQ says registration uses name/mobile; individual search uses holder name, bank and identifier or address. Values are entered on official portal, not Reclaim Labs. No login/CAPTCHA bypass attempted. | User searches on UDGAM; claims through respective bank. Bank-specific documents not verified or invented. | No verified update cadence; manual recheck. |
| IEPF services — https://services.india.gov.in/service/detail/iepf-forms-by-investor-education-and-protection-fund-authority | **E**. Transport error. | No usable page content. | Inputs, authentication and form requirements unknown in this check. | Not used as procedural authority. Existing NSDL general guide (**C**) supports preparation only; IEPF/MCA detail remains blocked. | Manual recheck after access restored. |
| IRDAI — https://bimabharosa.irdai.gov.in/Home/UnclaimedAmount | **C**. Public GET succeeded. | Links to unclaimed-amount facilities for life, general and health insurers; page date unavailable. Safety warning: no payments/QR codes for disbursement. | Directory requires no individual values; linked insurers' search fields and restrictions were not inspected. | Institution-specific search/claim requirements need separate verification. Research source in Settings, **no insurance claim workflow published**. | Cadence not documented in retrieved page; manual review. |
| SEBI MITRA — https://www.sebi.gov.in/legal/circulars/feb-2025/service-platform-for-investors-to-trace-inactive-and-unclaimed-mutual-fund-folios-mitra-mutual-fund-investment-tracing-and-retrieval-assistant-_91847.html | **C for metadata; E for operational procedure**. Public GET succeeded. | Circular title, 2025-02-12, SEBI/HO/IMD/IMD-SEC-3/P/CIR/2025/15. Detailed content not extracted. | No operational search endpoint, inputs, current availability or terms verified. | No MITRA individual search or claim checklist published. Must inspect current circular/full instructions before implementation. | Manual review; no notice feed integrated. |

## Catalogue publication and manual update workflow

Data lives in `src/domain/opportunities.mjs`, independent of UI. There are **four published records in two financial categories**: two preparation journeys, one UDGAM search route, and one NSDL general guidance route. These are four records for **two route families**, not four distinct recoverable assets. A fifth DFS gateway record is under review and not returned by default searches.

1. Retrieve the exact official source without defeating access restrictions; record the access result and source content date separately.
2. Update source excerpts/status in `src/domain/sources.mjs`. Do not advance a successful verification date on a failed fetch.
3. Edit the relevant catalogue record, dates, sources, access classification, limitations and Hindi copy. Use `under-review` for unsupported claims; do not publish merely because a URL exists.
4. Keep amount/deadline null unless a reviewed source and tests support a specific statement. This prototype has neither.
5. Run `npm run catalogue:check` and `npm test`. Inspect the UI source and freshness labels. Commit the reviewed data/code; no background refresh or continuous monitoring is claimed.

The offline catalogue check verifies schema/publication gates. It does **not** re-fetch sources or certify that a procedure remains current.
