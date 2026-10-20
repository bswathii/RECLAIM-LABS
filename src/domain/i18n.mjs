/**
 * Localized copy for the Reclaim Labs domain.
 *
 * This module deliberately has no browser or application dependencies. It can
 * be used by the server, the browser entry point, or tests without changing
 * the source of truth for workflow rules.
 */

export const DEFAULT_LANGUAGE = 'en';

const LANGUAGE_LIST = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr'
  }
];

export const SUPPORTED_LANGUAGES = Object.freeze(
  LANGUAGE_LIST.map((language) => Object.freeze({ ...language }))
);

export const LANGUAGE_METADATA = Object.freeze(
  Object.fromEntries(SUPPORTED_LANGUAGES.map((language) => [language.code, language]))
);

const EN_NAVIGATION = {
  primary: 'Primary navigation',
  home: 'Home',
  explore: 'Explore',
  discover: 'Discover',
  cases: 'Cases',
  tracker: 'Tracker',
  trackerCount: 'Tracker ({{count}})',
  sources: 'Sources',
  assistant: 'Assistant',
  privacy: 'Privacy',
  settings: 'Settings',
  currentPage: 'Current page',
  homeAria: 'Reclaim Labs home',
  openExternal: 'Open official destination in a new tab',
  externalLink: 'External link'
};

const HI_NAVIGATION = {
  primary: 'मुख्य नेविगेशन',
  home: 'होम',
  explore: 'जानें',
  discover: 'डिस्कवर',
  cases: 'केस',
  tracker: 'ट्रैकर',
  trackerCount: 'ट्रैकर ({{count}})',
  sources: 'स्रोत',
  assistant: 'सहायक',
  privacy: 'गोपनीयता',
  settings: 'सेटिंग्स',
  currentPage: 'वर्तमान पृष्ठ',
  homeAria: 'Reclaim Labs होम',
  openExternal: 'आधिकारिक गंतव्य नए टैब में खोलें',
  externalLink: 'बाहरी लिंक'
};

const EN_COMMON = {
  appName: 'Reclaim Labs',
  tagline: 'Prepare the next official step',
  loading: 'Loading…',
  back: 'Back',
  next: 'Next',
  continue: 'Continue',
  cancel: 'Cancel',
  close: 'Close',
  save: 'Save',
  done: 'Done',
  yes: 'Yes',
  no: 'No',
  optional: 'Optional',
  required: 'Required',
  learnMore: 'Learn more',
  open: 'Open',
  review: 'Review',
  submit: 'Submit',
  clear: 'Clear',
  search: 'Search',
  language: 'Language',
  userReported: 'User-reported',
  officialProcedure: 'Official procedure',
  verifiedSource: 'Verified source',
  officialDestination: 'Official destination',
  needsMoreInformation: 'Needs more information',
  possibleMatch: 'Possible match',
  readyToSearch: 'Ready to prepare a search',
  demoData: 'Demo data',
  notVerified: 'Not verified',
  suggestedRoute: 'Suggested route — user-reported inputs',
  trustBoundary: 'Trust boundary',
  accessBlocked: 'Official destination — page not verified in this audit',
  notRecorded: 'Not recorded',
  none: 'None'
};

const HI_COMMON = {
  appName: 'Reclaim Labs',
  tagline: 'अगले आधिकारिक कदम की तैयारी करें',
  loading: 'लोड हो रहा है…',
  back: 'वापस',
  next: 'आगे',
  continue: 'जारी रखें',
  cancel: 'रद्द करें',
  close: 'बंद करें',
  save: 'सहेजें',
  done: 'पूर्ण',
  yes: 'हाँ',
  no: 'नहीं',
  optional: 'वैकल्पिक',
  required: 'आवश्यक',
  learnMore: 'और जानें',
  open: 'खोलें',
  review: 'समीक्षा करें',
  submit: 'जमा करें',
  clear: 'साफ़ करें',
  search: 'खोजें',
  language: 'भाषा',
  userReported: 'उपयोगकर्ता द्वारा बताया गया',
  officialProcedure: 'आधिकारिक प्रक्रिया',
  verifiedSource: 'सत्यापित स्रोत',
  officialDestination: 'आधिकारिक गंतव्य',
  needsMoreInformation: 'अधिक जानकारी आवश्यक है',
  possibleMatch: 'संभावित मिलान',
  readyToSearch: 'खोज की तैयारी के लिए तैयार',
  demoData: 'डेमो डेटा',
  notVerified: 'सत्यापित नहीं',
  suggestedRoute: 'संभावित मार्ग — उपयोगकर्ता द्वारा बताई गई जानकारी',
  trustBoundary: 'विश्वास सीमा',
  accessBlocked: 'आधिकारिक गंतव्य — इस ऑडिट में पृष्ठ सत्यापित नहीं हुआ',
  notRecorded: 'दर्ज नहीं है',
  none: 'कोई नहीं'
};

const EN_TRUST = {
  title: 'The honest promise',
  possibleMatchTitle: 'Possible match, not proof.',
  possibleMatchBody: 'Only the official institution can confirm whether an asset exists, which route applies, or whether a claim is accepted.',
  noAmounts: 'No amount estimates or recovery guarantees.',
  noCredentials: 'No portal passwords, OTPs, or document uploads.',
  noMiddleman: 'No middleman, filing, or percentage of recovery.',
  guidanceLayer: 'Reclaim Labs is a guidance layer, not a filing intermediary or financial adviser.',
  notConfirmation: 'Preparation information is not an official confirmation or a claim decision.'
};

const HI_TRUST = {
  title: 'ईमानदार वादा',
  possibleMatchTitle: 'संभावित मिलान, प्रमाण नहीं।',
  possibleMatchBody: 'किसी संपत्ति के अस्तित्व, लागू मार्ग या दावे की स्वीकृति की पुष्टि केवल आधिकारिक संस्था कर सकती है।',
  noAmounts: 'राशि का अनुमान या वसूली की गारंटी नहीं।',
  noCredentials: 'पोर्टल पासवर्ड, OTP या दस्तावेज़ अपलोड नहीं।',
  noMiddleman: 'कोई मध्यस्थ, फाइलिंग या वसूली का प्रतिशत नहीं।',
  guidanceLayer: 'Reclaim Labs मार्गदर्शन की एक परत है; यह फाइलिंग मध्यस्थ या वित्तीय सलाहकार नहीं है।',
  notConfirmation: 'तैयारी की जानकारी आधिकारिक पुष्टि या दावे का निर्णय नहीं है।'
};

const EN_STORAGE = {
  title: 'Privacy and storage',
  description: 'Your demo case stays in this browser so you can return to your preparation record.',
  location: 'Storage location',
  locationValue: 'This browser’s local storage',
  localOnly: 'Stored locally in this browser only.',
  browserOnly: 'The demo does not send this state to a server.',
  noServerDatabase: 'There is no server database or account in this demo.',
  storedTitle: 'What the demo stores',
  storedDescription: 'Synthetic workflow choices, optional labels, checklist acknowledgements, and case status.',
  notStoredTitle: 'What the demo does not store',
  notStoredDescription: 'Passwords, OTPs, portal credentials, account numbers, sensitive identifiers, documents, or official results.',
  storageKey: 'Browser storage key',
  demoNamespace: 'Synthetic demo namespace',
  resetTitle: 'Reset synthetic demo data',
  resetDescription: 'Remove the demo cases and preparation choices saved in this browser.',
  resetAction: 'Reset demo',
  deleteAction: 'Delete local demo data',
  resetConfirm: 'Reset all synthetic demo data in this browser?',
  resetCompleted: 'Synthetic demo data reset. No real records were changed.',
  resetCancelled: 'Reset cancelled. Your synthetic demo data is still here.',
  resetFailed: 'The synthetic demo data could not be reset. Try again.',
  noRealRecords: 'No real financial records, documents, credentials, or official confirmations are stored here.',
  privacyNotice: 'Use only non-sensitive information in this demo.'
};

const HI_STORAGE = {
  title: 'गोपनीयता और स्टोरेज',
  description: 'आपका डेमो केस इसी ब्राउज़र में रहता है ताकि आप अपनी तैयारी पर वापस आ सकें।',
  location: 'स्टोरेज स्थान',
  locationValue: 'इस ब्राउज़र का लोकल स्टोरेज',
  localOnly: 'केवल इसी ब्राउज़र में स्थानीय रूप से संग्रहीत।',
  browserOnly: 'डेमो इस जानकारी को सर्वर पर नहीं भेजता।',
  noServerDatabase: 'इस डेमो में कोई सर्वर डेटाबेस या खाता नहीं है।',
  storedTitle: 'डेमो क्या संग्रहीत करता है',
  storedDescription: 'सिंथेटिक वर्कफ़्लो विकल्प, वैकल्पिक लेबल, चेकलिस्ट स्वीकृतियाँ और केस स्थिति।',
  notStoredTitle: 'डेमो क्या संग्रहीत नहीं करता',
  notStoredDescription: 'पासवर्ड, OTP, पोर्टल क्रेडेंशियल, खाता संख्या, संवेदनशील पहचानकर्ता, दस्तावेज़ या आधिकारिक परिणाम।',
  storageKey: 'ब्राउज़र स्टोरेज कुंजी',
  demoNamespace: 'सिंथेटिक डेमो नेमस्पेस',
  resetTitle: 'सिंथेटिक डेमो डेटा रीसेट करें',
  resetDescription: 'इस ब्राउज़र में सहेजे गए डेमो केस और तैयारी के विकल्प हटाएँ।',
  resetAction: 'डेमो रीसेट करें',
  deleteAction: 'स्थानीय डेमो डेटा हटाएँ',
  resetConfirm: 'इस ब्राउज़र का सारा सिंथेटिक डेमो डेटा रीसेट करें?',
  resetCompleted: 'सिंथेटिक डेमो डेटा रीसेट कर दिया गया। कोई वास्तविक रिकॉर्ड नहीं बदला गया।',
  resetCancelled: 'रीसेट रद्द किया गया। आपका सिंथेटिक डेमो डेटा अभी भी मौजूद है।',
  resetFailed: 'सिंथेटिक डेमो डेटा रीसेट नहीं हो सका। फिर कोशिश करें।',
  noRealRecords: 'यहाँ वास्तविक वित्तीय रिकॉर्ड, दस्तावेज़, क्रेडेंशियल या आधिकारिक पुष्टियाँ संग्रहीत नहीं की जातीं।',
  privacyNotice: 'इस डेमो में केवल गैर-संवेदनशील जानकारी का उपयोग करें।'
};

