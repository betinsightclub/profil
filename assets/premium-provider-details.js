/* BetInsight Premium Upgrade · provider detail capture v1
   Adds a required concrete provider name to each selected provider category.
   The checkout keeps the category as provider_type_N and sends the actual provider name as provider_N. */
(() => {
  "use strict";

  const path = String(window.location.pathname || "").replace(/\/+$/, "");
  if (!path.endsWith("/premium-upgrade")) return;
  if (window.__betInsightPremiumProviderDetailsInstalled) return;
  window.__betInsightPremiumProviderDetailsInstalled = true;

  const CHECKOUT_HOST_FRAGMENT = "hook.eu1.make.com/oj6bq9eh2cprdkszwlbegh62nszod6v6";
  const clean = value => String(value || "").trim();

  function typeLabel(value) {
    const type = clean(value).toUpperCase();
    if (type === "WHITELISTED") return "Whitelisted";
    if (type === "KRYPTO") return "Krypto";
    if (type === "SONSTIGE") return "Sonstige";
    return "";
  }

  function fieldCopy(type, country) {
    const land = clean(country) || "deinem Land";
    if (type === "WHITELISTED") {
      return {
        label: "Welchen Whitelist-Anbieter nutzt du?",
        placeholder: "z. B. Name des Wettanbieters",
        hint: `Trage den konkreten Anbieter ein. BetInsight ordnet ihn der für ${land} gültigen Whitelist zu.`
      };
    }
    if (type === "KRYPTO") {
      return {
        label: "Welchen Krypto-Anbieter nutzt du?",
        placeholder: "Name des Krypto-Anbieters",
        hint: "Bitte den konkreten Anbieter angeben, damit später der richtige Anbieter angezeigt werden kann."
      };
    }
    return {
      label: "Wie heißt dein Anbieter?",
      placeholder: "Name des Anbieters",
      hint: "Bitte den konkreten Anbieternamen eintragen."
    };
  }

  function installStyle() {
    if (document.getElementById("bi-premium-provider-detail-style")) return;
    const style = document.createElement("style");
    style.id = "bi-premium-provider-detail-style";
    style.textContent = `
      .bi-provider-detail-wrap{grid-column:2;display:none;margin-top:2px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}
      .bi-provider-detail-wrap.visible{display:grid;gap:6px}
      .bi-provider-detail-label{color:#dff7ff;font-size:.82rem;font-weight:850}
      .bi-provider-detail-input{width:100%;min-height:48px;padding:11px 13px;border:1px solid rgba(77,184,255,.34);border-radius:11px;background:#05283a;color:#fff;outline:none;font:inherit}
      .bi-provider-detail-input:focus{border-color:rgba(77,184,255,.82);box-shadow:0 0 0 3px rgba(22,156,255,.10)}
      .bi-provider-detail-input.invalid{border-color:rgba(255,174,53,.78)}
      .bi-provider-detail-hint{color:#9fc0cf;font-size:.75rem;line-height:1.42}
      @media(max-width:650px){.bi-provider-detail-wrap{grid-column:1 / -1}}
    `;
    document.head.appendChild(style);
  }

  function detailInputs() {
    return [...document.querySelectorAll("#slots .bi-provider-detail-input")];
  }

  function updateSummary() {
    const target = document.getElementById("summaryProviders");
    if (!target) return;
    const rows = [...document.querySelectorAll("#slots .slot")];
    const parts = rows.map((row, index) => {
      const select = row.querySelector("select.providerType");
      const input = row.querySelector(".bi-provider-detail-input");
      const type = typeLabel(select?.value);
      const name = clean(input?.value);
      return `${index + 1}. ${type || "Anbieterart"}${name ? " – " + name : ""}`;
    });
    if (parts.length) target.textContent = "Anbieter: " + parts.join(" · ");
  }

  function enforceRequiredDetails() {
    const button = document.getElementById("continueBtn");
    const selects = [...document.querySelectorAll("#slots select.providerType")];
    if (!button || !selects.length) return;

    let detailsComplete = true;
    for (const select of selects) {
      const row = select.closest(".slot");
      const input = row?.querySelector(".bi-provider-detail-input");
      if (!select.value || !input || !clean(input.value)) detailsComplete = false;
      if (input) input.classList.toggle("invalid", Boolean(select.value) && !clean(input.value));
    }

    const baseReady = Boolean(clean(document.getElementById("buyerEmail")?.value)) &&
      Boolean(clean(document.getElementById("tariff")?.value)) &&
      Boolean(clean(document.getElementById("country")?.value)) &&
      selects.every(select => Boolean(select.value));

    button.disabled = !(baseReady && detailsComplete);
    updateSummary();
  }

  function syncRow(row) {
    const select = row.querySelector("select.providerType");
    const wrap = row.querySelector(".bi-provider-detail-wrap");
    const input = row.querySelector(".bi-provider-detail-input");
    const label = row.querySelector(".bi-provider-detail-label");
    const hint = row.querySelector(".bi-provider-detail-hint");
    if (!select || !wrap || !input || !label || !hint) return;

    const type = clean(select.value).toUpperCase();
    if (!type) {
      wrap.classList.remove("visible");
      input.required = false;
      input.value = "";
      input.dataset.providerType = "";
      enforceRequiredDetails();
      return;
    }

    const copy = fieldCopy(type, document.getElementById("country")?.value);
    wrap.classList.add("visible");
    label.textContent = copy.label;
    input.placeholder = copy.placeholder;
    hint.textContent = copy.hint;
    input.required = true;
    input.dataset.providerType = type;
    enforceRequiredDetails();
  }

  function enhanceRow(row, index) {
    if (!(row instanceof Element) || row.dataset.biProviderDetails === "1") return;
    const select = row.querySelector("select.providerType");
    if (!select) return;
    row.dataset.biProviderDetails = "1";

    const wrap = document.createElement("div");
    wrap.className = "bi-provider-detail-wrap";
    wrap.innerHTML = `
      <label class="bi-provider-detail-label" for="biProviderName${index + 1}">Wie heißt dein Anbieter?</label>
      <input id="biProviderName${index + 1}" class="bi-provider-detail-input" type="text" maxlength="100" autocomplete="organization" placeholder="Name des Anbieters">
      <div class="bi-provider-detail-hint">Bitte den konkreten Anbieternamen eintragen.</div>
    `;
    row.appendChild(wrap);

    const input = wrap.querySelector(".bi-provider-detail-input");
    select.addEventListener("change", () => syncRow(row));
    input.addEventListener("input", enforceRequiredDetails);
    input.addEventListener("blur", enforceRequiredDetails);
    syncRow(row);
  }

  function enhanceSlots() {
    [...document.querySelectorAll("#slots .slot")].forEach((row, index) => enhanceRow(row, index));
    enforceRequiredDetails();
  }

  function installCheckoutTransportPatch() {
    if (window.__betInsightPremiumProviderFetchPatched) return;
    window.__betInsightPremiumProviderFetchPatched = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = function(input, init) {
      try {
        const raw = typeof input === "string" ? input : input?.url;
        if (raw && raw.includes(CHECKOUT_HOST_FRAGMENT)) {
          const url = new URL(raw, window.location.href);
          const rows = [...document.querySelectorAll("#slots .slot")];
          rows.forEach((row, index) => {
            const n = index + 1;
            const select = row.querySelector("select.providerType");
            const inputField = row.querySelector(".bi-provider-detail-input");
            url.searchParams.set(`provider_type_${n}`, clean(select?.value));
            url.searchParams.set(`provider_${n}`, clean(inputField?.value));
          });
          for (let n = rows.length + 1; n <= 5; n++) {
            url.searchParams.set(`provider_type_${n}`, "");
            url.searchParams.set(`provider_${n}`, "");
          }
          input = url.toString();
        }
      } catch (e) {
        console.warn("BetInsight Premium Anbieterangabe konnte nicht ergänzt werden.", e);
      }
      return originalFetch(input, init);
    };
  }

  function boot() {
    installStyle();
    installCheckoutTransportPatch();

    const slots = document.getElementById("slots");
    if (slots) {
      enhanceSlots();
      const observer = new MutationObserver(enhanceSlots);
      observer.observe(slots, { childList: true, subtree: true });
    }

    document.getElementById("country")?.addEventListener("change", () => {
      [...document.querySelectorAll("#slots .slot")].forEach(syncRow);
    });

    document.getElementById("tariff")?.addEventListener("change", () => setTimeout(enhanceSlots, 0));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
