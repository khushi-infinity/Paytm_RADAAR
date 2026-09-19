/**
 * Hindi translations of the intelligence spine's card copy.
 * The engine emits English sentences built from real numbers; this module
 * mirrors each template in Hindi using the same numbers, so nothing is
 * lost and nothing is invented.
 */

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function cardSignalHi(id: string, targetSize: number, deltaPct: number): string {
  const pct = Math.abs(Math.round(deltaPct));
  switch (id) {
    case "opp_weekday_evening":
      return `शाम की बिक्री आपके अपने औसत से ${pct}% कम है`;
    case "opp_reactivate":
      return `${targetSize} ग्राहक दूर चले गए हैं`;
    case "opp_retention":
      return `${targetSize} नियमित ग्राहक 2+ हफ़्तों से नहीं आए`;
    case "opp_upsell":
      return `पक्के ग्राहक आते हैं, पर उतना खर्च नहीं करते`;
    case "opp_festive_bundling":
      return `त्योहारों में बिक्री बढ़ाने का मौका है`;
    default:
      return "व्यापार में एक मौका दिखा है";
  }
}

export function cardWhyHi(
  id: string,
  targetSize: number,
  eveningPct: number,
  avgTicket: number,
): string {
  switch (id) {
    case "opp_reactivate":
      return `ये ग्राहक औसतन ${inr(avgTicket)} प्रति विज़िट खर्च करते थे। ${targetSize} लोगों को एक ऑफ़र भेजने से, उनके अपने पुराने रिकॉर्ड के हिसाब से, लगभग 6-12% वापस आ सकते हैं। यह आपके अपने डेटा पर आधारित अनुमान है।`;
    case "opp_weekday_evening":
      return `आपके शाम 5-8 बजे के ${targetSize} नियमित ग्राहक हफ़्ते के दिनों में कम आ रहे हैं, शाम की बिक्री आपके अपने पुराने औसत से ${Math.abs(Math.round(eveningPct))}% नीचे है। शाम का ऑफ़र इसी स्लॉट को ठीक करेगा।`;
    case "opp_retention":
      return `ये ग्राहक हर हफ़्ते आते थे। पुराने ग्राहक को लौटाना नए ग्राहक जोड़ने से कहीं सस्ता होता है, अभी एक पर्सनल संदेश भेज दें, तो छटनी रुक सकती है।`;
    case "opp_upsell":
      return `आपके नियमित ग्राहक औसतन ${inr(avgTicket)} खर्च करते हैं। उसी का ~30% जोड़ने वाला कॉम्बो बास्केट साइज़ बढ़ाएगा, बिना नए ग्राहक की तलाश के।`;
    case "opp_festive_bundling":
      return `त्योहारों में आपकी बिक्री बढ़ती है। दो चीज़ों का कॉम्बो पैक अभी तैयार रखें, त्योहारों पर ग्राहक ज़्यादा खर्च करते हैं।`;
    default:
      return "यह आपके अपने डेटा से मिला एक मौका है।";
  }
}

export function cardActionHi(id: string): string {
  switch (id) {
    case "opp_reactivate":
      return "₹50 छूट का वापसी संदेश WhatsApp पर भेजें";
    case "opp_weekday_evening":
      return "शाम 5-8 बजे का ऑफ़र बनाएँ (₹200 से ऊपर ₹30 छूट)";
    case "opp_retention":
      return "₹20 छूट के साथ 'फिर आइए' संदेश भेजें";
    case "opp_upsell":
      return "काउंटर QR पर कॉम्बो ऑफ़र दिखाएँ";
    case "opp_festive_bundling":
      return "त्योहारों के लिए कॉम्बो पैक तैयार करें";
    default:
      return "ऑफ़र बनाएँ";
  }
}