const EN_IEPF = {
  title: 'IEPF: unclaimed shares and dividends',
  shortTitle: 'IEPF / MCA',
  description: 'Prepare a possible route for unclaimed shares or dividends. The institution must confirm the actual record and process.',
  start: 'Start an IEPF assessment',
  explore: 'Explore IEPF',
  assessment: 'IEPF assessment',
  claimantType: 'Who is preparing this?',
  holder: 'Individual holder',
  heir: 'Family / heir',
  custody: 'Where may the holding be recorded?',
  unknown: 'Not sure yet',
  companySuspense: 'Company / RTA suspense account',
  iepf: 'IEPF',
  companyName: 'Company or RTA name',
  companyNameHint: 'Optional non-sensitive label only',
  deathCertificate: 'Death-related evidence is available',
  heirAuthority: 'Heir authority evidence is available',
  evidenceAvailable: 'Evidence availability',
  route: 'Possible route',
  routeTitle: 'Route guidance',
  routeIepf: 'Confirm the IEPF / MCA route',
  routeIepfShort: 'IEPF / MCA handoff',
  routeIepfNextAction: 'Confirm the current IEPF and MCA instructions, then use the official destination yourself.',
  routeIepfRationale: 'You reported that the holding may already be with IEPF. Reclaim Labs cannot confirm that status or eligibility.',
  routeCompany: 'Confirm the company / RTA route',
  routeCompanyShort: 'Company / RTA handoff',
  routeCompanyNextAction: 'Ask the company or its official RTA to confirm whether the holding remains in a suspense account and what current steps apply.',
  routeCompanyRationale: 'You reported that the holding may still be with the company or RTA rather than IEPF. The institution must confirm the route.',
  routeVerify: 'First verify where the holding is recorded',
  routeVerifyShort: 'Verify custody first',
  routeVerifyNextAction: 'Use an official company/RTA or IEPF/MCA channel to confirm whether the holding is in a company suspense account or with IEPF.',
  routeVerifyRationale: 'The route changes depending on where the institution records the holding. That information is still missing.',
  checklistTitle: 'IEPF preparation checklist',
  checklistRoute: 'Confirm the route with the official institution',
  checklistHeirEvidence: 'List the family/heir evidence you can arrange',
  checklistIssuer: 'Keep the company or RTA name handy',
  checklistFindIssuer: 'Find the company or RTA name',
  checklistOfficial: 'Open the official destination yourself',
  checklistRouteDetail: 'Check the current IEPF Authority and MCA instructions before taking any filing or document step.',
  checklistCompanyDetail: 'Ask the company or official RTA whether the holding remains in suspense and what current instructions apply.',
  checklistHeirDetail: 'Record only whether evidence is available. Ask the institution for its current acceptable proof; do not upload it to this demo.',
  checklistIssuerDetail: 'User-reported issuer/RTA label: {{companyName}}. Reclaim Labs has not verified the holding or institution relationship.',
  checklistFindIssuerDetail: 'Use records you already have or ask the official institution. Do not enter account numbers or credentials here.',
  checklistOfficialDetail: 'Reclaim Labs does not file a claim, submit documents, or act as a middleman.',
  noDocuments: 'Do not upload documents here.',
  noCredentials: 'Do not enter account numbers, passwords, or portal credentials here.'
};

const HI_IEPF = {
  title: 'IEPF: लावारिस शेयर और लाभांश',
  shortTitle: 'IEPF / MCA',
  description: 'लावारिस शेयर या लाभांश के संभावित मार्ग की तैयारी करें। वास्तविक रिकॉर्ड और प्रक्रिया की पुष्टि संस्था को करनी होगी।',
  start: 'IEPF आकलन शुरू करें',
  explore: 'IEPF देखें',
  assessment: 'IEPF आकलन',
  claimantType: 'यह तैयारी कौन कर रहा है?',
  holder: 'व्यक्तिगत धारक',
  heir: 'परिवार / उत्तराधिकारी',
  custody: 'होल्डिंग कहाँ दर्ज हो सकती है?',
  unknown: 'अभी निश्चित नहीं',
  companySuspense: 'कंपनी / RTA सस्पेंस खाता',
  iepf: 'IEPF',
  companyName: 'कंपनी या RTA का नाम',
  companyNameHint: 'केवल वैकल्पिक गैर-संवेदनशील लेबल',
  deathCertificate: 'मृत्यु-संबंधी प्रमाण उपलब्ध है',
  heirAuthority: 'उत्तराधिकारी अधिकार का प्रमाण उपलब्ध है',
  evidenceAvailable: 'प्रमाण की उपलब्धता',
  route: 'संभावित मार्ग',
  routeTitle: 'मार्गदर्शन',
  routeIepf: 'IEPF / MCA मार्ग की पुष्टि करें',
  routeIepfShort: 'IEPF / MCA हस्तांतरण',
  routeIepfNextAction: 'वर्तमान IEPF और MCA निर्देशों की पुष्टि करें, फिर आधिकारिक गंतव्य का उपयोग स्वयं करें।',
  routeIepfRationale: 'आपने बताया कि होल्डिंग पहले से IEPF के पास हो सकती है। Reclaim Labs इस स्थिति या पात्रता की पुष्टि नहीं कर सकता।',
  routeCompany: 'कंपनी / RTA मार्ग की पुष्टि करें',
  routeCompanyShort: 'कंपनी / RTA हस्तांतरण',
  routeCompanyNextAction: 'कंपनी या उसके आधिकारिक RTA से पूछें कि होल्डिंग सस्पेंस खाते में है या नहीं और वर्तमान कदम क्या हैं।',
  routeCompanyRationale: 'आपने बताया कि होल्डिंग IEPF के बजाय कंपनी या RTA के पास हो सकती है। संस्था को मार्ग की पुष्टि करनी होगी।',
  routeVerify: 'पहले सत्यापित करें कि होल्डिंग कहाँ दर्ज है',
  routeVerifyShort: 'पहले कस्टडी सत्यापित करें',
  routeVerifyNextAction: 'आधिकारिक कंपनी/RTA या IEPF/MCA माध्यम से पुष्टि करें कि होल्डिंग कंपनी के सस्पेंस खाते में है या IEPF के पास।',
  routeVerifyRationale: 'अगला मार्ग इस बात पर निर्भर करता है कि संस्था होल्डिंग को कहाँ दर्ज करती है। यह जानकारी अभी उपलब्ध नहीं है।',
  checklistTitle: 'IEPF तैयारी चेकलिस्ट',
  checklistRoute: 'आधिकारिक संस्था के साथ मार्ग की पुष्टि करें',
  checklistHeirEvidence: 'व्यवस्थित किए जा सकने वाले परिवार/उत्तराधिकारी प्रमाणों की सूची बनाएँ',
  checklistIssuer: 'कंपनी या RTA का नाम पास रखें',
  checklistFindIssuer: 'कंपनी या RTA का नाम ढूँढें',
  checklistOfficial: 'आधिकारिक गंतव्य स्वयं खोलें',
  checklistRouteDetail: 'किसी फाइलिंग या दस्तावेज़ संबंधी कदम से पहले वर्तमान IEPF Authority और MCA निर्देश देखें।',
  checklistCompanyDetail: 'कंपनी या आधिकारिक RTA से पूछें कि होल्डिंग सस्पेंस में है या नहीं और वर्तमान निर्देश क्या हैं।',
  checklistHeirDetail: 'केवल यह दर्ज करें कि प्रमाण उपलब्ध है या नहीं। संस्था से स्वीकार्य वर्तमान प्रमाण पूछें; इस डेमो में अपलोड न करें।',
  checklistIssuerDetail: 'उपयोगकर्ता द्वारा बताया गया जारीकर्ता/RTA लेबल: {{companyName}}। Reclaim Labs ने होल्डिंग या संस्था के संबंध को सत्यापित नहीं किया है।',
  checklistFindIssuerDetail: 'अपने पास मौजूद रिकॉर्ड देखें या आधिकारिक संस्था से पूछें। यहाँ खाता संख्या या क्रेडेंशियल दर्ज न करें।',
  checklistOfficialDetail: 'Reclaim Labs दावा फाइल नहीं करता, दस्तावेज़ जमा नहीं करता और मध्यस्थ की भूमिका नहीं निभाता।',
  noDocuments: 'यहाँ दस्तावेज़ अपलोड न करें।',
  noCredentials: 'यहाँ खाता संख्या, पासवर्ड या पोर्टल क्रेडेंशियल दर्ज न करें।'
};

