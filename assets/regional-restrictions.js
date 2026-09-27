/* BetInsight regional compliance switch
   Version: 2026-09-27-01

   IMPORTANT:
   - This file centralizes temporary regional product restrictions.
   - To remove the temporary Brazil betting/provider restriction later,
     change only BRAZIL_BETTING_BLOCK_ACTIVE to false and publish.
   - This is a product/compliance guard, not a substitute for server-side geolocation.
*/
(() => {
  "use strict";

  const BRAZIL_BETTING_BLOCK_ACTIVE = true;
  const STORAGE_KEY = "betinsight_country_code";
  const VERSION = "2026-09-27-01";

  const aliases = {
    BR: "BR",
    BRAZIL: "BR",
    BRASIL: "BR",
    BRASILIEN: "BR",
    BRÉSIL: "BR",
    BRESIL: "BR",
    BRASILE: "BR"
  };

  const normalizeText = value => String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  function normalizeCountryCode(value) {
    const raw = normalizeText(value);
    if (!raw) return "";
    if (/^[A-Z]{2}$/.test(raw)) return raw;
    return aliases[raw] || "";
  }

  function rememberCountry(value) {
    const code = normalizeCountryCode(value);
    if (!code) return "";
    try { localStorage.setItem(STORAGE_KEY, code); } catch (_) {}
    return code;
  }

  function currentCountry() {
    try { return normalizeCountryCode(localStorage.getItem(STORAGE_KEY)); }
    catch (_) { return ""; }
  }

  function isBrazilBlocked(value) {
    const code = normalizeCountryCode(value) || currentCountry();
    return BRAZIL_BETTING_BLOCK_ACTIVE && code === "BR";
  }

  function clearRememberedCountry() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  const messages = {
    de: {
      title: "Für Brasilien derzeit nicht verfügbar",
      body: "BetInsight zeigt Nutzern in Brasilien derzeit keine Wettanbieter, Casino-Angebote, Wett-/Casino-Affiliate-Links, Weiterleitungen zu Wettplattformen oder anbieterbezogenen Quoten- und Quotenvergleichsfunktionen.",
      premium: "Premium und Premium Plus sind in Brasilien derzeit nicht zum Kauf verfügbar, solange wesentliche Tarifbestandteile anbieterbezogene Quoten- oder Weiterleitungsfunktionen enthalten."
    },
    en: {
      title: "Currently unavailable in Brazil",
      body: "BetInsight currently does not show users in Brazil bookmakers, casino offers, betting/casino affiliate links, redirects to betting platforms, or provider-specific odds and odds-comparison features.",
      premium: "Premium and Premium Plus are currently unavailable for purchase in Brazil while material tariff features include provider-specific odds or redirect functions."
    },
    es: {
      title: "Actualmente no disponible en Brasil",
      body: "BetInsight no muestra actualmente a usuarios en Brasil casas de apuestas, ofertas de casino, enlaces de afiliación de apuestas/casino, redirecciones a plataformas de apuestas ni funciones de cuotas o comparación de cuotas vinculadas a proveedores.",
      premium: "Premium y Premium Plus no están actualmente disponibles para compra en Brasil mientras partes esenciales de la tarifa incluyan cuotas o redirecciones vinculadas a proveedores."
    },
    fr: {
      title: "Actuellement indisponible au Brésil",
      body: "BetInsight n'affiche actuellement aux utilisateurs situés au Brésil ni bookmakers, ni offres de casino, ni liens d'affiliation paris/casino, ni redirections vers des plateformes de paris, ni fonctions de cotes ou de comparaison de cotes liées à des opérateurs.",
      premium: "Premium et Premium Plus ne sont actuellement pas disponibles à l'achat au Brésil tant que des éléments essentiels du tarif reposent sur des cotes ou redirections liées à des opérateurs."
    },
    it: {
      title: "Attualmente non disponibile in Brasile",
      body: "BetInsight non mostra attualmente agli utenti in Brasile bookmaker, offerte di casinò, link di affiliazione scommesse/casinò, reindirizzamenti a piattaforme di scommesse o funzioni di quote e confronto quote legate a operatori.",
      premium: "Premium e Premium Plus non sono attualmente acquistabili in Brasile finché parti essenziali della tariffa includono quote o reindirizzamenti legati a operatori."
    },
    pt: {
      title: "Atualmente indisponível no Brasil",
      body: "A BetInsight atualmente não exibe para usuários localizados no Brasil casas de apostas, ofertas de cassino, links de afiliados de apostas/cassino, encaminhamentos para plataformas de apostas nem funções de odds ou comparação de odds vinculadas a operadores.",
      premium: "Premium e Premium Plus estão atualmente indisponíveis para compra no Brasil enquanto partes essenciais da tarifa incluírem odds ou encaminhamentos vinculados a operadores."
    }
  };

  function language() {
    const lang = String(document.documentElement.lang || navigator.language || "en").toLowerCase();
    if (lang.startsWith("de")) return "de";
    if (lang.startsWith("es")) return "es";
    if (lang.startsWith("fr")) return "fr";
    if (lang.startsWith("it")) return "it";
    if (lang.startsWith("pt")) return "pt";
    return "en";
  }

  function getMessages(lang = language()) {
    return messages[lang] || messages.en;
  }

  window.BetInsightRegionalRestrictions = {
    version: VERSION,
    brazilBettingBlockActive: BRAZIL_BETTING_BLOCK_ACTIVE,
    normalizeCountryCode,
    rememberCountry,
    currentCountry,
    isBrazilBlocked,
    clearRememberedCountry,
    getMessages
  };
})();