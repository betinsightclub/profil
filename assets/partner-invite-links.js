/* BetInsight Profil · Partner-Einladungslinks · 2026-09-05
   UI-only augmentation:
   - keeps existing registration and landing-page links untouched
   - adds one persistent webinar/replay invitation link from the same public ref_code
   - reads the ref_code only from links already rendered by the existing profile logic
   - does not call Make, Sheets or protected token APIs
*/
(() => {
  "use strict";

  const WEBINAR_BASE = "https://betinsight.club/de/webinar/";
  const LINK_ID = "webinarReferralLink";
  const BUTTON_ID = "copyWebinarReferralButton";
  const cleanRef = value => {
    const ref = String(value || "").trim();
    return /^[A-Za-z0-9_-]{2,50}$/.test(ref) ? ref : "";
  };

  function language() {
    return String(window.BetInsightI18n?.getLanguage?.() || "de").trim().toLowerCase() === "en" ? "en" : "de";
  }

  function text(de, en) {
    return language() === "en" ? en : de;
  }

  function refFromRenderedLink(id) {
    const raw = String(document.getElementById(id)?.textContent || "").trim();
    if (!raw || !/^https?:\/\//i.test(raw)) return "";
    try {
      const url = new URL(raw);
      return cleanRef(url.searchParams.get("ref") || url.searchParams.get("ref_code"));
    } catch (_) {
      return "";
    }
  }

  function currentRef() {
    return refFromRenderedLink("registrationReferralLink") || refFromRenderedLink("landingpageReferralLink");
  }

  function buildWebinarUrl(refCode) {
    const url = new URL(WEBINAR_BASE);
    url.searchParams.set("ref", refCode);
    return url.toString();
  }

  function ensureRow() {
    const group = document.querySelector(".referral-link-group");
    if (!group || document.getElementById(LINK_ID)) return;

    const wrapper = document.createElement("div");
    wrapper.dataset.biPartnerWebinarLink = "1";
    wrapper.innerHTML = `
      <div class="referral-link-heading">${text("Webinar & Aufzeichnung – persönlicher Einladungslink", "Webinar & replay – personal invitation link")}</div>
      <div class="referral-link-row">
        <div id="${LINK_ID}" class="referral-linkbox">${text("Webinar-Link wird geladen...", "Webinar link is loading...")}</div>
        <button id="${BUTTON_ID}" class="btn-orange" type="button" disabled>${text("📋 Webinar-Link kopieren", "📋 Copy webinar link")}</button>
      </div>`;
    group.appendChild(wrapper);

    document.getElementById(BUTTON_ID)?.addEventListener("click", copyWebinarLink);
  }

  function sync() {
    ensureRow();
    const box = document.getElementById(LINK_ID);
    const button = document.getElementById(BUTTON_ID);
    if (!box || !button) return;

    const refCode = currentRef();
    if (!refCode) {
      box.textContent = text("Webinar-Link wird geladen...", "Webinar link is loading...");
      delete box.dataset.url;
      button.disabled = true;
      return;
    }

    const url = buildWebinarUrl(refCode);
    box.textContent = url;
    box.dataset.url = url;
    button.disabled = false;
    button.textContent = text("📋 Webinar-Link kopieren", "📋 Copy webinar link");
  }

  async function copyWebinarLink() {
    const box = document.getElementById(LINK_ID);
    const button = document.getElementById(BUTTON_ID);
    const status = document.getElementById("referralStatus");
    const url = String(box?.dataset.url || "").trim();
    if (!url || !button) return;

    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    const normal = text("📋 Webinar-Link kopieren", "📋 Copy webinar link");
    button.textContent = text("✅ Link kopiert", "✅ Link copied");
    if (status) status.textContent = text("Persönlicher Webinar- und Aufzeichnungslink wurde kopiert.", "Personal webinar and replay link copied.");
    setTimeout(() => { button.textContent = normal; }, 1800);
  }

  function observeExistingLinks() {
    const targets = [document.getElementById("registrationReferralLink"), document.getElementById("landingpageReferralLink")].filter(Boolean);
    if (!targets.length || typeof MutationObserver !== "function") return;
    const observer = new MutationObserver(sync);
    targets.forEach(node => observer.observe(node, { childList: true, characterData: true, subtree: true }));
  }

  function refreshLanguage() {
    const wrapper = document.querySelector("[data-bi-partner-webinar-link]");
    if (wrapper) {
      const heading = wrapper.querySelector(".referral-link-heading");
      if (heading) heading.textContent = text("Webinar & Aufzeichnung – persönlicher Einladungslink", "Webinar & replay – personal invitation link");
    }
    sync();
  }

  function init() {
    if (!document.getElementById("referralSection")) return;
    ensureRow();
    sync();
    observeExistingLinks();
    window.addEventListener("bi:languagechange", refreshLanguage);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