const EN_UDGAM = {
  title: 'UDGAM: unclaimed bank deposits',
  shortTitle: 'RBI UDGAM',
  description: 'Prepare the non-sensitive information for an official UDGAM search. A search result is not a claim approval or payment.',
  start: 'Prepare a UDGAM search',
  explore: 'Explore UDGAM',
  preparation: 'UDGAM search preparation',
  holderName: 'Account-holder name',
  bank: 'Bank name',
  additionalIdentifier: 'Additional identifier or address',
  hasHolderName: 'I have the account-holder name ready',
  hasBank: 'I have the bank name ready',
  hasAdditionalIdentifier: 'I have an additional identifier or address ready',
  inputAvailability: 'What information is ready?',
  searchInputs: 'Search inputs',
  checklistTitle: 'UDGAM preparation checklist',
  checklistHolderName: 'Have the account-holder name ready',
  checklistBank: 'Have the bank name ready',
  checklistAdditional: 'Have an additional identifier or address ready',
  checklistOfficial: 'Open the official UDGAM portal',
  checklistHolderDetail: 'RBI lists the account-holder name as an individual search input. Reclaim Labs does not store the value.',
  checklistBankDetail: 'RBI lists one or more banks as an individual search input.',
  checklistAdditionalDetail: 'RBI lists an additional identifier or address. Do not enter the value into this demo.',
  checklistOfficialDetail: 'UDGAM provides search information; any claim is made with the respective bank.',
  nextAction: 'Open UDGAM and perform the search yourself; any claim is made with the respective bank, not through Reclaim Labs.',
  notClaim: 'A UDGAM search is not an approved or paid claim.',
  noValues: 'Reclaim Labs does not collect the search values.'
};

const HI_UDGAM = {
  title: 'UDGAM: लावारिस बैंक जमा',
  shortTitle: 'RBI UDGAM',
  description: 'आधिकारिक UDGAM खोज के लिए गैर-संवेदनशील जानकारी तैयार करें। खोज परिणाम दावे की स्वीकृति या भुगतान नहीं है।',
  start: 'UDGAM खोज की तैयारी करें',
  explore: 'UDGAM देखें',
  preparation: 'UDGAM खोज की तैयारी',
  holderName: 'खाताधारक का नाम',
  bank: 'बैंक का नाम',
  additionalIdentifier: 'अतिरिक्त पहचानकर्ता या पता',
  hasHolderName: 'मेरे पास खाताधारक का नाम तैयार है',
  hasBank: 'मेरे पास बैंक का नाम तैयार है',
  hasAdditionalIdentifier: 'मेरे पास अतिरिक्त पहचानकर्ता या पता तैयार है',
  inputAvailability: 'कौन-सी जानकारी तैयार है?',
  searchInputs: 'खोज इनपुट',
  checklistTitle: 'UDGAM तैयारी चेकलिस्ट',
  checklistHolderName: 'खाताधारक का नाम तैयार रखें',
  checklistBank: 'बैंक का नाम तैयार रखें',
  checklistAdditional: 'अतिरिक्त पहचानकर्ता या पता तैयार रखें',
  checklistOfficial: 'आधिकारिक UDGAM पोर्टल खोलें',
  checklistHolderDetail: 'RBI खाताधारक के नाम को व्यक्ति की खोज के इनपुट के रूप में सूचीबद्ध करता है। Reclaim Labs यह मान संग्रहीत नहीं करता।',
  checklistBankDetail: 'RBI एक या अधिक बैंकों को व्यक्ति की खोज के इनपुट के रूप में सूचीबद्ध करता है।',
  checklistAdditionalDetail: 'RBI अतिरिक्त पहचानकर्ता या पते को सूचीबद्ध करता है। यह मान इस डेमो में दर्ज न करें।',
  checklistOfficialDetail: 'UDGAM खोज संबंधी जानकारी देता है; कोई भी दावा संबंधित बैंक के साथ किया जाता है।',
  nextAction: 'UDGAM खोलकर खोज स्वयं करें; कोई भी दावा संबंधित बैंक के साथ किया जाता है, Reclaim Labs के माध्यम से नहीं।',
  notClaim: 'UDGAM की खोज स्वीकृत या भुगतान किया गया दावा नहीं है।',
  noValues: 'Reclaim Labs खोज के मान एकत्र नहीं करता।'
};

const EN_WORKFLOW = {
  title: 'Workflow',
  assess: 'Assess',
  prepare: 'Prepare',
  track: 'Track',
  nextAction: 'Next action',
  missingInformation: 'Information still needed',
  missingReason: 'Why this matters',
  sourceIds: 'Source IDs',
  sources: 'Sources',
  confidence: 'Confidence',
  confidenceNote: 'This is based on user-reported inputs and is not official confirmation.',
  officialHandoff: 'Official handoff',
  openOfficialDestination: 'Open the official destination yourself',
  createCase: 'Create demo case',
  caseCreated: 'Demo case created',
  viewCase: 'View case',
  noCases: 'No demo cases yet',
  caseCount: '{{count}} local demo case(s)',
  checklist: 'Preparation checklist',
  checklistProgress: '{{reviewed}} of {{total}} items reviewed ({{percentage}}%)',
  itemsReviewed: 'Items reviewed',
  reviewed: 'Reviewed',
  notReviewed: 'Not reviewed',
  markReviewed: 'Mark preparation item as reviewed',
  markNotReviewed: 'Mark preparation item as not reviewed',
  actionReported: 'Action reported by you',
  submissionReported: 'Submission reported by you',
  institutionConfirmed: 'Institution-confirmed outcome',
  markedResolvedByYou: 'Marked resolved by you.',
  noInstitutionConfirmation: 'This demo has no mechanism to verify an institutional outcome.',
  officialInstruction: 'Verify current instructions with the official institution.',
  userReportedInput: 'Based on what you reported; not independently verified.',
  noOutcome: 'The institution decides the actual outcome.'
};

const HI_WORKFLOW = {
  title: 'वर्कफ़्लो',
  assess: 'आकलन करें',
  prepare: 'तैयारी करें',
  track: 'ट्रैक करें',
  nextAction: 'अगला कदम',
  missingInformation: 'अभी आवश्यक जानकारी',
  missingReason: 'यह क्यों आवश्यक है',
  sourceIds: 'स्रोत आईडी',
  sources: 'स्रोत',
  confidence: 'विश्वास स्तर',
  confidenceNote: 'यह उपयोगकर्ता द्वारा बताई गई जानकारी पर आधारित है और आधिकारिक पुष्टि नहीं है।',
  officialHandoff: 'आधिकारिक हस्तांतरण',
  openOfficialDestination: 'आधिकारिक गंतव्य स्वयं खोलें',
  createCase: 'डेमो केस बनाएँ',
  caseCreated: 'डेमो केस बनाया गया',
  viewCase: 'केस देखें',
  noCases: 'अभी कोई डेमो केस नहीं है',
  caseCount: '{{count}} स्थानीय डेमो केस',
  checklist: 'तैयारी चेकलिस्ट',
  checklistProgress: '{{total}} में से {{reviewed}} तैयारी आइटम देखे गए ({{percentage}}%)',
  itemsReviewed: 'देखे गए आइटम',
  reviewed: 'देखा गया',
  notReviewed: 'अभी नहीं देखा गया',
  markReviewed: 'तैयारी आइटम को देखा गया चिह्नित करें',
  markNotReviewed: 'तैयारी आइटम को न देखा गया चिह्नित करें',
  actionReported: 'आपके द्वारा कार्रवाई बताई गई',
  submissionReported: 'आपके द्वारा जमा करना बताया गया',
  institutionConfirmed: 'संस्था द्वारा पुष्टि किया गया परिणाम',
  markedResolvedByYou: 'आपके द्वारा समाधान के रूप में चिह्नित।',
  noInstitutionConfirmation: 'इस डेमो में संस्था के परिणाम की पुष्टि करने की सुविधा नहीं है।',
  officialInstruction: 'आधिकारिक संस्था से वर्तमान निर्देश सत्यापित करें।',
  userReportedInput: 'आपके द्वारा बताई गई जानकारी पर आधारित; स्वतंत्र रूप से सत्यापित नहीं।',
  noOutcome: 'वास्तविक परिणाम संस्था तय करती है।'
};

const EN_STATUSES = {
  title: 'Case status',
  preparing: 'Preparing',
  officialSearch: 'Official search / handoff',
  'official-search': 'Official search / handoff',
  waitingOnInstitution: 'Waiting on institution',
  'waiting-on-institution': 'Waiting on institution',
  actionReported: 'Action reported by you',
  'action-reported': 'Action reported by you',
  submissionReported: 'Submission reported by you',
  'submission-reported': 'Submission reported by you',
  institutionConfirmed: 'Institution-confirmed outcome',
  'institution-confirmed': 'Institution-confirmed outcome',
  userReportedResolved: 'User-reported resolved',
  'user-reported-resolved': 'User-reported resolved',
  preparingAction: 'Review the checklist and confirm the official next destination.',
  officialSearchAction: 'Complete the official search or handoff yourself; do not share credentials here.',
  waitingOnInstitutionAction: 'Record the institution response or return to preparation if information is missing.',
  userReportedResolvedAction: 'Keep this record for your reference. This is not official confirmation.',
  actionReportedAction: 'You reported completing an external search or handoff. Reclaim Labs did not verify it.',
  submissionReportedAction: 'You reported submitting information to an institution. Reclaim Labs did not verify it.',
  transitionNotAllowed: 'That status transition is not allowed.',
  transitionSaved: 'Case status updated.',
  current: 'Current status',
  next: 'Next status'
};

