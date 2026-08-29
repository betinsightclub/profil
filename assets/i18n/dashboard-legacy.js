/* BetInsight legacy dashboard adapter · feature/i18n-multilang-safe-v3
   Purpose:
   - translate the existing customer dashboard without changing its business logic
   - keep German as the fallback source language
   - translate static and dynamically generated customer-facing copy to English
   - override legacy customer routing so profile/dashboard access values are never generated into internal browser URLs
   Admin, Admin-Tipps and Master-Backoffice are intentionally outside this adapter. */
(() => {
  "use strict";

  const session = () => window.BetInsightSession;
  const i18n = () => window.BetInsightI18n;
  const t = (key, vars = {}, fallback = "") => i18n()?.t(`dashboardPage.${key}`, vars, fallback) || fallback;
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let applying = false;

  const EXACT = new Map([
    ["Mein BetInsight Profil","profileHeading"],["Kontostand, Tipps, Empfehlungen und persönlicher Profilzugang","profileLead"],["Gesamte verfügbare Units","totalAvailable"],
    ["Persönlicher Profilzugang","personalAccess"],["Deine persönlichen Daten und dein sicher gespeicherter Zugang.","personalAccessCopy"],["◉ Schützen","protect"],["◉ Geschützt","protected"],
    ["BetInsight-ID","id"],["📋 ID kopieren","copyId"],["E-Mail","email"],["Status","status"],["Profilzugang aktiv","accessActive"],["Persönlicher Zugang","personalCode"],["✅ Auf diesem Gerät gespeichert","savedDevice"],["Wird geladen...","loading"],["Lade...","loading"],
    ["Der vollständige Zugangscode wird nicht angezeigt und kann hier nicht kopiert werden.","codeHidden"],["📩 Profil-Link erneut per E-Mail senden","resend"],["Die Privatsphäre blendet nur E-Mail-Adresse und persönlichen Zugang aus. BetInsight-ID, Units und Netzwerkzahlen bleiben sichtbar.","privacyNote"],["Kontostand wird geladen...","balanceLoading"],
    ["Kontostand & Aktivitäten","balanceActivities"],["Deine wichtigsten Kontowerte auf einen Blick.","balanceCopy"],["Verfügbare Units","availableUnits"],["Referral verfügbar","referralAvailable"],["Freigeschaltete Tipps","unlockedTips"],["Verbrauchte Units","usedUnits"],
    ["Mitgliedschaft","membership"],["Basis","basis"],["BetInsight Basis-Zugang","basisAccess"],["⭐ Auf Premium upgraden","upgradePremium"],["✨ Auf Premium Plus upgraden","upgradePlus"],["Gültig bis: –","validUntil"],["🔔 Telegram verbinden","telegramConnect"],["🔄 Abo & Verlängerung","subscription"],
    ["🔄 Aktualisieren","refresh"],["🔥 Neue Tipps","newTips"],["✅ Freigeschaltet","unlocked"],["💎 Units kaufen","buyUnits"],["🛟 Support & Tickets","support"],["Zugangscode nur löschen, wenn die angezeigte E-Mail nicht stimmt oder dieses Gerät mit einer anderen Person geteilt wird.","securityWarning"],["Zugangscode auf diesem Gerät löschen","deleteAccess"],
    ["Persönliche Übersicht","personalOverview"],["Dein Netzwerk, deine Referral-Units und deine persönlichen Empfehlungslinks.","overviewCopy"],["👥 Netzwerk","network"],["🔄 Netzwerk laden","loadNetwork"],["◎ Ref-Units insgesamt","refTotal"],["Gesamtes Netzwerk · Ebenen 1–3","wholeNetwork"],["◷ Davon noch nicht freigegeben","pending"],
    ["Direkter Registrierungslink","directRegistration"],["Registrierungslink wird geladen...","registrationLoading"],["📋 Registrierungslink kopieren","copyRegistration"],["Persönlicher Landingpage-Link","landingLink"],["Landingpage-Link wird geladen...","landingLoading"],["📋 Landingpage-Link kopieren","copyLanding"],
    ["Struktur und Umsätze","structure"],["Deine Netzwerkstruktur und Unit-Entwicklung übersichtlich nach Ebenen.","structureCopy"],["Ebene antippen für Details","tapDetails"],["Units aufs Konto buchen","transferUnits"],["Zur Unit-Wechselstube","exchange"],["Netzwerkdaten laden","reloadNetwork"],["Marketing-Center","marketing"],["Netzwerkdaten werden erst geladen, wenn du auf „Netzwerk laden“ klickst.","networkLazy"],
    ["Persönliches Profil öffnen","openProfile"],["Fordere deinen Profil-Link per E-Mail an oder trage einen bereits erhaltenen Link direkt ein.","openProfileCopy"],["Profil-Link anfordern","requestLink"],["Registrierte E-Mail-Adresse eintragen.","registeredEmail"],["📩 Profil-Link anfordern","requestButton"],["🔎 Registrierte E-Mail nachsehen","checkEmail"],["Profil-Link eintragen","enterLink"],["Link oder Zugangscode aus deiner E-Mail verwenden.","enterLinkCopy"],["🔓 Persönliches Profil öffnen","openPersonal"],
    ["BetInsight Mitgliedschaft","membershipEyebrow"],["Mitgliedschaften vergleichen","membershipCompare"],["Basis, Premium und Premium Plus auf einen Blick. Dein aktueller Tarif ist markiert.","membershipCompareCopy"],["Premium-Vorteile","premiumBenefits"],["Premium wählen","choosePremium"],["Hier siehst du nur die zusätzlichen Leistungen.","extraBenefitsOnly"],
    ["Basis · Standardzugang","basisStandard"],["Alles für den Einstieg","basisStart"],["Zugang zum BetInsight Unit- und Tipp-System","basisSystem"],["Laufende Unit-Provisionen bis zur 3. Ebene aus dem bestehenden Referral-System","basisCommission"],["Persönliche Empfehlungslinks und Netzwerkübersicht","basisReferral"],["Freigeschaltete Tipps und Unit-Verwaltung im eigenen Profil","basisUnlocked"],["Keine monatliche Premium-Laufzeit erforderlich","basisNoMonthly"],
    ["Premium · 13,49 € / 30 Tage","premiumKicker"],["2 Anbieter + Live-Alarme","premiumTitle"],["Premium Plus · 19,99 € / 30 Tage","plusKicker"],["5 Anbieter + Live-Alarme","plusTitle"],["Alle Basis-Leistungen inklusive","includedBasis"],["Alle Premium-Leistungen inklusive","includedPremium"],
    ["30 Tage Laufzeit je Aktivierung oder Verlängerung","thirtyDays"],["Direkte Anbieterlinks gibt es erst mit Premium Plus","linksPlusOnly"],["Quotenvergleich für bis zu 5 Anbieter","fiveProviders"],["Freigegebene direkte Anbieter-/Affiliate-Links","directAffiliateLinks"],
    ["Abo & Verlängerung","premiumManager"],["Deine Premium-Mitgliedschaft verwalten.","premiumManageCopy"],["Mit Provisionsguthaben verlängern","commissionCredit"],["Nur bereits auszahlbares Guthaben wird später verwendet.","commissionCreditCopy"],["Nur bereits auszahlbares Provisionsguthaben kann für eine Verlängerung verwendet werden.","commissionCreditFullCopy"],["Guthaben verwenden","useCredit"],["Extern verlängern","externalRenew"],["Normale Premium-Zahlung über den vorgesehenen Zahlungsweg.","externalRenewCopy"],["Jetzt verlängern","renewNow"],["Automatische Verlängerung","autoRenew"],["Status: nicht aktiviert","autoInactive"],["Einstellung ändern","changeSetting"],["Zu Premium Plus wechseln","switchPlus"],["Bis zu 5 Anbieter im Quotenvergleich und zusätzliche Premium-Provisionen bis zur 8. Ebene.","switchPlusCopy"],["Premium Plus ansehen","viewPlus"],["Die Oberfläche ist vorbereitet. Die Zahlungs- und Guthabenlogik wird erst nach Freigabe des Premium-v1.2-Backends verbunden.","backendPending"],
    ["Premium aktivieren","activatePremium"],["Premium Plus aktivieren","activatePlus"],["Jetzt aktivieren","activateNow"],["Erstaktivierung über den vorgesehenen externen Zahlungsweg.","firstActivation"],["2 Anbieter-/Quotenanzeigen und zusätzliche Premium-Provisionen bis zur 5. Ebene.","premiumActivationSummary"],["Nach erfolgreicher Aktivierung stehen Abo-Verwaltung, Verlängerung und – sofern vorhanden – auszahlbares Provisionsguthaben zur Verfügung.","afterActivation"],["Mit Provisionsguthaben upgraden","upgradeWithCredit"],["Nur bereits auszahlbares Provisionsguthaben kann verwendet werden.","upgradeCreditCopy"],["Extern auf Premium Plus wechseln","externalPlus"],["Tarifwechsel über den vorgesehenen externen Zahlungsweg.","externalPlusCopy"],["Upgrade auf Premium Plus","upgradePlusTitle"],["Die zusätzlichen Premium-Plus-Leistungen gelten erst ab bestätigter Aktivierung und nicht rückwirkend.","plusNotRetroactive"],
    ["Units aufs Tippkonto buchen","refTransfer"],["Buche freigegebene Referral-Units auf dein Tippkonto. Geschenk- und Kauf-Units werden dabei nicht verändert.","refTransferCopy"],["Verfügbare Referral-Units","refAvailable"],["Danach noch verfügbar","remaining"],["Wie viele Units möchtest du aufs Tippkonto buchen?","amountQuestion"],["Die Umbuchung wird serverseitig geprüft und durch eine eindeutige Anfrage-ID gegen Doppelklicks abgesichert.","refTransferNote"],["Abbrechen","cancel"],["⭐ Jetzt umbuchen","transferNow"],
    ["Nicht verfügbar","notAvailable"],["Nicht gefunden","notFound"],["Profil gefunden","profileFound"],["Noch keine Daten vorhanden.","noData"],["Partner","partner"],["Gekauft","purchased"],["Erwartet","expected"],["Freigegeben","released"],["Ebene 1 – direkte Partner","directPartners"],["BI-Nummer","biNumber"],["Sponsor","sponsor"],["Gekaufte Units","purchasedUnits"],["Verbrauchte Kauf-Units","usedPurchasedUnits"],["Erwartete Referral Units","expectedReferral"],["Freigegebene Referral Units","releasedReferral"]
  ]);

  /* These strings are separate DOM text nodes inside <strong>/<span> combinations in the legacy HTML.
     They are intentionally kept here so the existing dashboard markup does not need a risky full rewrite. */
  const LEGACY_NODE_EN = Object.freeze({
    "2 Anbieter-/Quotenanzeigen":"2 provider/odds displays",
    "bei freigeschalteten Tipps":"for unlocked tips",
    "Live-Alarme im Profil und per Telegram":"Live alerts in your profile and via Telegram",
    "für zeitkritische Tipps":"for time-sensitive tips",
    "Zusätzliche Premium-Provision bis":"Additional Premium commission down to",
    "Zusätzliche Premium-Provision bis zur":"Additional Premium commission down to",
    "Ebene 5":"Level 5",
    "5. Ebene":"Level 5",
    "Ebene 8":"Level 8",
    "8. Ebene":"Level 8",
    "Bei allen Mitgliedschaften enthalten:":"Included with every membership:",
    "die laufenden Unit-Provisionen aus dem bestehenden Referral-System bis Ebene 3. Premium ergänzt diese Basis um zusätzliche Premium-Leistungen.":"ongoing Unit commissions from the existing referral system down to Level 3. Premium adds separate Premium benefits on top of this base.",
    "Laufende Unit-Provisionen bis zur 3. Ebene":"Ongoing Unit commissions down to Level 3",
    "aus dem bestehenden Referral-System":"from the existing referral system",
    "Klare Trennung:":"Clear separation:",
    "Die Unit-Provisionen aus dem bestehenden Referral-System laufen bis zur 3. Ebene. Premium und Premium Plus enthalten beide Live-Alarme und ergänzen die Basis um eigene Premium-Leistungen sowie eine größere Premium-Provisionstiefe.":"Unit commissions from the existing referral system run down to Level 3. Premium and Premium Plus both include Live Alerts and add their own Premium benefits plus a greater Premium commission depth."
  });

  const ATTRS = {
    "Tarife und Leistungen vergleichen":"comparePlansAria",
    "Schließen":"close",
    "z. B. 5":"amountPlaceholder",
    "Deine E-Mail-Adresse":"emailPlaceholder",
    "Profil-Link oder Zugangscode":"linkPlaceholder",
    "Support & Tickets öffnen":"support"
  };

  const RUNTIME_EXACT_EN = Object.freeze({
    "Kontostand wurde aktualisiert.":"Balance updated.",
    "BetInsight-ID wurde kopiert.":"BetInsight ID copied.",
    "Der persönliche Profil-Link wurde erneut an deine registrierte E-Mail-Adresse gesendet.":"Your personal profile link was sent again to your registered email address.",
    "Der Profil-Link konnte nicht gesendet werden. Bitte versuche es später erneut.":"The profile link could not be sent. Please try again later.",
    "Die registrierte E-Mail-Adresse ist nicht verfügbar oder ungültig.":"The registered email address is unavailable or invalid.",
    "Bitte eine gültige registrierte BetInsight E-Mail-Adresse eingeben.":"Please enter a valid registered BetInsight email address.",
    "Profil-Link wird angefordert...":"Requesting profile link...",
    "⏳ Wird gesendet...":"⏳ Sending...",
    "✅ Wenn diese E-Mail bei BetInsight registriert ist, wurde der Profil-Link versendet. Bitte prüfe dein E-Mail-Postfach.":"✅ If this email address is registered with BetInsight, the profile link has been sent. Please check your inbox.",
    "Der Profil-Link konnte nicht gesendet werden. Prüfe die E-Mail-Adresse oder versuche es später erneut.":"The profile link could not be sent. Check the email address or try again later.",
    "Bitte Profil-Link oder Zugangscode eintragen.":"Please enter a profile link or access code.",
    "Freigeschaltete Tipps konnten noch nicht geöffnet werden, weil der persönliche Dashboard-Zugang fehlt.":"Unlocked Tips cannot be opened yet because your personal dashboard access is missing.",
    "Die Unit-Wechselstube konnte noch nicht geöffnet werden, weil der persönliche Dashboard-Zugang fehlt.":"The Unit Exchange cannot be opened yet because your personal dashboard access is missing.",
    "Der Support konnte noch nicht geöffnet werden, weil der persönliche Dashboard-Zugang fehlt.":"Support cannot be opened yet because your personal dashboard access is missing.",
    "Die Wallet konnte noch nicht geöffnet werden, weil der persönliche Wallet-Zugang nicht verfügbar ist.":"Wallet cannot be opened yet because your personal wallet access is unavailable.",
    "Der persönliche Profilzugang konnte für diese Seite nicht bereitgestellt werden.":"Your personal profile access could not be provided for this page.",
    "Netzwerkdaten werden erst geladen, wenn du auf „Netzwerk laden“ klickst.":"Network data is loaded only when you click “Load Network”.",
    "Empfehlungsdaten werden geladen...":"Loading referral data...",
    "Empfehlungsübersicht und Strukturdetails wurden erfolgreich geladen.":"Referral overview and structure details loaded successfully.",
    "Die Empfehlungsdaten konnten nicht geladen werden. Bitte versuche es erneut.":"Referral data could not be loaded. Please try again.",
    "⏳ Lädt...":"⏳ Loading...",
    "✅ Aktualisiert":"✅ Updated",
    "❌ Fehler":"❌ Error",
    "Kein direkter Registrierungslink gefunden.":"No direct registration link found.",
    "Kein persönlicher Landingpage-Link gefunden.":"No personal landing page link found.",
    "Der gewünschte Empfehlungslink ist noch nicht verfügbar.":"The requested referral link is not available yet.",
    "✅ Link kopiert":"✅ Link copied",
    "Direkter Registrierungslink wurde kopiert.":"Direct registration link copied.",
    "Persönlicher Landingpage-Link wurde kopiert.":"Personal landing page link copied.",
    "Telegram Live-Alarm ist nur mit aktivem Premium oder Premium Plus verfügbar.":"Telegram Live Alert is available only with active Premium or Premium Plus.",
    "Der sichere Profilzugang fehlt. Bitte öffne deinen aktuellen Profil-Link erneut.":"Secure profile access is missing. Please open your current profile link again.",
    "🔔 Verbindung wird vorbereitet …":"🔔 Preparing connection …",
    "Premium wird serverseitig geprüft.":"Premium status is being checked server-side.",
    "Telegram wird geöffnet. Sende dort die vorbereitete Start-Nachricht.":"Telegram is opening. Send the prepared start message there.",
    "Die Verbindung konnte nicht vorbereitet werden. Bitte versuche es erneut.":"The connection could not be prepared. Please try again.",
    "🔔 Telegram verbinden":"🔔 Connect Telegram",
    "Laufzeit wird mit Premium v1.2 synchronisiert.":"Membership duration is being synchronized with Premium v1.2.",
    "Automatische Verlängerung ist vorgemerkt.":"Automatic renewal is scheduled.",
    "Deine Mitgliedschaft endet in weniger als 5 Tagen.":"Your membership ends in less than 5 days.",
    "Gruppenprovisionen sind während der Kulanz vorgemerkt, aber nicht auszahlbar.":"Group commissions are recorded during the grace period but cannot be paid out.",
    "Premium-Zeitraum beendet":"Premium period ended",
    "● Premium-Zeitraum beendet":"● Premium period ended",
    "Kulanz beendet.":"Grace period ended.",
    "Diese Funktion wird mit Premium v1.2 verbunden.":"This feature will be connected with Premium v1.2.",
    "Die erstmalige Premium-Aktivierung wird über den vorgesehenen externen Zahlungsweg mit Premium v1.2 verbunden.":"The first Premium activation will be connected to the designated external payment method with Premium v1.2.",
    "Der Wechsel auf Premium Plus aus bereits auszahlbarem Provisionsguthaben wird mit Premium v1.2 geprüft und verbunden.":"Switching to Premium Plus using commission balance already available for payout will be checked and connected with Premium v1.2.",
    "Der externe Wechsel auf Premium Plus wird mit Premium v1.2 verbunden. Die zusätzlichen Leistungen gelten erst ab bestätigter Aktivierung und nicht rückwirkend.":"The external switch to Premium Plus will be connected with Premium v1.2. Additional benefits apply only after confirmed activation and are not retroactive.",
    "Verlängerung aus auszahlbarem Provisionsguthaben ist vorbereitet und wird mit Premium v1.2 verbunden.":"Renewal using payable commission balance is prepared and will be connected with Premium v1.2.",
    "Die externe Premium-Verlängerung ist vorbereitet und wird mit Premium v1.2 verbunden.":"External Premium renewal is prepared and will be connected with Premium v1.2.",
    "Die Auto-Verlängerung ist vorbereitet und wird mit Premium v1.2 verbunden.":"Automatic renewal is prepared and will be connected with Premium v1.2.",
    "Der Wechsel zu Premium Plus wird mit Premium v1.2 verbunden. Ab bestätigter Aktivierung gelten dann die Premium-Plus-Leistungen und die zusätzliche Provisionstiefe bis zur 8. Ebene; keine Rückwirkung.":"The switch to Premium Plus will be connected with Premium v1.2. Premium Plus benefits and the additional commission depth down to Level 8 apply after confirmed activation; there is no retroactive effect.",
    "Bitte gib die gewünschte Menge ein.":"Please enter the amount you want to transfer.",
    "Derzeit sind keine Referral-Units zum Umbuchen verfügbar.":"There are currently no Referral Units available for transfer.",
    "Bitte gib eine Menge größer als 0 ein.":"Please enter an amount greater than 0.",
    "Nicht genügend verfügbare Referral-Units.":"Not enough Referral Units are available.",
    "Dein Profilzugang ist nicht verfügbar. Bitte lade dein Profil neu.":"Your profile access is unavailable. Please reload your profile.",
    "Umbuchung wird geprüft und ausgeführt.":"The transfer is being checked and processed.",
    "⏳ Wird gebucht...":"⏳ Transferring...",
    "Diese Umbuchungsanfrage wurde bereits verarbeitet. Es wurde nichts doppelt gebucht.":"This transfer request has already been processed. Nothing was transferred twice.",
    "Die Umbuchung konnte nicht eindeutig abgesichert werden. Bitte versuche es erneut.":"The transfer could not be secured unambiguously. Please try again.",
    "Die Umbuchung konnte nicht durchgeführt werden.":"The transfer could not be completed.",
    "Die Antwort konnte nicht sicher empfangen werden. Bitte versuche dieselbe Umbuchung erneut; der Dublettenschutz bleibt aktiv.":"The response could not be received safely. Please retry the same transfer; duplicate protection remains active.",
    "Profil wurde gefunden. Einzelne Anzeigen konnten noch nicht vollständig aufgebaut werden.":"Profile found. Some displays could not yet be built completely."
  });

  function lang() { return i18n()?.getLanguage?.() === "en" ? "en" : "de"; }
  function leadingTrailing(original, translated) {
    const lead = original.match(/^\s*/)?.[0] || "";
    const tail = original.match(/\s*$/)?.[0] || "";
    return lead + translated + tail;
  }

  function translatePattern(source) {
    if (lang() !== "en") return source;
    if (RUNTIME_EXACT_EN[source]) return RUNTIME_EXACT_EN[source];
    if (LEGACY_NODE_EN[source]) return LEGACY_NODE_EN[source];
    let m;
    if ((m = source.match(/^Ebene (\d+)$/))) return `Level ${m[1]}`;
    if ((m = source.match(/^(\d+) Tage$/))) return `${m[1]} days`;
    if ((m = source.match(/^(\d+) Tag$/))) return `${m[1]} day`;
    if ((m = source.match(/^Noch (.+)$/))) return `${m[1]} remaining`;
    if ((m = source.match(/^Gültig bis (.+)$/))) return `Valid until ${m[1]}`;
    if ((m = source.match(/^Kulanzzeit · noch (.+)$/))) return `Grace period · ${m[1]} remaining`;
    if ((m = source.match(/^● Aktiv · noch (.+) · bis (.+)$/))) return `● Active · ${m[1]} remaining · until ${m[2]}`;
    if (source === "● Aktiv · Laufzeit wird mit Premium v1.2 synchronisiert") return "● Active · duration is being synchronized with Premium v1.2";
    if ((m = source.match(/^● Kulanz · noch (.+)$/))) return `● Grace period · ${m[1]} remaining`;
    if ((m = source.match(/^Status: (aktiv|nicht aktiviert)$/))) return `Status: ${m[1] === "aktiv" ? "enabled" : "not enabled"}`;
    if ((m = source.match(/^(Premium(?: Plus)?) aktiv$/))) return `${m[1]} active`;
    if ((m = source.match(/^(Premium(?: Plus)?) ist aktiv\.$/))) return `${m[1]} is active.`;
    if ((m = source.match(/^(Premium(?: Plus)?) verwalten(?: · gültig bis (.+))?$/))) return `Manage ${m[1]}${m[2] ? ` · valid until ${m[2]}` : ""}`;
    if ((m = source.match(/^(\d+(?:[.,]\d+)?) Units werden aufs Tippkonto gebucht\.$/))) return `${m[1]} Units will be transferred to the tip account.`;
    if ((m = source.match(/^(\d+(?:[.,]\d+)?) Units wurden erfolgreich aufs Tippkonto gebucht\.$/))) return `${m[1]} Units were successfully transferred to the tip account.`;
    if ((m = source.match(/^(\d+(?:[.,]\d+)?) Referral-Units wurden erfolgreich aufs Tippkonto gebucht\.$/))) return `${m[1]} Referral Units were successfully transferred to the tip account.`;
    if ((m = source.match(/^(\d+) ungelesene Support-Antworten$/))) return `${m[1]} unread support replies`;
    if ((m = source.match(/^(\d+) neue Support-Antworten$/))) return `${m[1]} new support replies`;
    if (source === "1 neue Support-Antwort") return "1 new support reply";
    return source;
  }

  function translateSource(source) {
    const key = EXACT.get(source);
    if (key) return t(key, {}, source);
    return translatePattern(source);
  }

  function isKnownSource(value) {
    return EXACT.has(value) || Boolean(RUNTIME_EXACT_EN[value]) || Boolean(LEGACY_NODE_EN[value]) || (lang() === "en" && translatePattern(value) !== value);
  }

  function processText(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.parentElement) return;
    if (["SCRIPT","STYLE","NOSCRIPT"].includes(node.parentElement.tagName)) return;
    const current = node.nodeValue || "";
    const trimmed = current.trim();
    if (!trimmed) return;
    let original = originalText.get(node);
    if (!original || (isKnownSource(trimmed) && trimmed !== translateSource(original))) {
      if (isKnownSource(trimmed) || lang() === "de") {
        original = trimmed;
        originalText.set(node, original);
      }
    }
    if (!original) return;
    const translated = lang() === "de" ? original : translateSource(original);
    if (translated !== trimmed) node.nodeValue = leadingTrailing(current, translated);
  }

  function processElement(el) {
    if (!(el instanceof Element)) return;
    const saved = originalAttrs.get(el) || {};
    for (const attr of ["placeholder","title","aria-label"]) {
      const current = el.getAttribute(attr);
      if (!current) continue;
      if (!saved[attr] && (ATTRS[current] || lang() === "de")) saved[attr] = current;
      const original = saved[attr];
      if (!original) continue;
      const key = ATTRS[original];
      const translated = lang() === "de" ? original : (key ? t(key, {}, original) : translatePattern(original));
      if (translated !== current) el.setAttribute(attr, translated);
    }
    originalAttrs.set(el, saved);
    for (const child of el.childNodes) if (child.nodeType === Node.TEXT_NODE) processText(child);
  }

  function walk(root = document.body) {
    if (!root) return;
    applying = true;
    if (root.nodeType === Node.TEXT_NODE) processText(root);
    else if (root instanceof Element) {
      processElement(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) node.nodeType === Node.TEXT_NODE ? processText(node) : processElement(node);
    }
    applying = false;
    applyPseudoLabels();
    applyLocaleFunctions();
    document.title = t("title", {}, "BetInsight Profil & Empfehlungscenter");
  }

  function applyPseudoLabels() {
    let style = document.getElementById("bi-dashboard-language-style");
    if (!style) { style = document.createElement("style"); style.id = "bi-dashboard-language-style"; document.head.appendChild(style); }
    style.textContent = lang() === "en" ? `.private-row-hidden::after{content:"${t("privacyEmail",{},"Email protected")}"!important}.private-token-hidden::after{content:"${t("privacyAccess",{},"Personal access protected")}"!important}.private-value-hidden::after{content:"${t("privacyProtected",{},"Protected")}"!important}.membership-info-tier.current-tier::after{content:"${t("yourPlan",{},"YOUR PLAN")}"!important}` : "";
  }

  function applyLocaleFunctions() {
    const locale = lang() === "en" ? "en-US" : "de-DE";
    window.formatNumber = value => new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(typeof window.safeNumber === "function" ? window.safeNumber(value) : Number(value||0));
    window.formatUnitsTwoDecimals = value => new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(typeof window.safeNumber === "function" ? window.safeNumber(value) : Number(value||0));
    window.formatDateTimeDe = date => (!(date instanceof Date)||Number.isNaN(date.getTime())) ? "–" : new Intl.DateTimeFormat(locale,{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(date);
    window.formatCountdown = ms => { const safe=Math.max(0,ms),total=Math.floor(safe/1000),days=Math.floor(total/86400),hours=Math.floor((total%86400)/3600),minutes=Math.floor((total%3600)/60),seconds=total%60; if(days>0) return lang()==="en"?`${days} ${days===1?"day":"days"} · ${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`:`${days} ${days===1?"Tag":"Tage"} · ${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`; return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")} ${lang()==="en"?"hrs":"Std."}`; };
  }

  function basePath() { return session()?.basePath?.() || (location.hostname.toLowerCase()==="betinsightclub.github.io"?"/profil/":"/"); }
  function route(segment = "", replace = false, hash = "") {
    if (session()) return replace ? session().replaceLocal(segment,{hash}) : session().navigateLocal(segment,{hash});
    const clean=String(segment||"").replace(/^\/+|\/+$/g,"");
    const path=basePath()+(clean?clean+"/":"")+(hash?`#${encodeURIComponent(String(hash).replace(/^#/,""))}`:"");
    replace?location.replace(path):location.assign(path);
  }

  function installSafeRouting() {
    window.goBuyUnits = () => route("kaufen");
    window.goTipps = () => {
      if (!session()?.hasProfileAccess?.()) {
        const message=document.getElementById("message");
        if(message)message.textContent=lang()==="en"?"Your personal profile access is not available for New Tips yet.":"Der persönliche Profilzugang ist für Neue Tipps noch nicht verfügbar.";
        return;
      }
      route("tipps");
    };
    window.goFreigeschaltet = () => route("freigeschaltet");
    window.goUnitExchange = () => route("wechselboerse");
    window.goMarketingCenter = () => route("marketing-center");
    window.goSupport = () => route("support");
    window.openReceivedProfileLink = () => {
      const input=document.getElementById("receivedProfileLink"), message=document.getElementById("receivedLinkMessage");
      const raw=String(input?.value||"").trim();
      const token=typeof window.extractTokenFromInput==="function"?window.extractTokenFromInput(raw):raw;
      if(!token){if(message)message.textContent=lang()==="en"?"Please enter a profile link or access code.":"Bitte Profil-Link oder Zugangscode eintragen.";return}
      if(session()?.isUuid?.(token)) session().rememberDashboardUuid(token); else session()?.rememberProfileToken?.(token);
      route("",true,(typeof window.preserveSupportedHash==="function"?window.preserveSupportedHash():"").replace(/^#/,""));
    };
    window.handleDeepLinkAfterProfileLoad = () => {
      if (window.deepLinkHandled) return;
      const target=typeof window.getDeepLinkTarget==="function"?window.getDeepLinkTarget():String(location.hash||"").replace(/^#/,"").toLowerCase();
      if(!target)return;
      if(target==="tipps" && !session()?.hasProfileAccess?.()) {
        const message=document.getElementById("message");
        if(message)message.textContent=lang()==="en"?"Your personal profile access is not available for New Tips yet.":"Der persönliche Profilzugang ist für Neue Tipps noch nicht verfügbar.";
        return;
      }
      if(["wallet","freigeschaltet","tipps","kaufen"].includes(target)){window.deepLinkHandled=true;route(target,true);return}
      if(target==="premium"||target==="netzwerk"){if(typeof window.scrollToDeepLinkTarget==="function"&&window.scrollToDeepLinkTarget(target))window.deepLinkHandled=true;}
    };
  }

  async function boot() {
    installSafeRouting();
    await i18n()?.init?.();
    walk(document.body);
    const observer = new MutationObserver(records => {
      if (applying) return;
      for (const record of records) {
        if (record.type === "characterData") processText(record.target);
        else for (const node of record.addedNodes) node.nodeType===Node.TEXT_NODE ? processText(node) : (node instanceof Element && walk(node));
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener("bi:languagechange",()=>walk(document.body));
  }

  installSafeRouting();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
