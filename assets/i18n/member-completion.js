/* BetInsight member i18n completion layer · 2026-09-09
   Presentation-only translation adapter for customer-facing pages.
   It translates visible legacy/hard-coded copy without changing tokens, URLs,
   form values, API requests, Units, payments, Make calls or business logic.
   Existing data-bi-i18n translations remain primary; this layer only completes gaps.
*/
(() => {
  "use strict";

  if (window.BetInsightMemberCompletion) return;

  const SCRIPT_URL = document.currentScript?.src || new URL("assets/i18n/member-completion.js", location.href).toString();
  const I18N_ROOT = new URL("./", SCRIPT_URL);
  const sourceText = new WeakMap();
  const renderedText = new WeakMap();
  const sourceAttrs = new WeakMap();
  const renderedAttrs = new WeakMap();
  const jsonCache = new Map();
  let exact = new Map();
  let templates = [];
  let applying = false;
  let observer = null;

  const PAGE_SCOPE = Object.freeze({
    daily:"daily",
    "fan-challenge":"fan-challenge",
    tipps:"tips",
    pakete:"packages",
    kaufen:"buy",
    angebote:"offers",
    verkaufen:"sell",
    "meine-verkaufsangebote":"my-sale-offers",
    anbieter:"providers",
    "marketing-center":"marketing-center",
    support:"support"
  });

  const EXTRAS = Object.freeze({
    "free-units": {
      "Belohnungen, Fan-Wissen und kostenlose Community-Challenges":"Rewards, fan knowledge and free community challenges",
      "KOSTENLOS":"FREE",
      "Dein Sportwissen zählt.":"Your sports knowledge counts.",
      "Gib langfristige Saison-Prognosen ab, sammle Fan-Punkte und steige in der BetInsight Fan-Rangliste auf. Je früher du dich festlegst, desto wertvoller kann ein richtiger Tipp sein.":"Submit long-term season predictions, collect fan points and climb the BetInsight Fan Leaderboard. The earlier you make your prediction, the more valuable a correct pick can be.",
      "Free Units im Saisonpool":"Free Units in the season pool",
      "erhalten 30 Tage Premium":"receive 30 days Premium",
      "erhält Premium Plus":"receives Premium Plus",
      "Dein bestehender Daily Claim bleibt unverändert. Hier gelangst du direkt zur bekannten täglichen Free-Unit-Funktion.":"Your existing Daily Claim remains unchanged. This takes you directly to the familiar daily Free Unit feature.",
      "Daily Bonus öffnen":"Open Daily Bonus",
      "🏆 BetInsight Fan-Rangliste":"🏆 BetInsight Fan Leaderboard",
      "Kostenlose Saison-Challenges. Ein Tipp pro Frage – nach der Abgabe verbindlich.":"Free season challenges. One prediction per question – binding once submitted.",
      "500 Units Pool":"500 Units pool",
      "Premium für Top 10":"Premium for Top 10",
      "Fan-Challenge wird geladen …":"Loading Fan Challenge …",
      "Punktefaktor wird geladen …":"Loading points factor …",
      "Aktuelle Rangliste":"Current leaderboard",
      "Bei Punktgleichheit entscheidet die frühere erfolgreiche Teilnahme.":"If points are tied, the earlier successful participation ranks higher.",
      "Noch keine gewerteten Fan-Tipps.":"No evaluated fan predictions yet.",
      "🆓 Kostenlos":"🆓 Free",
      "Für die Teilnahme werden keine Units abgezogen.":"No Units are deducted for participation.",
      "⏱ Früher = wertvoller":"⏱ Earlier = more valuable",
      "Der Punktefaktor sinkt im Laufe der Saison.":"The points factor decreases as the season progresses.",
      "🔒 Verbindlich":"🔒 Binding",
      "Pro Frage gilt eine abgegebene Auswahl. Kein Wechsel nach der Abgabe.":"One submitted selection applies per question. It cannot be changed after submission.",
      "Gewonnene Pool-Units sind Bonus-/Geschenk-Units und nicht in der Wechselstube verkaufbar.":"Pool Units won are Bonus/Gift Units and cannot be sold in the Unit Exchange.",
      "Die Fan-Challenge ist ein kostenloses Community-Spiel ohne Einsatz und ohne Kaufpflicht. Ergebnisse werden nach dem offiziell feststehenden Wettbewerbsergebnis ausgewertet. Die Prämien der Top 10 werden nach Abschluss der Saison gemäß der veröffentlichten Rangliste vorgemerkt.":"The Fan Challenge is a free community game with no stake and no purchase requirement. Results are evaluated once the official competition result is final. Top 10 prizes are reserved after the season according to the published leaderboard.",
      "← Zurück zum Profil":"← Back to Profile"
    },
    ressourcen: {
      "← Zum Dashboard":"← Back to Dashboard",
      "Wissen · Vorlagen · Downloads":"Knowledge · Templates · Downloads",
      "Alles zum Lernen und Weitergeben an einem klaren Ort. Die Academy erklärt BetInsight Schritt für Schritt. Unter Werbematerial & Downloads findest du freigegebene Präsentationen, Bilder und weitere Materialien.":"Everything for learning and sharing in one clear place. The Academy explains BetInsight step by step. Marketing Material & Downloads contains approved presentations, images and additional resources.",
      "BetInsight Academy":"BetInsight Academy",
      "Verstehe die wichtigsten Funktionen in deinem Tempo – mit Schritt-für-Schritt-Anleitungen, PDF-Guides und passenden Videos.":"Understand the most important features at your own pace with step-by-step guides, PDFs and matching videos.",
      "Einfacher Einstieg für neue Mitglieder":"Easy start for new members",
      "Anleitungen direkt ansehen oder speichern":"View or save guides directly",
      "Neue Academy-Inhalte zentral an einer Stelle":"New Academy content in one central place",
      "Academy öffnen":"Open Academy",
      "Werbematerial & Downloads":"Marketing Material & Downloads",
      "Freigegebene BetInsight-Materialien für Präsentation, Social Media, Empfehlungen und Partnerkommunikation.":"Approved BetInsight materials for presentations, social media, referrals and partner communication.",
      "Geschäftspräsentation und PDF-Downloads":"Business presentation and PDF downloads",
      "Bilder, Grafiken und Social-Media-Motive":"Images, graphics and social media assets",
      "Videos und weitere Partnerressourcen":"Videos and additional partner resources",
      "Downloads öffnen":"Open Downloads"
    },
    academy: {
      "← Academy & Ressourcen":"← Academy & Resources",
      "Lerne BetInsight Schritt für Schritt kennen.":"Learn BetInsight step by step.",
      "Kurze Anleitungen, verständliche PDFs und passende Videos helfen dir beim Einstieg. Neue Academy-Dokumente werden automatisch ergänzt.":"Short guides, clear PDFs and matching videos help you get started. New Academy documents are added automatically.",
      "Academy-Inhalte":"Academy Content",
      "Starte mit der Registrierung und öffne die Anleitung so, wie es für dich am besten passt: direkt als PDF, als Download oder – wenn vorhanden – als Video.":"Start with registration and open each guide in the way that suits you best: as a PDF, a download or, when available, a video.",
      "Lädt …":"Loading …",
      "Academy-Inhalte werden geladen …":"Loading Academy content …",
      "Die Academy-Inhalte konnten gerade nicht automatisch geladen werden. Bitte die Seite später erneut öffnen.":"Academy content could not be loaded automatically right now. Please open the page again later.",
      "Noch keine Academy-PDF vorhanden.":"No Academy PDF is available yet.",
      "📘 Verständlich aufgebaut":"📘 Easy to understand",
      "Die Academy ist als Lernbereich gedacht – nicht als Vertriebsmaterial. Inhalte erklären Funktionen und Abläufe in klaren Schritten.":"The Academy is designed as a learning area, not sales material. Content explains features and processes in clear steps.",
      "🔄 Automatisch erweiterbar":"🔄 Automatically expandable",
      "Weitere freigegebene PDF-Anleitungen erscheinen künftig automatisch auf dieser Seite.":"Additional approved PDF guides will appear automatically on this page.",
      "📥 Direkt verfügbar":"📥 Directly available",
      "PDFs können direkt angesehen oder gespeichert werden. So hast du die Anleitung jederzeit griffbereit.":"PDFs can be viewed or saved directly so your guides are always at hand.",
      "Registrierung bei BetInsight – Schritt für Schritt":"Registering with BetInsight – Step by Step",
      "Die vorhandene BetInsight-Anleitung führt Schritt für Schritt durch die Registrierung.":"The existing BetInsight guide walks you through registration step by step.",
      "Freigegebene BetInsight Academy-Anleitung.":"Approved BetInsight Academy guide.",
      "▶ Video ansehen":"▶ Watch Video",
      "PDF ansehen":"View PDF",
      "PDF herunterladen":"Download PDF",
      "Nicht erreichbar":"Unavailable"
    },
    werbematerial: {
      "← Academy & Ressourcen":"← Academy & Resources",
      "Freigegebene Partnerressourcen":"Approved Partner Resources",
      "Hier findest du freigegebene BetInsight-Materialien übersichtlich an einem Ort: Präsentationen, Social-Media-Motive, Videos, Werbetexte und weitere Partnerressourcen.":"Find approved BetInsight materials clearly organized in one place: presentations, social media assets, videos, promotional texts and additional partner resources.",
      "📄 Geschäftspräsentation":"📄 Business Presentation",
      "Offizielle PDF direkt öffnen oder speichern.":"Open or save the official PDF directly.",
      "📱 Bilder & Grafiken":"📱 Images & Graphics",
      "Freigegebene Motive nach Format sortiert ansehen.":"View approved assets sorted by format.",
      "🎬 Videos & Reels":"🎬 Videos & Reels",
      "Freigegebene Werbevideos für Social Media.":"Approved promotional videos for social media.",
      "✍️ Texte & Vorlagen":"✍️ Texts & Templates",
      "Freigegebene Werbetexte direkt mit einem Klick kopieren.":"Copy approved promotional texts with one click.",
      "Geschäftspräsentation":"Business Presentation",
      "Die offizielle BetInsight-Geschäftspräsentation zum direkten Ansehen oder Herunterladen.":"The official BetInsight business presentation to view or download directly.",
      "PDF verfügbar":"PDF available",
      "BetInsight Geschäftspräsentation":"BetInsight Business Presentation",
      "Offizielle Präsentation zum Ansehen oder Herunterladen.":"Official presentation to view or download.",
      "PDF ansehen":"View PDF",
      "PDF herunterladen":"Download PDF",
      "Bilder & Grafiken":"Images & Graphics",
      "Alle freigegebenen Motive sind übersichtlich nach Hochformat, Quadrat und Querformat sortiert. Der Download bleibt immer die Originaldatei.":"All approved assets are clearly sorted by portrait, square and landscape format. Downloads always use the original file.",
      "Werbematerial wird geladen …":"Loading marketing material …",
      "Bilder konnten gerade nicht geladen werden.":"Images could not be loaded right now.",
      "Noch keine Bilder vorhanden.":"No images are available yet.",
      "Hochformat":"Portrait",
      "Quadrat":"Square",
      "Querformat":"Landscape",
      "Videos & Reels":"Videos & Reels",
      "Texte & Vorlagen":"Texts & Templates",
      "Text kopieren":"Copy Text",
      "Kopiert ✓":"Copied ✓",
      "Bitte nur freigegebenes BetInsight-Material verwenden.":"Please use approved BetInsight material only."
    },
    wallet: {
      "Wechselstube":"Unit Exchange",
      "Auszahlungsmethoden":"Payout Methods",
      "Hinterlege die Zahlungsarten, über die Käufer deine Verkaufsangebote bezahlen dürfen. Du kannst Krypto, Banküberweisung oder später beim Einstellen eines Angebots beide anbieten.":"Store the payment methods buyers may use for your sale offers. You can allow crypto, bank transfer or both when creating an offer.",
      "🪙 Krypto":"🪙 Crypto",
      "Direkte Zahlung an deine persönliche Wallet.":"Direct payment to your personal wallet.",
      "Wird geprüft":"Checking",
      "Gespeicherte Krypto-Wallet":"Saved Crypto Wallet",
      "Gespeichert":"Saved",
      "Coin":"Coin",
      "Netzwerk":"Network",
      "Empfangsadresse":"Receiving Address",
      "Kryptowährung und Netzwerk":"Cryptocurrency and Network",
      "Bitte auswählen":"Please select",
      "Wähle zuerst Kryptowährung und Netzwerk aus.":"Select a cryptocurrency and network first.",
      "Öffentliche Empfangsadresse":"Public Receiving Address",
      "Wallet-Adresse vollständig eintragen":"Enter the full wallet address",
      "Ich bestätige, dass dies meine eigene öffentliche Empfangsadresse ist.":"I confirm that this is my own public receiving address.",
      "Ich habe Coin, Netzwerk und vollständige Adresse kontrolliert.":"I have checked the coin, network and full address.",
      "Krypto-Wallet speichern":"Save Crypto Wallet",
      "🏦 Banküberweisung":"🏦 Bank Transfer",
      "Direkte Überweisung vom Käufer auf dein Konto.":"Direct transfer from the buyer to your bank account.",
      "Noch nicht gespeichert":"Not saved yet",
      "Gespeicherte Bankverbindung":"Saved Bank Details",
      "Bereit":"Ready",
      "Kontoinhaber":"Account Holder",
      "IBAN":"IBAN",
      "BIC":"BIC",
      "Land":"Country",
      "Vor- und Nachname":"First and last name",
      "Die vollständige IBAN wird erst einem Käufer gezeigt, nachdem er dein Angebot reserviert hat.":"The full IBAN is shown to a buyer only after your offer has been reserved.",
      "Land (optional)":"Country (optional)",
      "Ich bestätige, dass diese Bankverbindung von mir für den Empfang meiner Verkäufe verwendet werden darf.":"I confirm that these bank details may be used to receive payments for my sales.",
      "Bankverbindung speichern":"Save Bank Details",
      "Wichtig:":"Important:",
      "BetInsight nimmt die Zahlung nicht für den Verkäufer entgegen. Bei Banküberweisung bestätigt der Verkäufer später den tatsächlichen Geldeingang. Erst danach dürfen die reservierten Units an den Käufer übertragen werden.":"BetInsight does not receive payment on behalf of the seller. For bank transfers, the seller later confirms the actual receipt of funds. Only then may the reserved Units be transferred to the buyer."
    },
    verkaufen: {
      "Unit-Wechselstube":"Unit Exchange",
      "Units verkaufen":"Sell Units",
      "Stelle vorhandene Units zum Verkauf ein und entscheide, ob Käufer per Krypto, Banküberweisung oder über beide Wege zahlen dürfen.":"List available Units for sale and choose whether buyers may pay by crypto, bank transfer or both.",
      "Verkaufbare Units gesamt":"Total Sellable Units",
      "Verdiente Units":"Earned Units",
      "Gekaufte Units":"Purchased Units",
      "Neues Verkaufsangebot":"New Sale Offer",
      "Es können nur Units angeboten werden, die dein Account tatsächlich besitzt.":"Only Units actually owned by your account can be offered.",
      "Wird geprüft":"Checking",
      "Verkaufsmenge":"Sale Amount",
      "Zahlungsarten":"Payment Methods",
      "Krypto":"Crypto",
      "Banküberweisung":"Bank Transfer",
      "Preis pro Unit":"Price per Unit",
      "Gesamtpreis":"Total Price",
      "Verkaufsangebot erstellen":"Create Sale Offer",
      "Meine Verkaufsangebote":"My Sale Offers",
      "Aktive und reservierte Angebote":"Active and reserved offers",
      "Aktiv im Verkauf":"Active for Sale",
      "Für Käufer reserviert":"Reserved for Buyer",
      "Bearbeiten":"Edit",
      "Stornieren":"Cancel",
      "Geldeingang bestätigen":"Confirm Funds Received"
    },
    "meine-verkaufsangebote": {
      "Hier siehst du deine aktiven oder bereits für einen Käufer reservierten Verkaufsangebote. Aktive Angebote kannst du im Preis bearbeiten oder stornieren.":"Here you can see your active sale offers and offers already reserved for a buyer. Active offers can be edited or cancelled.",
      "Aktuell im Verkauf":"Currently for Sale",
      "Aktive und momentan reservierte Angebote.":"Active offers and offers currently reserved.",
      "Lade …":"Loading …",
      "Deine Verkaufsangebote werden geladen.":"Loading your sale offers.",
      "Preis pro Unit":"Price per Unit",
      "Gesamtpreis":"Total Price",
      "Für Käufer reserviert":"Reserved for Buyer",
      "Aktiv im Verkauf":"Active for Sale",
      "Bearbeiten":"Edit",
      "Stornieren":"Cancel",
      "🏦 Bankkauf reserviert":"🏦 Bank Purchase Reserved",
      "Bankstatus wird geprüft …":"Checking bank status …",
      "💶 Käufer hat die Zahlung als gesendet gemeldet":"💶 Buyer reported the payment as sent",
      "Bitte prüfe dein echtes Bankkonto.":"Please check your actual bank account.",
      "Geldeingang bestätigen":"Confirm Funds Received",
      "Dieses Angebot ist bereits für einen Käufer reserviert und kann deshalb momentan weder bearbeitet noch storniert werden.":"This offer is already reserved for a buyer and therefore cannot currently be edited or cancelled.",
      "Neues Verkaufsangebot erstellen":"Create a New Sale Offer"
    },
    konto: {
      "BetInsight Dashboard":"BetInsight Dashboard",
      "Wenn dein persönlicher Zugang auf diesem Gerät bereits gespeichert ist, öffnet sich dein Dashboard direkt.":"If your personal access is already saved on this device, your dashboard opens directly.",
      "Dashboard öffnen":"Open Dashboard"
    },
    "premium-upgrade": {
      "Premium Upgrade":"Premium Upgrade",
      "Du möchtest ein Upgrade machen auf:":"You would like to upgrade to:",
      "Wähle zuerst deinen gewünschten Tarif. Danach fragen wir nur die Angaben ab, die wir für deine persönliche Anbieter- und Quotenanzeige benötigen.":"First choose your preferred plan. We will then ask only for the information needed for your personal provider and odds display.",
      "Dein BetInsight-Konto":"Your BetInsight Account",
      "automatisch aus deinem eingeloggten Zugang":"automatically from your signed-in access",
      "Registrierte E-Mail":"Registered Email",
      "E-Mail wird geladen …":"Loading email …",
      "Tarif auswählen":"Select Plan",
      "Gewünschter Tarif":"Preferred Plan",
      "Bitte auswählen":"Please select",
      "Land angeben":"Enter Country",
      "Die konkrete Anbieterzuordnung erfolgt später passend zu deinem Land.":"The specific provider assignment will be made later based on your country.",
      "Dein Land":"Your Country",
      "Bitte Land auswählen":"Please select a country",
      "Anbieterarten auswählen":"Select Provider Types",
      "Deine Auswahl":"Your Selection",
      "Angaben speichern & weiter zur Zahlung":"Save Details & Continue to Payment",
      "Zurück":"Back",
      "Kein eingeloggter BetInsight-Zugang erkannt. Bitte öffne diese Seite über dein Backoffice.":"No signed-in BetInsight access detected. Please open this page from your back office."
    }
  });

  function lang() {
    return String(window.BetInsightI18n?.getLanguage?.() || document.documentElement.lang || localStorage.getItem("betinsight_language") || "de").toLowerCase().split("-")[0];
  }

  function pageId() {
    const parts = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (!parts.length) return "dashboard";
    if (parts[0] === "profil") parts.shift();
    if (!parts.length) return "dashboard";
    if (parts[0] === "wechselboerse" && parts[1] === "angebote") return "angebote";
    return parts[0].toLowerCase();
  }

  async function loadJson(url) {
    const key = String(url);
    if (jsonCache.has(key)) return jsonCache.get(key);
    try {
      const response = await fetch(url, {cache:"no-store", credentials:"same-origin"});
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      jsonCache.set(key, data || {});
      return data || {};
    } catch (_) {
      jsonCache.set(key, {});
      return {};
    }
  }

  function flatten(obj, out = {}, prefix = "") {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
    Object.entries(obj).forEach(([key,value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) flatten(value,out,path);
      else if (typeof value === "string") out[path] = value;
    });
    return out;
  }

  function pairLocales(de, en, map) {
    const deFlat = flatten(de), enFlat = flatten(en);
    Object.entries(deFlat).forEach(([key,source]) => {
      const target = enFlat[key];
      if (source && typeof target === "string" && source !== target) map.set(source,target);
    });
  }

  function makeTemplate(source,target) {
    if (!source.includes("{{")) return null;
    const names=[];
    const escaped=source.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\\\{\\\{\s*([\w.-]+)\s*\\\}\\\}/g,(_,name)=>{names.push(name);return "(.+?)";});
    if (!names.length) return null;
    return {regex:new RegExp(`^${escaped}$`),names,target};
  }

  async function buildDictionary(language = lang()) {
    const map = new Map();
    if (language !== "en") { exact = map; templates = []; return; }

    const sharedDe = await loadJson(new URL("./locales/de.json", I18N_ROOT));
    const sharedEn = await loadJson(new URL("./locales/en.json", I18N_ROOT));
    pairLocales(sharedDe,sharedEn,map);

    const id=pageId();
    const scope=PAGE_SCOPE[id] || document.querySelector('meta[name="bi-i18n-scope"]')?.content || "";
    if (scope) {
      const de = await loadJson(new URL(`./pages/${encodeURIComponent(scope)}/de.json`, I18N_ROOT));
      const en = await loadJson(new URL(`./pages/${encodeURIComponent(scope)}/en.json`, I18N_ROOT));
      pairLocales(de,en,map);
    }

    Object.entries(EXTRAS[id] || {}).forEach(([source,target]) => map.set(source,target));
    exact = map;
    templates = [...map.entries()].map(([source,target])=>makeTemplate(source,target)).filter(Boolean);
  }

  function preserveWhitespace(original, translated) {
    const leading=original.match(/^\s*/)?.[0] || "";
    const trailing=original.match(/\s*$/)?.[0] || "";
    return leading + translated + trailing;
  }

  function translate(value) {
    const original=String(value ?? "");
    const trimmed=original.trim();
    if (!trimmed) return original;
    if (exact.has(trimmed)) return preserveWhitespace(original,exact.get(trimmed));
    for (const item of templates) {
      const match=trimmed.match(item.regex);
      if (!match) continue;
      let result=item.target;
      item.names.forEach((name,index)=>{result=result.replace(new RegExp(`\\{\\{\\s*${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\s*\\}\\}`,"g"),match[index+1]);});
      return preserveWhitespace(original,result);
    }
    return original;
  }

  function ignoredText(node) {
    const parent=node?.parentElement;
    if (!parent) return true;
    return Boolean(parent.closest("script,style,noscript,code,pre,textarea,[data-bi-i18n-ignore]"));
  }

  function processText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || ignoredText(node)) return;
    const current=String(node.nodeValue ?? "");
    const last=renderedText.get(node);
    if (!sourceText.has(node) || current !== last) sourceText.set(node,current);
    const source=sourceText.get(node) ?? current;
    const next=translate(source);
    renderedText.set(node,next);
    if (current !== next) node.nodeValue=next;
  }

  function processAttr(el,attr) {
    if (!el?.hasAttribute?.(attr)) return;
    let sourceMap=sourceAttrs.get(el); if (!sourceMap) {sourceMap={};sourceAttrs.set(el,sourceMap);}
    let renderedMap=renderedAttrs.get(el); if (!renderedMap) {renderedMap={};renderedAttrs.set(el,renderedMap);}
    const current=String(el.getAttribute(attr) ?? "");
    if (!(attr in sourceMap) || current !== renderedMap[attr]) sourceMap[attr]=current;
    const next=translate(sourceMap[attr]);
    renderedMap[attr]=next;
    if (current !== next) el.setAttribute(attr,next);
  }

  function processElement(el) {
    if (!(el instanceof Element) || el.closest("script,style,noscript,code,pre,[data-bi-i18n-ignore]")) return;
    ["placeholder","title","aria-label"].forEach(attr=>processAttr(el,attr));
  }

  function walk(root=document.body) {
    if (!root) return;
    applying=true;
    try {
      if (root.nodeType === Node.TEXT_NODE) processText(root);
      else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
        if (root.nodeType === Node.ELEMENT_NODE) processElement(root);
        root.querySelectorAll?.("*").forEach(processElement);
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) processText(walker.currentNode);
      }
    } finally { applying=false; }
  }

  function startObserver() {
    if (observer || typeof MutationObserver !== "function") return;
    observer=new MutationObserver(records=>{
      if (applying) return;
      for (const record of records) {
        if (record.type === "characterData") processText(record.target);
        else if (record.type === "attributes") processAttr(record.target,record.attributeName);
        else record.addedNodes.forEach(node=>{
          if (node.nodeType === Node.TEXT_NODE) processText(node);
          else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
        });
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
  }

  async function applyLanguage(language=lang()) {
    await buildDictionary(language);
    walk(document.body);
  }

  async function boot() {
    if (!document.body) return;
    await applyLanguage();
    startObserver();
    window.addEventListener("bi:languagechange",event=>applyLanguage(event?.detail?.language || lang()));
  }

  window.BetInsightMemberCompletion=Object.freeze({applyLanguage,pageId});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