const HI_STATUSES = {
  title: 'केस स्थिति',
  preparing: 'तैयारी जारी',
  officialSearch: 'आधिकारिक खोज / हस्तांतरण',
  'official-search': 'आधिकारिक खोज / हस्तांतरण',
  waitingOnInstitution: 'संस्था के उत्तर की प्रतीक्षा',
  'waiting-on-institution': 'संस्था के उत्तर की प्रतीक्षा',
  actionReported: 'आपके द्वारा कार्रवाई बताई गई',
  'action-reported': 'आपके द्वारा कार्रवाई बताई गई',
  submissionReported: 'आपके द्वारा जमा करना बताया गया',
  'submission-reported': 'आपके द्वारा जमा करना बताया गया',
  institutionConfirmed: 'संस्था द्वारा पुष्टि किया गया परिणाम',
  'institution-confirmed': 'संस्था द्वारा पुष्टि किया गया परिणाम',
  userReportedResolved: 'उपयोगकर्ता के अनुसार समाधान',
  'user-reported-resolved': 'उपयोगकर्ता के अनुसार समाधान',
  preparingAction: 'चेकलिस्ट की समीक्षा करें और आधिकारिक अगला गंतव्य तय करें।',
  officialSearchAction: 'आधिकारिक खोज या हस्तांतरण स्वयं पूरा करें; यहाँ क्रेडेंशियल साझा न करें।',
  waitingOnInstitutionAction: 'संस्था का उत्तर दर्ज करें या जानकारी अधूरी हो तो तैयारी पर लौटें।',
  userReportedResolvedAction: 'यह रिकॉर्ड अपने संदर्भ के लिए रखें। यह आधिकारिक पुष्टि नहीं है।',
  actionReportedAction: 'आपने बाहरी खोज या हस्तांतरण पूरा करने की सूचना दी है। Reclaim Labs ने इसे सत्यापित नहीं किया।',
  submissionReportedAction: 'आपने संस्था को जानकारी जमा करने की सूचना दी है। Reclaim Labs ने इसे सत्यापित नहीं किया।',
  transitionNotAllowed: 'यह स्थिति परिवर्तन अनुमत नहीं है।',
  transitionSaved: 'केस स्थिति अपडेट की गई।',
  current: 'वर्तमान स्थिति',
  next: 'अगली स्थिति'
};

const EN_ACCESSIBILITY = {
  mainContent: 'Main content',
  primaryNavigation: 'Primary navigation',
  languageSelector: 'Choose language',
  menu: 'Menu',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  closeDialog: 'Close dialog',
  dismissNotice: 'Dismiss notice',
  expandSection: 'Expand section',
  collapseSection: 'Collapse section',
  currentPage: 'Current page',
  externalLink: 'Opens in a new tab',
  requiredField: '{{field}} is required',
  optionalField: '{{field}} is optional',
  errorSummary: 'There are {{count}} errors to review',
  progress: 'Progress: {{percentage}} percent complete',
  caseCount: '{{count}} local demo cases',
  status: 'Status',
  announcement: 'Announcement',
  selected: 'Selected',
  notSelected: 'Not selected',
  checked: 'Checked',
  notChecked: 'Not checked',
  decorative: 'Decorative'
};

const HI_ACCESSIBILITY = {
  mainContent: 'मुख्य सामग्री',
  primaryNavigation: 'मुख्य नेविगेशन',
  languageSelector: 'भाषा चुनें',
  menu: 'मेन्यू',
  openMenu: 'मेन्यू खोलें',
  closeMenu: 'मेन्यू बंद करें',
  closeDialog: 'संवाद बंद करें',
  dismissNotice: 'सूचना हटाएँ',
  expandSection: 'अनुभाग खोलें',
  collapseSection: 'अनुभाग बंद करें',
  currentPage: 'वर्तमान पृष्ठ',
  externalLink: 'नए टैब में खुलेगा',
  requiredField: '{{field}} आवश्यक है',
  optionalField: '{{field}} वैकल्पिक है',
  errorSummary: 'समीक्षा के लिए {{count}} त्रुटियाँ हैं',
  progress: 'प्रगति: {{percentage}} प्रतिशत पूर्ण',
  caseCount: '{{count}} स्थानीय डेमो केस',
  status: 'स्थिति',
  announcement: 'घोषणा',
  selected: 'चयनित',
  notSelected: 'चयनित नहीं',
  checked: 'चेक किया गया',
  notChecked: 'चेक नहीं किया गया',
  decorative: 'सजावटी'
};

const EN_ASSISTANT = {
  title: 'Assistant',
  intro: 'Ask about the verified UDGAM search guidance or the IEPF handoff.',
  languageLabel: 'Response language',
  questionLabel: 'Your question',
  questionPlaceholder: 'Ask about IEPF or UDGAM preparation',
  send: 'Ask assistant',
  clear: 'Clear question',
  fallbackLabel: 'Deterministic fallback',
  fallbackNotice: 'The provider is not connected. This answer uses the approved deterministic fallback.',
  providerNotConfigured: 'Provider not configured',
  deterministic: 'Deterministic fallback',
  grounded: 'Source-grounded answer',
  outOfCorpus: 'Outside the supported guidance',
  refused: 'Safe refusal',
  sourceLabel: 'Sources used',
  noSources: 'No source attached',
  supportedTopics: 'I can explain UDGAM search preparation or the IEPF handoff.',
  cannotConfirm: 'I cannot determine whether an asset exists, approve a claim, provide an amount, or give legal advice.',
  emptyQuestion: 'Ask about the IEPF route, UDGAM search preparation, or what Reclaim Labs does not verify.',
  iepfFallback: 'Check the current IEPF Authority and MCA instructions yourself. Reclaim Labs can explain a possible next step, but it cannot confirm eligibility, the existence of shares, or an official outcome.',
  udgamFallback: 'RBI describes UDGAM as a search facility for unclaimed deposits/accounts across participating banks. UDGAM does not settle the claim; the claim is made with the respective bank.',
  unsupported: 'This question is outside the verified guidance available in this demo.'
};

const HI_ASSISTANT = {
  title: 'सहायक',
  intro: 'सत्यापित UDGAM खोज मार्गदर्शन या IEPF हस्तांतरण के बारे में पूछें।',
  languageLabel: 'उत्तर की भाषा',
  questionLabel: 'आपका प्रश्न',
  questionPlaceholder: 'IEPF या UDGAM की तैयारी के बारे में पूछें',
  send: 'सहायक से पूछें',
  clear: 'प्रश्न साफ़ करें',
  fallbackLabel: 'नियत fallback',
  fallbackNotice: 'प्रदाता जुड़ा नहीं है। यह उत्तर स्वीकृत नियत fallback का उपयोग करता है।',
  providerNotConfigured: 'प्रदाता कॉन्फ़िगर नहीं है',
  deterministic: 'नियत fallback',
  grounded: 'स्रोत-आधारित उत्तर',
  outOfCorpus: 'समर्थित मार्गदर्शन से बाहर',
  refused: 'सुरक्षित अस्वीकार',
  sourceLabel: 'उपयोग किए गए स्रोत',
  noSources: 'कोई स्रोत संलग्न नहीं',
  supportedTopics: 'मैं UDGAM खोज की तैयारी या IEPF हस्तांतरण समझा सकता हूँ।',
  cannotConfirm: 'मैं यह तय नहीं कर सकता कि कोई संपत्ति मौजूद है या नहीं, कोई दावा स्वीकृत नहीं कर सकता, राशि नहीं बता सकता और कानूनी सलाह नहीं दे सकता।',
  emptyQuestion: 'IEPF मार्ग, UDGAM खोज की तैयारी या Reclaim Labs किन बातों की पुष्टि नहीं करता, इनके बारे में पूछें।',
  iepfFallback: 'वर्तमान IEPF Authority और MCA निर्देश स्वयं जाँचें। Reclaim Labs संभावित अगला कदम समझा सकता है, लेकिन पात्रता, शेयरों के अस्तित्व या आधिकारिक परिणाम की पुष्टि नहीं कर सकता।',
  udgamFallback: 'RBI के अनुसार UDGAM भाग लेने वाले बैंकों में लावारिस जमा/खातों की खोज की सुविधा है। UDGAM दावा तय नहीं करता; दावा संबंधित बैंक के साथ किया जाता है।',
  unsupported: 'यह प्रश्न इस डेमो में उपलब्ध सत्यापित मार्गदर्शन से बाहर है।'
};

const EN_VALIDATION = {
  required: '{{field}} is required.',
  invalidLanguage: 'That language is not supported. English is being used instead.',
  invalidKey: 'That translation is not available.',
  missingQuestion: 'Enter a question before asking the assistant.',
  invalidOption: 'Choose one of the available options.',
  invalidInput: 'Check this value and try again.',
  companyNameTooLong: 'Keep the company or RTA label to 120 characters or fewer.',
  unsafeInput: 'Do not enter credentials, account numbers, OTPs, or documents here.',
  noSensitiveData: 'Use only non-sensitive workflow information.',
  missingInformation: 'More information is needed before this route can be prepared.',
  noOfficialConfirmation: 'This demo cannot provide official confirmation.'
};

const HI_VALIDATION = {
  required: '{{field}} आवश्यक है।',
  invalidLanguage: 'यह भाषा समर्थित नहीं है। इसके बजाय अंग्रेज़ी का उपयोग किया जा रहा है।',
  invalidKey: 'यह अनुवाद उपलब्ध नहीं है।',
  missingQuestion: 'सहायक से पूछने से पहले प्रश्न दर्ज करें।',
  invalidOption: 'उपलब्ध विकल्पों में से एक चुनें।',
  invalidInput: 'इस मान की जाँच करें और फिर कोशिश करें।',
  companyNameTooLong: 'कंपनी या RTA लेबल को 120 या उससे कम वर्णों तक रखें।',
  unsafeInput: 'यहाँ क्रेडेंशियल, खाता संख्या, OTP या दस्तावेज़ दर्ज न करें।',
  noSensitiveData: 'केवल गैर-संवेदनशील वर्कफ़्लो जानकारी का उपयोग करें।',
  missingInformation: 'इस मार्ग की तैयारी से पहले अधिक जानकारी आवश्यक है।',
  noOfficialConfirmation: 'यह डेमो आधिकारिक पुष्टि नहीं दे सकता।'
};

