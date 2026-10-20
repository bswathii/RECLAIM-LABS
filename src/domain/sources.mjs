export const SOURCES = Object.freeze([
  {
    id: 'SRC-RBI-UDGAM-FAQ',
    institution: 'Reserve Bank of India',
    title: 'UDGAM Portal FAQ',
    url: 'https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3579',
    accessedOn: '2026-10-19',
    status: 'verified',
    confidenceLabel: 'Verified source',
    supports: [
      'UDGAM lets registered users search unclaimed deposits/accounts across multiple participating banks.',
      'UDGAM is a search facility; claims are made with the respective bank.',
      'An individual search uses the account-holder name, bank, and an additional identifier or address.'
    ],
    openQuestions: []
  },
  {
    id: 'SRC-RBI-DEA-FAQ',
    institution: 'Reserve Bank of India',
    title: 'Depositor Education and Awareness Fund FAQ',
    url: 'https://www.rbi.org.in/Scripts/FAQView.aspx?Id=165',
    accessedOn: '2026-10-19',
    status: 'verified',
    confidenceLabel: 'Verified source',
    supports: [
      'The DEA Fund covers qualifying balances that have remained inoperative or unclaimed for 10 years or more.',
      'A customer, depositor, or legal heir claims through the bank; the bank then seeks reimbursement from the DEA Fund.',
      'The scheme FAQ does not prescribe a specific time limit for a customer or legal heir to claim.'
    ],
    openQuestions: []
  },
  {
    id: 'SRC-RBI-UDGAM-PORTAL',
    institution: 'Reserve Bank of India',
    title: 'Official UDGAM portal',
    url: 'https://udgam.rbi.org.in/',
    accessedOn: '2026-10-19',
    status: 'official-destination',
    confidenceLabel: 'Official destination',
    supports: ['Open the official UDGAM search destination. Reclaim Labs does not reproduce search results.'],
    openQuestions: ['Recheck the portal flow when a user is ready to search.']
  },
  {
    id: 'SRC-IEPFA-HOME',
    institution: 'IEPF Authority, Ministry of Corporate Affairs',
    title: 'Official IEPF Authority website',
    url: 'https://www.iepf.gov.in/',
    accessedOn: '2026-10-19',
    status: 'access-blocked',
    confidenceLabel: 'Official destination — page not verified in this audit',
    supports: ['Open the official IEPF Authority destination for current instructions.'],
    openQuestions: ['The research fetcher received HTTP 403. Re-verify current IEPF instructions before relying on procedural details.']
  },
  {
    id: 'SRC-MCA-HOME',
    institution: 'Ministry of Corporate Affairs',
    title: 'Official MCA website',
    url: 'https://www.mca.gov.in/',
    accessedOn: '2026-10-19',
    status: 'access-blocked',
    confidenceLabel: 'Official destination — page not verified in this audit',
    supports: ['Open the official MCA destination for current filing instructions.'],
    openQuestions: ['The research fetcher received HTTP 403. Re-verify current MCA instructions before relying on procedural details.']
  },
  {
    id: 'SRC-NSDL-IEPF-GUIDE',
    institution: 'National Securities Depository Limited (NSDL)',
    title: 'Investor guide to unclaimed shares and dividends',
    url: 'https://nsdl.com/an-investors-guide-to-claim-unclaimed-shares-and-dividends',
    accessedOn: '2026-10-20',
    status: 'verified',
    confidenceLabel: 'Verified source',
    supports: [
      'NSDL publishes an investor guide explaining the official process for checking and claiming unclaimed shares and unpaid dividends.',
      'The guide is presented as a general explanation and does not replace the current IEPF Authority, MCA, company, or RTA instructions.'
    ],
    openQuestions: ['Confirm the current institution-specific route and document requirements before a user acts.']
  },
  {
    id: 'SRC-DFS-UNCLAIMED-GATEWAY',
    institution: 'Department of Financial Services',
    title: 'Official Financial Gateway',
    url: 'https://www.unclaimedassetsportal.in/',
    accessedOn: '2026-10-20',
    status: 'official-destination',
    confidenceLabel: 'Official destination',
    supports: ['The government gateway is an existing official index for unclaimed-asset destinations; Reclaim Labs must add guidance and follow-through rather than claim to be the registry.'],
    openQuestions: ['The research fetcher returned only the page title. Recheck current categories and redirect behavior before relying on detailed gateway claims.']
  }
]);

export const SOURCE_BY_ID = Object.freeze(
  Object.fromEntries(SOURCES.map((source) => [source.id, source]))
);

export function getSources(sourceIds = []) {
  return sourceIds.map((sourceId) => SOURCE_BY_ID[sourceId]).filter(Boolean);
}

export function hasOnlyKnownSources(sourceIds = []) {
  return sourceIds.every((sourceId) => Boolean(SOURCE_BY_ID[sourceId]));
}
