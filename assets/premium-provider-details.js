/* BetInsight Premium Upgrade · provider detail capture v2
   - Reuses the existing BetInsight country/provider whitelist data.
   - WHITELISTED => concrete provider dropdown for the selected country/region.
   - KRYPTO / SONSTIGE => concrete provider name input.
   - Checkout receives provider_N = concrete provider and provider_type_N = selected category.
   - Production checkout logic itself is not replaced. */
(() => {
  "use strict";

  const pagePath = String(location.pathname || "").replace(/\/+$/, "");
  if (!pagePath.endsWith("/premium-upgrade")) return;
  if (window.__betInsightPremiumProviderDetailsInstalled) return;
  window.__betInsightPremiumProviderDetailsInstalled = true;

  const CHECKOUT_HOST_FRAGMENT = "hook.eu1.make.com/oj6bq9eh2cprdkszwlbegh62nszod6v6";
  const BASE_URL = "../assets/provider-whitelist.json?v=20260831-4";
  const MANIFEST_URL = "../assets/provider-whitelist-batches.json?v=20260909-1";
  const clean = value => String(value || "").trim();
  const normalize = value => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  let whitelist = null;
  let whitelistLoadError = "";
  let selectedRegionCode = "";

  const country = document.getElementById("country");
  const slots = document.getElementById("slots");
  const continueBtn = document.getElementById("continueBtn");
  const notice = document.getElementById("notice");

  if (!country || !slots || !continueBtn) return;

  function deepMerge(target, source) {
    if (!source || typeof source !== "object") return target;
    for (const [key, value] of Object.entries(source)) {
      if (Array.isArray(value)) target[key] = value.slice();
      else if (value && typeof value === "object") {
        if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) target[key] = {};
        deepMerge(target[key], value);
      } else target[key] = value;
    }
    return target;
  }

  async function loadWhitelist() {
    try {
      const [baseResponse, manifestResponse] = await Promise.all([
        fetch(BASE_URL, { cache: "no-store" }),
        fetch(MANIFEST_URL, { cache: "no-store" })
      ]);
      if (!baseResponse.ok) throw new Error(`Whitelist HTTP ${baseResponse.status}`);
      if (!manifestResponse.ok) throw new Error(`Whitelist manifest HTTP ${manifestResponse.status}`);
      const base = await baseResponse.json();
      const manifest = await manifestResponse.json();
      whitelist = base;
      const files = Array.isArray(manifest?.files) ? manifest.files : [];
      for (const file of files) {
        const url = new URL(`../assets/${file}`, location.href);
        url.searchParams.set("v", manifest.updated || manifest.version || Date.now());
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`Whitelist batch HTTP ${response.status}: ${file}`);
        deepMerge(whitelist, await response.json());
      }
      renderRegionChooser();
      renderAllSlots();
    } catch (error) {
      console.error("Premium whitelist konnte nicht geladen werden:", error);
      whitelistLoadError = "Die Länder-Whitelist konnte gerade nicht geladen werden. Whitelist-Anbieter bitte vorübergehend manuell eintragen.";
      renderAllSlots();
    }
  }

  function countryCodeForName(name) {
    const selected = normalize(name);
    if (!selected || !whitelist) return "";

    const aliases = {
      "vereinigte staaten": "US",
      "vereinigtes konigreich": "GB",
      "weissrussland": "BY",
      "moldau": "MD",
      "elfenbeinkuste": "CI",
      "kap verde": "CV",
      "kongo demokratische republik": "CD",
      "kongo republik": "CG",
      "sudkorea": "KR",
      "nordkorea": "KP",
      "tschechien": "CZ",
      "vatikanstadt": "VA",
      "brunei": "BN",
      "laos": "LA",
      "bolivien": "BO",
      "russland": "RU",
      "syrien": "SY",
      "tansania": "TZ",
      "venezuela": "VE",
      "eswatini": "SZ",
      "timor leste": "TL",
      "sao tome und principe": "ST",
      "st kitts und nevis": "KN",
      "st lucia": "LC",
      "st vincent und die grenadinen": "VC"
    };
    if (aliases[selected]) return aliases[selected];

    let names;
    try { names = new Intl.DisplayNames(["de"], { type: "region" }); } catch (_) { names = null; }
    for (const code of whitelist.country_codes || []) {
      const label = code === "XK" ? "Kosovo" : (names?.of(code) || code);
      if (normalize(label) === selected) return code;
    }
    return "";
  }

  function currentCountryCode() {
    return countryCodeForName(country.value);
  }

  function currentCountryRule() {
    const code = currentCountryCode();
    return code ? whitelist?.country_rules?.[code] || null : null;
  }

  function regionMeta(code, regionCode) {
    return (whitelist?.regions?.[code] || []).find(item => clean(item.code) === clean(regionCode)) || null;
  }

  function regionRule(countryRule, regionCode) {
    if (!countryRule || !regionCode) return null;
    if (countryRule.regions && typeof countryRule.regions === "object" && !Array.isArray(countryRule.regions)) return countryRule.regions[regionCode] || null;
    if (countryRule.region_rules && typeof countryRule.region_rules === "object") return countryRule.region_rules[regionCode] || null;
    return null;
  }

  function effectiveRule() {
    const rule = currentCountryRule();
    if (!rule) return null;
    if (clean(rule.status).toLowerCase() === "regional") return regionRule(rule, selectedRegionCode) || null;
    return rule;
  }

  function providersFromRule(rule) {
    const list = Array.isArray(rule?.providers) ? rule.providers : [];
    return list.map(item => typeof item === "string" ? item : clean(item?.name)).filter(Boolean);
  }

  function ensureStyle() {
    if (document.getElementById("bi-premium-provider-detail-style")) return;
    const style = document.createElement("style");
    style.id = "bi-premium-provider-detail-style";
    style.textContent = `
      .bi-provider-detail{grid-column:1/-1;margin-top:10px;padding:12px;border:1px solid rgba(77,184,255,.18);border-radius:11px;background:rgba(3,27,38,.62)}
      .bi-provider-detail label{display:block;margin-bottom:7px;color:#dff7ff;font-size:.82rem;font-weight:850}
      .bi-provider-detail input,.bi-provider-detail select{width:100%;min-height:46px;padding:0 12px;border:1px solid rgba(77,184,255,.30);border-radius:10px;background:#062b3d;color:#fff;outline:none}
      .bi-provider-detail .bi-hint{margin-top:7px;color:#9fc0cf;font-size:.75rem;line-height:1.4}
      .bi-provider-detail .bi-warning{color:#ffd695}
      .bi-region-box{margin-top:14px;padding:14px;border:1px solid rgba(255,174,53,.28);border-radius:12px;background:rgba(255,174,53,.06)}
      .bi-region-box label{display:block;margin-bottom:7px;color:#ffe2ad;font-size:.84rem;font-weight:900}
      .bi-region-box select{width:100%;min-height:48px;padding:0 12px;border:1px solid rgba(255,174,53,.35);border-radius:10px;background:#062b3d;color:#fff}
    `;
    document.head.appendChild(style);
  }

  function ensureRegionBox() {
    let box = document.getElementById("biPremiumRegionBox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "biPremiumRegionBox";
    box.className = "bi-region-box hidden";
    box.innerHTML = `<label for="biPremiumRegion">Region / Bundesland auswählen</label><select id="biPremiumRegion"><option value="">Bitte Region auswählen</option></select><div class="bi-hint" style="margin-top:7px;color:#dcbf8f;font-size:.76rem">Für dieses Land ist die Anbieterfreigabe regional geregelt.</div>`;
    country.closest(".field")?.insertAdjacentElement("afterend", box);
    box.querySelector("select")?.addEventListener("change", event => {
      selectedRegionCode = clean(event.target.value);
      renderAllSlots();
    });
    return box;
  }

  function renderRegionChooser() {
    const box = ensureRegionBox();
    const select = box.querySelector("select");
    selectedRegionCode = "";
    if (!whitelist || !country.value) {
      box.classList.add("hidden");
      return;
    }
    const code = currentCountryCode();
    const rule = currentCountryRule();
    const regional = clean(rule?.status).toLowerCase() === "regional";
    if (!code || !regional) {
      box.classList.add("hidden");
      return;
    }
    const regions = whitelist.regions?.[code] || [];
    select.innerHTML = `<option value="">Bitte Region auswählen</option>` + regions.map(region => `<option value="${String(region.code).replace(/"/g, "&quot;")}">${String(region.name_de || region.name || region.code).replace(/</g, "&lt;")}</option>`).join("");
    box.classList.remove("hidden");
  }

  function slotIndex(slot, fallbackIndex) {
    const number = clean(slot.querySelector(".slot-number")?.textContent);
    const parsed = Number(number);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackIndex + 1;
  }

  function detailContainer(slot) {
    let container = slot.querySelector(".bi-provider-detail");
    if (!container) {
      container = document.createElement("div");
      container.className = "bi-provider-detail";
      slot.appendChild(container);
    }
    return container;
  }

  function categorySelect(slot) {
    return [...slot.querySelectorAll("select")].find(select => !select.classList.contains("bi-concrete-provider")) || null;
  }

  function currentDetailValue(slot) {
    const field = slot.querySelector(".bi-concrete-provider");
    return clean(field?.value);
  }

  function renderSlot(slot, index) {
    const select = categorySelect(slot);
    if (!select) return;
    const type = clean(select.value).toUpperCase();
    const container = detailContainer(slot);
    const oldValue = currentDetailValue(slot);
    const countryName = clean(country.value) || "deinem Land";
    const code = currentCountryCode();
    const countryRule = currentCountryRule();
    const regional = clean(countryRule?.status).toLowerCase() === "regional";

    if (!type) {
      container.innerHTML = `<div class="bi-hint">Nach Auswahl der Anbieterart legst du hier den konkreten Anbieter fest.</div>`;
      updateContinueState();
      return;
    }

    if (type === "WHITELISTED" && whitelist && code) {
      if (regional && !selectedRegionCode) {
        container.innerHTML = `<label>Whitelisted-Anbieter</label><div class="bi-hint bi-warning">Bitte zuerst Region / Bundesland auswählen.</div>`;
        updateContinueState();
        return;
      }
      const rule = effectiveRule();
      const providers = providersFromRule(rule);
      if (providers.length) {
        container.innerHTML = `<label>Welchen Whitelist-Anbieter nutzt du?</label><select class="bi-concrete-provider" data-provider-detail="${index + 1}"><option value="">Bitte Anbieter auswählen</option>${providers.map(name => `<option value="${name.replace(/"/g, "&quot;")}">${name.replace(/</g, "&lt;")}</option>`).join("")}</select><div class="bi-hint">Aus der geprüften BetInsight-Whitelist für ${countryName}${selectedRegionCode ? ` · ${regionMeta(code, selectedRegionCode)?.name_de || selectedRegionCode}` : ""}.</div>`;
        const field = container.querySelector(".bi-concrete-provider");
        if (providers.includes(oldValue)) field.value = oldValue;
        field.addEventListener("change", updateContinueState);
        updateContinueState();
        return;
      }
      const state = clean(rule?.provider_state || rule?.status).replaceAll("_", " ");
      container.innerHTML = `<label>Whitelist-Anbieter</label><input class="bi-concrete-provider" data-provider-detail="${index + 1}" type="text" maxlength="80" placeholder="Name des Anbieters" value="${oldValue.replace(/"/g, "&quot;")}"><div class="bi-hint bi-warning">Für diese Auswahl liefert die Whitelist aktuell keine Anbieter-Liste${state ? ` (${state})` : ""}. Bitte Anbietername eintragen; die Master-Zuordnung prüft ihn.</div>`;
      container.querySelector(".bi-concrete-provider")?.addEventListener("input", updateContinueState);
      updateContinueState();
      return;
    }

    const label = type === "KRYPTO" ? "Welchen Krypto-Anbieter nutzt du?" : (type === "SONSTIGE" ? "Wie heißt dein sonstiger Anbieter?" : "Wie heißt dein Anbieter?");
    const hint = type === "KRYPTO" ? "Bitte den konkreten Krypto-Anbieter eintragen. Er kann später im Premium-Master einem festen Anbieter zugeordnet werden." : "Bitte den konkreten Anbieter eintragen. Freitexte werden im Premium-Master normalisiert und zugeordnet.";
    container.innerHTML = `<label>${label}</label><input class="bi-concrete-provider" data-provider-detail="${index + 1}" type="text" maxlength="80" autocomplete="off" placeholder="Anbietername" value="${oldValue.replace(/"/g, "&quot;")}"><div class="bi-hint">${hint}${whitelistLoadError ? ` ${whitelistLoadError}` : ""}</div>`;
    container.querySelector(".bi-concrete-provider")?.addEventListener("input", updateContinueState);
    updateContinueState();
  }

  function renderAllSlots() {
    [...slots.querySelectorAll(".slot")].forEach((slot, index) => renderSlot(slot, index));
    updateContinueState();
  }

  function detailsComplete() {
    const slotList = [...slots.querySelectorAll(".slot")];
    if (!slotList.length) return false;
    const countryRule = currentCountryRule();
    if (clean(countryRule?.status).toLowerCase() === "regional" && !selectedRegionCode) return false;
    return slotList.every(slot => {
      const type = clean(categorySelect(slot)?.value);
      const value = currentDetailValue(slot);
      return Boolean(type && value);
    });
  }

  function updateContinueState() {
    const baseReady = Boolean(clean(country.value)) && Boolean(clean(document.getElementById("tariff")?.value));
    if (!baseReady || !detailsComplete()) continueBtn.disabled = true;
  }

  function showNotice(message) {
    if (!notice) return;
    notice.style.display = "block";
    notice.textContent = message;
  }

  function validateBeforeCheckout(event) {
    renderAllSlots();
    if (detailsComplete()) return true;
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    showNotice("Bitte für jeden Platz einen konkreten Anbieter auswählen bzw. eintragen. Bei regional geregelten Ländern bitte zuerst die Region wählen.");
    return false;
  }

  continueBtn.addEventListener("click", validateBeforeCheckout, true);

  slots.addEventListener("change", event => {
    if (event.target instanceof HTMLSelectElement && !event.target.classList.contains("bi-concrete-provider")) {
      const slot = event.target.closest(".slot");
      if (slot) {
        const all = [...slots.querySelectorAll(".slot")];
        renderSlot(slot, all.indexOf(slot));
      }
    }
    updateContinueState();
  }, true);

  country.addEventListener("change", () => {
    selectedRegionCode = "";
    renderRegionChooser();
    renderAllSlots();
  }, true);

  const observer = new MutationObserver(() => renderAllSlots());
  observer.observe(slots, { childList: true, subtree: true });

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init = {}) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.includes(CHECKOUT_HOST_FRAGMENT) || String(init.method || "GET").toUpperCase() !== "POST") return originalFetch(input, init);

    if (!validateBeforeCheckout()) {
      return new Response(JSON.stringify({ ok: false, error: "PROVIDER_DETAILS_REQUIRED", message: "Konkrete Anbieter fehlen." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    let payload;
    try { payload = JSON.parse(String(init.body || "{}")); }
    catch (_) { return originalFetch(input, init); }

    const slotList = [...slots.querySelectorAll(".slot")];
    slotList.forEach((slot, index) => {
      const pos = slotIndex(slot, index);
      payload[`provider_type_${pos}`] = clean(categorySelect(slot)?.value).toUpperCase();
      payload[`provider_${pos}`] = currentDetailValue(slot);
    });
    payload.whitelist_country_code = currentCountryCode();
    payload.whitelist_region_code = selectedRegionCode;
    payload.provider_selection_version = "PREMIUM-PROVIDER-WHITELIST-V2";

    return originalFetch(input, Object.assign({}, init, { body: JSON.stringify(payload) }));
  };

  ensureStyle();
  ensureRegionBox();
  loadWhitelist();
  renderAllSlots();
})();