const EN_RESET = {
  title: 'Reset demo',
  description: 'This removes synthetic cases and local preparation state from this browser.',
  confirm: 'Reset all synthetic demo data?',
  action: 'Reset demo',
  completed: 'Synthetic demo data reset. No real records were changed.',
  cancelled: 'Reset cancelled.',
  failed: 'Reset failed. Try again.',
  empty: 'There is no synthetic demo data to reset.'
};

const HI_RESET = {
  title: 'डेमो रीसेट करें',
  description: 'यह इस ब्राउज़र से सिंथेटिक केस और स्थानीय तैयारी की स्थिति हटा देता है।',
  confirm: 'सारा सिंथेटिक डेमो डेटा रीसेट करें?',
  action: 'डेमो रीसेट करें',
  completed: 'सिंथेटिक डेमो डेटा रीसेट कर दिया गया। कोई वास्तविक रिकॉर्ड नहीं बदला गया।',
  cancelled: 'रीसेट रद्द किया गया।',
  failed: 'रीसेट विफल हुआ। फिर कोशिश करें।',
  empty: 'रीसेट करने के लिए कोई सिंथेटिक डेमो डेटा नहीं है।'
};

const EN_ERRORS = {
  notFound: 'The requested item was not found.',
  saveFailed: 'The demo case could not be saved. Try again.',
  loadFailed: 'The saved demo data could not be loaded. A fresh demo was started.',
  unexpected: 'Something went wrong. Try again.',
  duplicateCase: 'That preparation route is already tracked; no duplicate case was created.',
  officialDestinationBlocked: 'The browser blocked the new tab. Use the official destination link again.'
};

const HI_ERRORS = {
  notFound: 'माँगी गई वस्तु नहीं मिली।',
  saveFailed: 'डेमो केस सहेजा नहीं जा सका। फिर कोशिश करें।',
  loadFailed: 'सहेजा गया डेमो डेटा लोड नहीं हो सका। नया डेमो शुरू किया गया।',
  unexpected: 'कुछ गलत हुआ। फिर कोशिश करें।',
  duplicateCase: 'यह तैयारी मार्ग पहले से ट्रैक हो रहा है; कोई डुप्लिकेट केस नहीं बनाया गया।',
  officialDestinationBlocked: 'ब्राउज़र ने नया टैब ब्लॉक कर दिया। आधिकारिक गंतव्य लिंक फिर खोलें।'
};

const EN_UI = {
  home: {
    eyebrow: 'Discover · assess · prepare · track',
    title: 'Could your family have forgotten money or shares?',
    description: 'Reclaim Labs helps you understand where to look, prepare for official processes, and track your next steps without claiming to find or verify an asset.',
    trustTitle: 'The honest promise',
    trustHeading: 'A suggested route, not proof.',
    trustBody: 'Only the official institution can confirm whether an asset exists, which route applies, or whether a claim is accepted.',
    categoriesEyebrow: 'Two official paths',
    categoriesTitle: 'Where should you start?',
    categoriesDescription: 'These are preparation journeys, not a private registry. You always open the official destination yourself.',
    iepfCardTitle: 'Company shares or dividends',
    iepfCardBody: 'For your own possible holding or a family member’s situation. Make uncertainty visible, prepare safely, and identify the next institution to ask.',
    udgamCardTitle: 'Forgotten bank deposits',
    udgamCardBody: 'Prepare the non-sensitive information RBI lists for an official UDGAM search. A search result is not an approved or paid claim.',
    possibleOnly: 'Suggested route only',
    noAmount: 'No amount shown',
    searchPreparation: 'Search preparation',
    claimStaysWithBank: 'Claim stays with bank',
    returnTitle: 'A case that remembers your next action.',
    returnBody: 'Your local case keeps preparation notes and your own reports in this browser. It never turns them into institutional proof.',
    assess: 'Assess',
    prepare: 'Prepare',
    return: 'Return',
    assessBody: 'Make the uncertainty visible.',
    prepareBody: 'Review what to verify without uploads.',
    returnBodyShort: 'Track your own follow-up.'
  },
  discover: {
    eyebrow: 'Guided preparation',
    title: 'Choose what you want to investigate',
    description: 'Start with the category that matches your situation. Reclaim Labs will ask only what changes the next safe step.',
    privacy: 'You can continue without entering account numbers, passwords, OTPs, Aadhaar, PAN, or document contents.',
    openJourney: 'Start this journey',
    resume: 'Resume this journey',
    noJourney: 'No journey is open',
    noJourneyBody: 'Choose IEPF or UDGAM to begin a guided preparation flow.',
    backToDiscover: 'Back to Discover'
  },
  cases: {
    eyebrow: 'Your local record',
    title: 'Cases',
    description: 'Cases keep your own preparation state in this browser. They do not prove a search, submission, claim, or outcome.',
    newIepf: 'New IEPF case',
    noCases: 'No local cases yet',
    noCasesBody: 'Start an IEPF family/heir assessment or prepare a UDGAM search. A case is created only when you choose to track it.',
    startIepf: 'Start IEPF',
    startUdgum: 'Start UDGAM',
    stepsReviewed: '{{reviewed}} / {{total}}',
    itemsReviewed: 'preparation items reviewed',
    localUpdated: 'last updated',
    nextAction: 'Next action',
    timeline: 'Case timeline',
    created: 'Local demo case created',
    demo: 'Demo data',
    familyHeir: 'Family / heir',
    namedHolder: 'Named holder',
    searchPrep: 'Search preparation',
    reportAction: 'Report external action',
    reportSubmission: 'Report submission to institution',
    returnToPreparation: 'Return to preparation',
    markResolved: 'Mark resolved by you',
    resolvedNote: 'Marked resolved by you. This is not institution-confirmed.'
  },
  settings: {
    eyebrow: 'Control your demo data',
    title: 'Settings',
    description: 'Choose your language, inspect what is stored locally, review official sources, and reset the synthetic demo.',
    languageTitle: 'Language',
    languageDescription: 'English and Hindi cover the complete core experience. Kannada is not advertised until it is fully translated and reviewed.',
    storageTitle: 'Privacy and storage',
    storageDescription: 'This demo stores state only in this browser. It is not cloud-synchronized and may be lost if browser data is cleared.',
    storedTitle: 'What the demo stores',
    storedBody: 'Synthetic workflow choices, optional labels, preparation items you marked reviewed, user-reported case statuses, and timestamps.',
    notStoredTitle: 'What the demo does not store',
    notStoredBody: 'Passwords, OTPs, portal credentials, account numbers, sensitive identifiers, documents, or official results.',
    exportTitle: 'Export synthetic state',
    exportBody: 'Download a local JSON copy for inspection. It is not an official record.',
    exportAction: 'Download demo JSON',
    resetTitle: 'Reset synthetic demo data',
    resetBody: 'Remove demo cases and unfinished preparation state saved in this browser. This cannot affect any official institution.',
    resetAction: 'Reset and delete demo data',
    sourcesTitle: 'Official source directory',
    sourcesDescription: 'A destination link is not the same as a verified procedural claim. Each source shows its check date and status.',
    supports: 'What this record supports',
    openQuestions: 'Open questions',
    sourceId: 'Source ID',
    checked: 'Checked'
  },
  workflow: {
    context: 'Context',
    routeQuestions: 'Route questions',
    assessmentStep: 'Assessment',
    prepareStep: 'Prepare',
    tracked: 'Tracked',
    searchInputs: 'Search inputs',
    preparation: 'Prepare',
    iepfStep: 'IEPF · Step {{step}} of 4',
    udgamStep: 'UDGAM · Step {{step}} of 2',
    contextHeading: 'Who are you helping?',
    contextBody: 'Choose the situation that best matches what you know today.',
    claimantLegend: 'Claimant context',
    heirDetail: 'I am helping with a deceased family member’s possible shares or dividends.',
    holderDetail: 'I am checking a possible holding associated with me.',
    routeHeading: 'What is known about the holding?',
    routeBody: 'These answers choose a preparation route. They do not prove that a holding exists.',
    custodyLegend: 'Where might the holding be recorded?',
    custodyIepfDetail: 'You have a reason to think the holding is already with IEPF.',
    custodyCompanyDetail: 'You have a reason to think the company or RTA still records it.',
    custodyUnknownDetail: 'Reclaim Labs will route you to a custody-verification step.',
    heirContext: 'The institution decides what current evidence it accepts. This demo records availability only.',
    deathEvidenceTitle: 'Is death-related evidence available to arrange?',
    heirAuthorityTitle: 'Is heir authority / succession evidence available to arrange?',
    evidenceHint: 'Do not upload it here. The official institution must confirm what it accepts.',
    authorityHint: 'This is a preparation prompt, not a statement of legal eligibility.',
    yesDetail: 'This is still user-reported, not institutionally verified.',
    noDetail: 'The next step will show this as an information gap.',
    continueRoute: 'Continue to route questions',
    assessmentHeading: 'Here is the next place to check.',
    assessmentBody: 'This is a deterministic suggestion from your answers—not an eligibility decision or an asset search.',
    whatYouTold: 'What you told us',
    whatSuggests: 'What those answers suggest',
    notChecked: 'What has not been checked or verified',
    missingCustody: 'Where the holding is recorded',
    missingCustodyReason: 'The company/RTA versus IEPF distinction changes the next official destination.',
    missingDeathEvidence: 'Death-related evidence availability',
    missingDeathEvidenceReason: 'Ask the relevant institution what current evidence it accepts; do not upload it here.',
    missingHeirAuthority: 'Heir authority evidence availability',
    missingHeirAuthorityReason: 'Ask the relevant institution what current succession or authority evidence it accepts.',
    missingIssuer: 'Company or RTA name',
    missingIssuerReason: 'The official institution may need the issuer or its RTA to locate the record.',
    udgamMissingHolder: 'Account-holder name',
    udgamMissingHolderReason: 'RBI lists this as a search input for an individual.',
    udgamMissingBank: 'Bank name',
    udgamMissingBankReason: 'RBI lists one or more banks as a search input.',
    udgamMissingIdentifier: 'Additional identifier or address',
    udgamMissingIdentifierReason: 'RBI lists an identifier or address as a search input. Reclaim Labs does not collect the value.',
    doNext: 'What you can do next',
    suggestedRoute: 'Suggested route',
    ruleUsed: 'Deterministic rule used',
    officialDestinations: 'Official destinations',
    officialDestinationsBody: 'Open the institution yourself. Reclaim Labs does not search, file, submit documents, or act as a middleman.',
    buildChecklist: 'Build preparation checklist',
    prepareHeading: 'Prepare without over-collecting',
    prepareBody: 'Mark an item reviewed only when you have read it. That does not verify a document, institution record, external action, or eligibility.',
    currentSourceCaution: 'The IEPF Authority and MCA destinations are official, but their pages returned an access error to this audit. Confirm current instructions on the official site before acting.',
    openNext: 'Open the official next step',
    createCase: 'Create local demo case',
    searchHeading: 'Prepare a search, not a claim',
    searchBody: 'RBI lists these information categories for an individual UDGAM search. We ask only whether you have them.',
    verifiedRbi: 'Verified RBI guidance',
    accountNameQuestion: 'Do you know the account-holder name?',
    bankQuestion: 'Do you know the bank name?',
    identifierQuestion: 'Do you have an additional identifier or address?',
    accountNameHint: 'Do not enter the name into this demo.',
    bankHint: 'You can select one or more banks on the official portal.',
    identifierHint: 'RBI lists options such as PAN, driving licence, voter ID, passport, date of birth, or address. Do not enter the value here.',
    reviewSearch: 'Review search plan',
    searchPlanHeading: 'Your official search plan',
    searchPlanBody: 'This plan helps you arrive at UDGAM prepared. It does not search the portal for you.',
    stillArrange: 'Still to arrange',
    readyPrepare: 'Ready to prepare the search. The official portal still decides what appears and the bank decides any claim.',
    openUdgum: 'Open official UDGAM',
    trackedHeading: 'Your case has a next action.',
    trackedBody: 'This record is synthetic and stays in this browser. It is not a filing receipt or institutional confirmation.',
    notApproved: 'Not an approved claim.',
    notProof: 'Not proof an asset exists.',
    notOfficialStatus: 'Not official status.',
    exploreAnother: 'Explore another category',
    acknowledged: 'Reviewed by you',
    notYetReviewed: 'Not reviewed yet'
  },
  source: {
    official: 'Official destination',
    verified: 'Verified source',
    accessBlocked: 'Official destination — page not verified in this audit',
    rbiUdgumFaq: 'RBI UDGAM FAQ',
    rbiDeaFaq: 'RBI DEA Fund FAQ',
    udgamPortal: 'Official UDGAM',
    iepfAuthority: 'IEPF Authority',
    mca: 'MCA',
    nsdlGuide: 'NSDL investor guide',
    dfsGateway: 'DFS financial gateway'
  },
  common: {
    noAmount: 'No amount estimates',
    noCredentials: 'No portal passwords, OTPs, or document uploads',
    noMiddleman: 'No middleman, filing, or percentage of recovery',
    possibleRouteOnly: 'Suggested route only',
    userReportedNotVerified: 'User-reported — not independently verified',
    acknowledgmentOnly: 'Review acknowledgement only',
    claimNotConfirmed: 'Search preparation is not claim confirmation'
  }
};

