// Display copy only. Canonical records retain their source and workflow metadata.
const HINDI_COPY = {
  'journey-iepf': {
    title: 'दावा न किए गए शेयर और लाभांश — IEPF के लिए तैयारी',
    description: 'यह समझने की तैयारी में मदद कि आगे बढ़ने के लिए कंपनी/RTA या IEPF/MCA में से कौन-सा आधिकारिक माध्यम सही है।',
    institution: 'IEPF प्राधिकरण, कॉर्पोरेट कार्य मंत्रालय और संबंधित कंपनी या RTA',
    destination: 'IEPF प्राधिकरण और संबंधित कंपनी/RTA का आधिकारिक माध्यम',
    prompts: {
      'claimant-type': {
        label: 'दावेदार का प्रकार',
        question: 'क्या आप धारक हैं या परिवार के सदस्य/उत्तराधिकारी के रूप में दावा करना चाहते हैं?',
        evidenceHint: 'यह केवल उपयोगकर्ता द्वारा बताई गई स्थिति है; किस अधिकार को स्वीकार किया जाएगा, यह संस्था तय करती है।'
      },
      custody: {
        label: 'शेयर का रिकॉर्ड कहाँ है',
        question: 'क्या कंपनी/RTA या IEPF ने पुष्टि की है कि शेयर का रिकॉर्ड कहाँ दर्ज है?',
        evidenceHint: 'संबंधित आधिकारिक संस्था से पूछें; यह सूची रिकॉर्ड कहाँ है, इसकी पुष्टि नहीं करती।'
      },
      issuer: {
        label: 'शेयर जारी करने वाली कंपनी या RTA',
        question: 'क्या आपको कंपनी या आधिकारिक RTA का नाम पता है?',
        evidenceHint: 'केवल ऐसा नाम या संक्षिप्त विवरण रखें जिसमें संवेदनशील जानकारी न हो; खाते में प्रवेश की जानकारी न भरें।'
      },
      'heir-evidence': {
        label: 'उत्तराधिकार के प्रमाण',
        question: 'यदि लागू हो, तो क्या आप संस्था से पूछ सकते हैं कि वह अभी उत्तराधिकार के कौन-से प्रमाण स्वीकार करती है?',
        evidenceHint: 'प्रमाण उपलब्ध होने की जानकारी उपयोगकर्ता देता है; यह कोई कानूनी या संस्थागत निर्णय नहीं है।'
      }
    },
    basis: 'स्रोत आधिकारिक गंतव्यों और NSDL के सामान्य मार्गदर्शन का आधार देते हैं; संबंधित संस्था के वर्तमान निर्देशों की जाँच अभी बाकी है।',
    reviewOnChange: 'प्रक्रिया से जुड़ी जानकारी पर कदम उठाने से पहले आधिकारिक पृष्ठ दोबारा जाँचें।',
    limitations: [
      'यह तैयारी किसी शेयर या लाभांश के मौजूद होने की पुष्टि नहीं करती।',
      'रिकॉर्ड कहाँ है और कौन-से प्रमाण स्वीकार होंगे, इसकी पुष्टि संबंधित संस्था से करनी होगी।',
      'स्रोतों की जाँच में IEPF और MCA के पृष्ठों की सामग्री को प्रक्रिया की सत्यापित जानकारी का आधार नहीं माना गया।'
    ]
  },
  'journey-udgam': {
    title: 'दावा न की गई बैंक जमा राशि — UDGAM के लिए तैयारी',
    description: 'RBI की UDGAM खोज स्वयं खोलने और फिर संबंधित बैंक से आगे संपर्क करने की तैयारी में मदद।',
    institution: 'भारतीय रिज़र्व बैंक और संबंधित भागीदार बैंक',
    destination: 'RBI UDGAM का आधिकारिक खोज पोर्टल',
    prompts: {
      'holder-name': {
        label: 'खाताधारक का नाम',
        question: 'क्या आधिकारिक खोज के लिए खाताधारक का नाम आपके पास तैयार है?',
        evidenceHint: 'नाम Reclaim Labs में न भरें।'
      },
      bank: {
        label: 'बैंक',
        question: 'क्या आपको पता है कि किन बैंकों में जाँच करनी है?',
        evidenceHint: 'बैंक से संबंध की पुष्टि आधिकारिक प्रक्रिया से करनी होगी।'
      },
      identifier: {
        label: 'अतिरिक्त पहचान संबंधी जानकारी या पता',
        question: 'क्या माँगे जाने पर आप आधिकारिक पोर्टल पर अतिरिक्त पहचान संबंधी जानकारी या पता दे सकते हैं?',
        evidenceHint: 'यहाँ पहचान संबंधी जानकारी, पता, खाता संख्या या खाते में प्रवेश की जानकारी न भरें।'
      }
    },
    basis: 'RBI के सामान्य प्रश्नों के उत्तर खोज में माँगी जाने वाली जानकारी और दावे के लिए आगे संपर्क का तरीका बताते हैं; पोर्टल आधिकारिक गंतव्य है।',
    reviewOnChange: 'खोज करने के लिए तैयार होने पर पोर्टल की प्रक्रिया दोबारा जाँचें।',
    limitations: [
      'UDGAM की खोज से मिली जानकारी का अर्थ यह नहीं है कि दावा स्वीकृत हो गया है या भुगतान हो गया है।',
      'Reclaim Labs खोज नहीं करता और किसी व्यक्ति के खोज परिणाम प्राप्त नहीं करता।',
      'किसी भी दावे के लिए संबंधित बैंक से संपर्क करना होता है।'
    ]
  },
  'route-rbi-udgam-search': {
    title: 'RBI UDGAM पर खोज का माध्यम',
    description: 'पोर्टल पर माँगी गई जानकारी का उपयोग करके भागीदार बैंकों में खोज के लिए RBI के आधिकारिक UDGAM पोर्टल पर जाएँ।',
    institution: 'भारतीय रिज़र्व बैंक',
    destination: 'RBI UDGAM का आधिकारिक खोज पोर्टल',
    prompts: {
      'holder-name': {
        label: 'खाताधारक का नाम',
        question: 'क्या आधिकारिक UDGAM पोर्टल पर उपयोग के लिए खाताधारक का नाम उपलब्ध है?',
        evidenceHint: 'यह उपयोगकर्ता द्वारा बताई गई तैयारी की जानकारी है; नाम इस सूची में नहीं लिया जाता।'
      },
      bank: {
        label: 'बैंक का नाम',
        question: 'क्या संबंधित बैंक का नाम पता है?',
        evidenceHint: 'आगे का लागू कदम आधिकारिक पोर्टल और बैंक तय करते हैं।'
      },
      identifier: {
        label: 'अतिरिक्त पहचान संबंधी जानकारी या पता',
        question: 'क्या आधिकारिक खोज के लिए अतिरिक्त पहचान संबंधी जानकारी या पता उपलब्ध है?',
        evidenceHint: 'यह जानकारी Reclaim Labs को न दें।'
      }
    },
    basis: 'RBI के अनुसार UDGAM एक खोज सुविधा है और दावे पर आगे की कार्रवाई के लिए संबंधित बैंक से संपर्क करना होता है।',
    reviewOnChange: 'उपयोग से पहले पोर्टल और भागीदार बैंकों से जुड़ी प्रक्रिया दोबारा जाँचें।',
    limitations: [
      'यह सूची UDGAM पर खोज नहीं करती और किसी व्यक्ति का परिणाम नहीं दिखा सकती।',
      'खोज करने से यह तय नहीं होता कि दावा स्वीकार किया जाएगा।',
      'आगे की किसी भी कार्रवाई के लिए संबंधित बैंक से संपर्क करें।'
    ]
  },
  'route-iepf-nsdl-general-guidance': {
    title: 'दावा न किए गए शेयर और लाभांश पर IEPF और NSDL का सामान्य मार्गदर्शन',
    description: 'NSDL का सामान्य निवेशक मार्गदर्शन पढ़ें, फिर IEPF, MCA, कंपनी या उसके आधिकारिक RTA से वर्तमान प्रक्रिया की पुष्टि करें।',
    institution: 'IEPF प्राधिकरण, कॉर्पोरेट कार्य मंत्रालय और नेशनल सिक्योरिटीज़ डिपॉज़िटरी लिमिटेड (NSDL)',
    destination: 'NSDL का सामान्य निवेशक मार्गदर्शन; अगले कदम की पुष्टि IEPF/MCA या संबंधित कंपनी/RTA से करें',
    prompts: {
      'asset-type': {
        label: 'संपत्ति का प्रकार',
        question: 'क्या आपका प्रश्न दावा न किए गए शेयर, भुगतान न किए गए लाभांश या दोनों के बारे में है?',
        evidenceHint: 'यह केवल विषय का सामान्य विवरण है; रिकॉर्ड की पुष्टि संस्था करती है।'
      },
      issuer: {
        label: 'शेयर जारी करने वाली कंपनी या RTA',
        question: 'क्या आपको शेयर से जुड़ी कंपनी या आधिकारिक RTA का नाम पता है?',
        evidenceHint: 'संस्था से पूछते समय ऐसा संक्षिप्त विवरण दें जिसमें संवेदनशील जानकारी न हो।'
      },
      'route-confirmation': {
        label: 'प्रक्रिया की पुष्टि',
        question: 'क्या किसी आधिकारिक संस्था ने बताया है कि अभी कौन-सी प्रक्रिया लागू होती है?',
        evidenceHint: 'इस सूची के मार्गदर्शन को संस्था की पुष्टि न मानें।'
      }
    },
    basis: 'NSDL सामान्य जानकारी प्रकाशित करता है; यह संबंधित संस्था के वर्तमान निर्देशों की जगह नहीं लेती।',
    reviewOnChange: 'संबंधित संस्था से वर्तमान निर्देशों और आवश्यक दस्तावेज़ों की पुष्टि करें।',
    limitations: [
      'यह सामान्य मार्गदर्शन है, किसी व्यक्ति के शेयर के बारे में निष्कर्ष नहीं।',
      'स्रोतों की जाँच के दौरान IEPF और MCA के वर्तमान पृष्ठों तक पहुँच अवरुद्ध थी।',
      'लागू प्रक्रिया और प्रमाणों की पुष्टि कंपनी या RTA को करनी होगी।'
    ]
  }
};

/**
 * Return Hindi display fields for the four published catalogue records.
 * English, unsupported languages, and research-only records retain the original
 * record. This helper does not change publication status or select records.
 */
export function displayOpportunity(record, language = 'en') {
  if (language !== 'hi' || !record || record.publicationStatus !== 'published') return record;
  const copy = Object.hasOwn(HINDI_COPY, record.id) ? HINDI_COPY[record.id] : null;
  if (!copy) return record;

  return {
    ...record,
    title: copy.title,
    description: copy.description,
    institution: copy.institution,
    destination: copy.destination,
    eligibilityEvidencePrompts: record.eligibilityEvidencePrompts.map((item) => ({
      ...item,
      ...(Object.hasOwn(copy.prompts, item.id) ? copy.prompts[item.id] : {})
    })),
    provenance: { ...record.provenance, basis: copy.basis },
    freshness: { ...record.freshness, reviewOnChange: copy.reviewOnChange },
    limitations: [...copy.limitations]
  };
}