const HI_UI = {
  home: {
    eyebrow: 'जानें · आकलन करें · तैयारी करें · ट्रैक करें',
    title: 'क्या आपके परिवार के पैसे या शेयर छूट गए हो सकते हैं?',
    description: 'Reclaim Labs आपको समझने, आधिकारिक प्रक्रिया की तैयारी करने और अगले कदम ट्रैक करने में मदद करता है—यह किसी संपत्ति को खोजने या सत्यापित करने का दावा नहीं करता।',
    trustTitle: 'ईमानदार वादा',
    trustHeading: 'संभावित मार्ग, प्रमाण नहीं।',
    trustBody: 'किसी संपत्ति के अस्तित्व, लागू मार्ग या दावे की स्वीकृति की पुष्टि केवल आधिकारिक संस्था कर सकती है।',
    categoriesEyebrow: 'दो आधिकारिक मार्ग',
    categoriesTitle: 'आप कहाँ से शुरू करें?',
    categoriesDescription: 'ये तैयारी के मार्ग हैं, कोई निजी रजिस्ट्री नहीं। आधिकारिक गंतव्य आप स्वयं खोलते हैं।',
    iepfCardTitle: 'कंपनी के शेयर या लाभांश',
    iepfCardBody: 'अपने संभावित होल्डिंग या परिवार के सदस्य की स्थिति के लिए। अनिश्चितता स्पष्ट करें, सुरक्षित तैयारी करें और अगली संस्था पहचानें।',
    udgamCardTitle: 'भूली हुई बैंक जमा',
    udgamCardBody: 'आधिकारिक UDGAM खोज के लिए RBI द्वारा सूचीबद्ध गैर-संवेदनशील जानकारी तैयार करें। खोज परिणाम स्वीकृत या भुगतान किया गया दावा नहीं है।',
    possibleOnly: 'केवल संभावित मार्ग',
    noAmount: 'राशि नहीं दिखाई जाती',
    searchPreparation: 'खोज की तैयारी',
    claimStaysWithBank: 'दावा बैंक के साथ रहता है',
    returnTitle: 'ऐसा केस जो आपका अगला कदम याद रखे।',
    returnBody: 'आपका स्थानीय केस इसी ब्राउज़र में तैयारी के नोट और आपकी रिपोर्ट रखता है। यह उन्हें संस्था के प्रमाण में नहीं बदलता।',
    assess: 'आकलन',
    prepare: 'तैयारी',
    return: 'वापस आएँ',
    assessBody: 'अनिश्चितता स्पष्ट करें।',
    prepareBody: 'बिना अपलोड के क्या सत्यापित करना है देखें।',
    returnBodyShort: 'अपना फॉलो-अप ट्रैक करें।'
  },
  discover: {
    eyebrow: 'निर्देशित तैयारी',
    title: 'आप क्या जाँचना चाहते हैं चुनें',
    description: 'अपनी स्थिति से मेल खाती श्रेणी चुनें। Reclaim Labs केवल वही पूछेगा जो अगले सुरक्षित कदम को बदलता है।',
    privacy: 'आपको खाता संख्या, पासवर्ड, OTP, Aadhaar, PAN या दस्तावेज़ की सामग्री दर्ज किए बिना आगे बढ़ सकते हैं।',
    openJourney: 'यह यात्रा शुरू करें',
    resume: 'यह यात्रा जारी रखें',
    noJourney: 'कोई यात्रा खुली नहीं है',
    noJourneyBody: 'निर्देशित तैयारी शुरू करने के लिए IEPF या UDGAM चुनें।',
    backToDiscover: 'डिस्कवर पर लौटें'
  },
  cases: {
    eyebrow: 'आपका स्थानीय रिकॉर्ड',
    title: 'केस',
    description: 'केस आपकी तैयारी की स्थिति इसी ब्राउज़र में रखते हैं। वे खोज, जमा करना, दावा या परिणाम सिद्ध नहीं करते।',
    newIepf: 'नया IEPF केस',
    noCases: 'अभी कोई स्थानीय केस नहीं है',
    noCasesBody: 'IEPF परिवार/उत्तराधिकारी आकलन शुरू करें या UDGAM खोज की तैयारी करें। केस तभी बनेगा जब आप उसे ट्रैक करना चुनेंगे।',
    startIepf: 'IEPF शुरू करें',
    startUdgum: 'UDGAM शुरू करें',
    stepsReviewed: '{{reviewed}} / {{total}}',
    itemsReviewed: 'तैयारी आइटम देखे गए',
    localUpdated: 'अंतिम अपडेट',
    nextAction: 'अगला कदम',
    timeline: 'केस टाइमलाइन',
    created: 'स्थानीय डेमो केस बनाया गया',
    demo: 'डेमो डेटा',
    familyHeir: 'परिवार / उत्तराधिकारी',
    namedHolder: 'नामित धारक',
    searchPrep: 'खोज की तैयारी',
    reportAction: 'बाहरी कार्रवाई की सूचना दें',
    reportSubmission: 'संस्था को जमा करने की सूचना दें',
    returnToPreparation: 'तैयारी पर लौटें',
    markResolved: 'आपके अनुसार समाधान चिह्नित करें',
    resolvedNote: 'आपके द्वारा समाधान के रूप में चिह्नित। यह संस्था द्वारा पुष्टि नहीं है।'
  },
  settings: {
    eyebrow: 'अपने डेमो डेटा को नियंत्रित करें',
    title: 'सेटिंग्स',
    description: 'भाषा चुनें, स्थानीय स्टोरेज देखें, आधिकारिक स्रोतों की समीक्षा करें और सिंथेटिक डेमो रीसेट करें।',
    languageTitle: 'भाषा',
    languageDescription: 'अंग्रेज़ी और हिंदी पूरे मुख्य अनुभव को कवर करते हैं। कन्नड़ को पूर्ण अनुवाद और समीक्षा तक विज्ञापित नहीं किया गया है।',
    storageTitle: 'गोपनीयता और स्टोरेज',
    storageDescription: 'यह डेमो स्थिति केवल इसी ब्राउज़र में रखता है। यह क्लाउड-सिंक नहीं है और ब्राउज़र डेटा साफ़ होने पर खो सकता है।',
    storedTitle: 'डेमो क्या रखता है',
    storedBody: 'सिंथेटिक वर्कफ़्लो विकल्प, वैकल्पिक लेबल, आपके द्वारा देखे गए तैयारी आइटम, उपयोगकर्ता द्वारा बताई गई केस स्थिति और टाइमस्टैम्प।',
    notStoredTitle: 'डेमो क्या नहीं रखता',
    notStoredBody: 'पासवर्ड, OTP, पोर्टल क्रेडेंशियल, खाता संख्या, संवेदनशील पहचानकर्ता, दस्तावेज़ या आधिकारिक परिणाम।',
    exportTitle: 'सिंथेटिक स्थिति निर्यात करें',
    exportBody: 'जाँच के लिए स्थानीय JSON कॉपी डाउनलोड करें। यह आधिकारिक रिकॉर्ड नहीं है।',
    exportAction: 'डेमो JSON डाउनलोड करें',
    resetTitle: 'सिंथेटिक डेमो डेटा रीसेट करें',
    resetBody: 'इस ब्राउज़र में सहेजे गए डेमो केस और अधूरी तैयारी की स्थिति हटाएँ। इससे किसी आधिकारिक संस्था पर असर नहीं होगा।',
    resetAction: 'रीसेट करें और डेमो डेटा हटाएँ',
    sourcesTitle: 'आधिकारिक स्रोत निर्देशिका',
    sourcesDescription: 'गंतव्य लिंक सत्यापित प्रक्रियात्मक दावे के समान नहीं है। हर स्रोत की जाँच तिथि और स्थिति दिखाई जाती है।',
    supports: 'यह रिकॉर्ड किसे समर्थन देता है',
    openQuestions: 'खुले प्रश्न',
    sourceId: 'स्रोत आईडी',
    checked: 'जाँचा गया'
  },
  workflow: {
    context: 'संदर्भ',
    routeQuestions: 'मार्ग के प्रश्न',
    assessmentStep: 'आकलन',
    prepareStep: 'तैयारी',
    tracked: 'ट्रैक किया गया',
    searchInputs: 'खोज इनपुट',
    preparation: 'तैयारी',
    iepfStep: 'IEPF · {{step}} में से चरण {{step}}',
    udgamStep: 'UDGAM · {{step}} में से चरण {{step}}',
    contextHeading: 'आप किसकी मदद कर रहे हैं?',
    contextBody: 'आज आपको जो पता है उससे सबसे मेल खाती स्थिति चुनें।',
    claimantLegend: 'दावेदार का संदर्भ',
    heirDetail: 'मैं किसी मृत परिवार सदस्य के संभावित शेयर या लाभांश में मदद कर रहा/रही हूँ।',
    holderDetail: 'मैं अपने नाम से जुड़े संभावित होल्डिंग की जाँच कर रहा/रही हूँ।',
    routeHeading: 'होल्डिंग के बारे में क्या पता है?',
    routeBody: 'इन उत्तरों से तैयारी का मार्ग चुना जाता है। वे होल्डिंग के अस्तित्व का प्रमाण नहीं हैं।',
    custodyLegend: 'होल्डिंग कहाँ दर्ज हो सकती है?',
    custodyIepfDetail: 'आपके पास कारण है कि होल्डिंग IEPF के पास हो सकती है।',
    custodyCompanyDetail: 'आपके पास कारण है कि कंपनी या RTA इसे अभी दर्ज करता हो।',
    custodyUnknownDetail: 'Reclaim Labs आपको कस्टडी सत्यापन वाले चरण तक ले जाएगा।',
    heirContext: 'संस्था तय करती है कि वह वर्तमान में कौन-सा प्रमाण स्वीकार करती है। यह डेमो केवल उपलब्धता दर्ज करता है।',
    deathEvidenceTitle: 'क्या मृत्यु-संबंधी प्रमाण व्यवस्थित किया जा सकता है?',
    heirAuthorityTitle: 'क्या उत्तराधिकारी अधिकार / उत्तराधिकार प्रमाण व्यवस्थित किया जा सकता है?',
    evidenceHint: 'इसे यहाँ अपलोड न करें। आधिकारिक संस्था को बताना होगा कि वह क्या स्वीकार करती है।',
    authorityHint: 'यह तैयारी का प्रश्न है, कानूनी पात्रता का निष्कर्ष नहीं।',
    yesDetail: 'यह अभी भी उपयोगकर्ता द्वारा बताया गया है, संस्था द्वारा सत्यापित नहीं।',
    noDetail: 'अगले चरण में इसे जानकारी की कमी के रूप में दिखाया जाएगा।',
    continueRoute: 'मार्ग के प्रश्नों पर जाएँ',
    assessmentHeading: 'यहाँ अगली जगह जाँचें।',
    assessmentBody: 'यह आपके उत्तरों से निकला नियतात्मक सुझाव है—पात्रता का निर्णय या संपत्ति की खोज नहीं।',
    whatYouTold: 'आपने हमें क्या बताया',
    whatSuggests: 'इन उत्तरों का संकेत',
    notChecked: 'क्या जाँचा या सत्यापित नहीं हुआ',
    missingCustody: 'होल्डिंग कहाँ दर्ज है',
    missingCustodyReason: 'कंपनी/RTA और IEPF के बीच का अंतर अगला आधिकारिक गंतव्य बदलता है।',
    missingDeathEvidence: 'मृत्यु-संबंधी प्रमाण की उपलब्धता',
    missingDeathEvidenceReason: 'आधिकारिक संस्था से पूछें कि वह कौन-सा वर्तमान प्रमाण स्वीकार करती है; इसे यहाँ अपलोड न करें।',
    missingHeirAuthority: 'उत्तराधिकारी अधिकार प्रमाण की उपलब्धता',
    missingHeirAuthorityReason: 'आधिकारिक संस्था से पूछें कि वह कौन-सा वर्तमान उत्तराधिकार या अधिकार प्रमाण स्वीकार करती है।',
    missingIssuer: 'कंपनी या RTA का नाम',
    missingIssuerReason: 'रिकॉर्ड खोजने के लिए आधिकारिक संस्था को जारीकर्ता या उसके RTA की आवश्यकता हो सकती है।',
    udgamMissingHolder: 'खाताधारक का नाम',
    udgamMissingHolderReason: 'RBI इसे व्यक्ति की खोज के इनपुट के रूप में सूचीबद्ध करता है।',
    udgamMissingBank: 'बैंक का नाम',
    udgamMissingBankReason: 'RBI एक या अधिक बैंकों को खोज इनपुट के रूप में सूचीबद्ध करता है।',
    udgamMissingIdentifier: 'अतिरिक्त पहचानकर्ता या पता',
    udgamMissingIdentifierReason: 'RBI पहचानकर्ता या पते को खोज इनपुट के रूप में सूचीबद्ध करता है। Reclaim Labs मान एकत्र नहीं करता।',
    doNext: 'अब आप क्या कर सकते हैं',
    suggestedRoute: 'संभावित मार्ग',
    ruleUsed: 'नियतात्मक नियम',
    officialDestinations: 'आधिकारिक गंतव्य',
    officialDestinationsBody: 'संस्था का गंतव्य स्वयं खोलें। Reclaim Labs खोज, फाइलिंग, दस्तावेज़ जमा या मध्यस्थता नहीं करता।',
    buildChecklist: 'तैयारी चेकलिस्ट बनाएँ',
    prepareHeading: 'बिना अधिक जानकारी जमा किए तैयारी करें',
    prepareBody: 'किसी आइटम को तभी देखा गया चिह्नित करें जब आपने उसे पढ़ लिया हो। इससे दस्तावेज़, संस्था का रिकॉर्ड, बाहरी कार्रवाई या पात्रता सत्यापित नहीं होती।',
    currentSourceCaution: 'IEPF Authority और MCA के गंतव्य आधिकारिक हैं, लेकिन इस ऑडिट में उनके पृष्ठों पर पहुँच त्रुटि आई। कार्रवाई से पहले आधिकारिक साइट पर वर्तमान निर्देश देखें।',
    openNext: 'आधिकारिक अगला कदम खोलें',
    createCase: 'स्थानीय डेमो केस बनाएँ',
    searchHeading: 'दावे की नहीं, खोज की तैयारी करें',
    searchBody: 'RBI व्यक्ति की UDGAM खोज के लिए इन जानकारी श्रेणियों को सूचीबद्ध करता है। हम केवल पूछते हैं कि वे आपके पास हैं या नहीं।',
    verifiedRbi: 'सत्यापित RBI मार्गदर्शन',
    accountNameQuestion: 'क्या खाताधारक का नाम पता है?',
    bankQuestion: 'क्या बैंक का नाम पता है?',
    identifierQuestion: 'क्या अतिरिक्त पहचानकर्ता या पता उपलब्ध है?',
    accountNameHint: 'नाम इस डेमो में दर्ज न करें।',
    bankHint: 'आधिकारिक पोर्टल पर एक या अधिक बैंक चुने जा सकते हैं।',
    identifierHint: 'RBI PAN, ड्राइविंग लाइसेंस, मतदाता पहचान पत्र, पासपोर्ट, जन्मतिथि या पता जैसे विकल्प सूचीबद्ध करता है। मान यहाँ दर्ज न करें।',
    reviewSearch: 'खोज योजना देखें',
    searchPlanHeading: 'आपकी आधिकारिक खोज योजना',
    searchPlanBody: 'यह योजना आपको UDGAM के लिए तैयार होने में मदद करती है। यह पोर्टल पर आपके लिए खोज नहीं करती।',
    stillArrange: 'अभी व्यवस्थित करना है',
    readyPrepare: 'खोज की तैयारी के लिए तैयार। आधिकारिक पोर्टल तय करेगा कि क्या दिखता है और बैंक दावा तय करेगा।',
    openUdgum: 'आधिकारिक UDGAM खोलें',
    trackedHeading: 'आपके केस में अगला कदम है।',
    trackedBody: 'यह रिकॉर्ड सिंथेटिक है और इसी ब्राउज़र में रहता है। यह फाइलिंग रसीद या संस्था की पुष्टि नहीं है।',
    notApproved: 'स्वीकृत दावा नहीं।',
    notProof: 'संपत्ति के अस्तित्व का प्रमाण नहीं।',
    notOfficialStatus: 'आधिकारिक स्थिति नहीं।',
    exploreAnother: 'दूसरी श्रेणी देखें',
    acknowledged: 'आपके द्वारा देखा गया',
    notYetReviewed: 'अभी नहीं देखा गया'
  },
  source: {
    official: 'आधिकारिक गंतव्य',
    verified: 'सत्यापित स्रोत',
    accessBlocked: 'आधिकारिक गंतव्य — इस ऑडिट में पृष्ठ सत्यापित नहीं हुआ',
    rbiUdgumFaq: 'RBI UDGAM FAQ',
    rbiDeaFaq: 'RBI DEA Fund FAQ',
    udgamPortal: 'आधिकारिक UDGAM',
    iepfAuthority: 'IEPF Authority',
    mca: 'MCA',
    nsdlGuide: 'NSDL निवेशक मार्गदर्शिका',
    dfsGateway: 'DFS वित्तीय गेटवे'
  },
  common: {
    noAmount: 'राशि का अनुमान नहीं',
    noCredentials: 'पोर्टल पासवर्ड, OTP या दस्तावेज़ अपलोड नहीं',
    noMiddleman: 'कोई मध्यस्थ, फाइलिंग या वसूली का प्रतिशत नहीं',
    possibleRouteOnly: 'केवल संभावित मार्ग',
    userReportedNotVerified: 'उपयोगकर्ता द्वारा बताया गया — स्वतंत्र रूप से सत्यापित नहीं',
    acknowledgmentOnly: 'केवल समीक्षा की स्वीकृति',
    claimNotConfirmed: 'खोज की तैयारी दावा पुष्टि नहीं है'
  }
};

const EN = {
  common: EN_COMMON,
  labels: EN_COMMON,
  navigation: EN_NAVIGATION,
  nav: EN_NAVIGATION,
  trust: EN_TRUST,
  privacy: { ...EN_STORAGE, storage: EN_STORAGE },
  storage: EN_STORAGE,
  iepf: EN_IEPF,
  udgam: EN_UDGAM,
  workflow: {
    ...EN_WORKFLOW,
    iepf: EN_IEPF,
    udgam: EN_UDGAM,
    status: EN_STATUSES,
    statuses: EN_STATUSES
  },
  statuses: EN_STATUSES,
  status: EN_STATUSES,
  accessibility: EN_ACCESSIBILITY,
  a11y: EN_ACCESSIBILITY,
  assistant: {
    ...EN_ASSISTANT,
    fallback: {
      label: EN_ASSISTANT.fallbackLabel,
      notice: EN_ASSISTANT.fallbackNotice,
      providerNotConfigured: EN_ASSISTANT.providerNotConfigured
    }
  },
  validation: { ...EN_VALIDATION, reset: EN_RESET },
  reset: EN_RESET,
  errors: EN_ERRORS,
  ui: EN_UI
};

const HI = {
  common: HI_COMMON,
  labels: HI_COMMON,
  navigation: HI_NAVIGATION,
  nav: HI_NAVIGATION,
  trust: HI_TRUST,
  privacy: { ...HI_STORAGE, storage: HI_STORAGE },
  storage: HI_STORAGE,
  iepf: HI_IEPF,
  udgam: HI_UDGAM,
  workflow: {
    ...HI_WORKFLOW,
    iepf: HI_IEPF,
    udgam: HI_UDGAM,
    status: HI_STATUSES,
    statuses: HI_STATUSES
  },
  statuses: HI_STATUSES,
  status: HI_STATUSES,
  accessibility: HI_ACCESSIBILITY,
  a11y: HI_ACCESSIBILITY,
  assistant: {
    ...HI_ASSISTANT,
    fallback: {
      label: HI_ASSISTANT.fallbackLabel,
      notice: HI_ASSISTANT.fallbackNotice,
      providerNotConfigured: HI_ASSISTANT.providerNotConfigured
    }
  },
  validation: { ...HI_VALIDATION, reset: HI_RESET },
  reset: HI_RESET,
  errors: HI_ERRORS,
  ui: HI_UI
};

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

export const TRANSLATIONS = deepFreeze({ en: EN, hi: HI });

// These names make the public API readable at call sites while retaining the
// conventional dictionary name for consumers that prefer it.
export const DICTIONARY = TRANSLATIONS;
export const translations = TRANSLATIONS;
export const dictionary = TRANSLATIONS;
export const supportedLanguages = SUPPORTED_LANGUAGES;
export const languageMetadata = LANGUAGE_METADATA;

const OWN = Object.prototype.hasOwnProperty;
const INTERPOLATION = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}|\{([A-Za-z0-9_.-]+)\}/g;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pathValue(source, path) {
  if (!isRecord(source) || typeof path !== 'string' || !path) return undefined;
  return path.split('.').reduce((value, segment) => {
    if (!isRecord(value) || !OWN.call(value, segment)) return undefined;
    return value[segment];
  }, source);
}

export function resolveLanguage(language = DEFAULT_LANGUAGE) {
  if (typeof language !== 'string') return DEFAULT_LANGUAGE;
  const normalized = language.trim().toLowerCase().replaceAll('_', '-');
  if (OWN.call(LANGUAGE_METADATA, normalized)) return normalized;
  const base = normalized.split('-')[0];
  return OWN.call(LANGUAGE_METADATA, base) ? base : DEFAULT_LANGUAGE;
}

export function isSupportedLanguage(language) {
  if (typeof language !== 'string') return false;
  const normalized = language.trim().toLowerCase().replaceAll('_', '-');
  return OWN.call(LANGUAGE_METADATA, normalized) || OWN.call(LANGUAGE_METADATA, normalized.split('-')[0]);
}

function primitiveInterpolationValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return undefined;
}

function interpolate(message, values) {
  if (typeof message !== 'string' || !isRecord(values)) return message;
  return message.replace(INTERPOLATION, (token, doubleKey, singleKey) => {
    const key = doubleKey || singleKey;
    const value = pathValue(values, key);
    if (value === undefined && !OWN.call(values, key.split('.')[0])) return token;
    const rendered = primitiveInterpolationValue(value);
    return rendered === undefined ? token : rendered;
  });
}

function normalizeArguments(languageOrValues, valuesOrLanguage) {
  let language = DEFAULT_LANGUAGE;
  let values = {};

  if (typeof languageOrValues === 'string') {
    language = languageOrValues;
    if (isRecord(valuesOrLanguage)) values = valuesOrLanguage;
  } else if (isRecord(languageOrValues)) {
    const options = languageOrValues;
    language = options.language ?? options.locale ?? DEFAULT_LANGUAGE;
    if (isRecord(options.values)) values = { ...options.values };
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'language' && key !== 'locale' && key !== 'values') values[key] = value;
    }
    if (typeof valuesOrLanguage === 'string') language = valuesOrLanguage;
  } else if (typeof valuesOrLanguage === 'string') {
    language = valuesOrLanguage;
  }

  return { language: resolveLanguage(language), values };
}

/**
 * Translate a dotted dictionary key and interpolate primitive values safely.
 *
 * Supported call forms:
 *   translate('navigation.explore')
 *   translate('navigation.explore', 'hi')
 *   translate('workflow.caseCount', 'en', { count: 2 })
 *   translate('workflow.caseCount', { language: 'hi', count: 2 })
 *   translate('workflow.caseCount', { count: 2 }, 'hi')
 *
 * Unsupported languages and missing target-language keys fall back to English;
 * an unknown key returns the key itself. Missing interpolation values remain
 * as placeholders so a partial payload cannot silently produce misleading text.
 */
export function translate(key, languageOrValues = DEFAULT_LANGUAGE, valuesOrLanguage = {}) {
  const normalizedKey = typeof key === 'string' ? key.trim() : '';
  if (!normalizedKey) return '';

  const { language, values } = normalizeArguments(languageOrValues, valuesOrLanguage);
  const localized = pathValue(TRANSLATIONS[language], normalizedKey);
  const english = pathValue(TRANSLATIONS[DEFAULT_LANGUAGE], normalizedKey);
  const message = typeof localized === 'string'
    ? localized
    : typeof english === 'string'
      ? english
      : normalizedKey;

  return interpolate(message, values);
}

export default Object.freeze({
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA,
  TRANSLATIONS,
  DICTIONARY,
  resolveLanguage,
  isSupportedLanguage,
  translate
});
