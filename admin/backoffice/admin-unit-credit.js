(() => {
  "use strict";

  const SESSION_KEY = "betinsight_admin_session_v1";
  const API_URL = "https://hook.eu1.make.com/87429uw78qxd9qhu5zttbxn9qfur0ys1";

  let resolvedUser = null;

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function isMaster(session) {
    return !!session && (String(session.master || "").toUpperCase() === "JA" || String(session.role || "").toUpperCase() === "MASTER");
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(String(text || ""));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(digest));
  }

  function requestId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function parseNumber(value) {
    const n = Number(String(value ?? "").trim().replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }

  function formatUnits(value) {
    const n = parseNumber(value);
    if (!Number.isFinite(n)) return String(value ?? "–");
    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
  }

  function injectStyles() {
    if (document.getElementById("adminUnitCreditStyles")) return;
    const style = document.createElement("style");
    style.id = "adminUnitCreditStyles";
    style.textContent = `
      #masterUnitCreditCard .auc-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(160px,.55fr);gap:12px}
      #masterUnitCreditCard .auc-full{grid-column:1/-1}
      #masterUnitCreditCard .auc-field label{display:block;margin-bottom:6px;font-size:12px;font-weight:800;color:#b9d8e8}
      #masterUnitCreditCard .auc-field input,#masterUnitCreditCard .auc-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(185,216,232,.22);border-radius:10px;background:#071f2d;color:#fff;padding:10px 11px;outline:none}
      #masterUnitCreditCard .auc-field textarea{min-height:74px;resize:vertical}
      #masterUnitCreditCard .auc-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
      #masterUnitCreditCard .auc-preview{display:none;margin-top:14px;padding:13px;border:1px solid rgba(22,168,245,.24);border-radius:12px;background:rgba(22,168,245,.07)}
      #masterUnitCreditCard .auc-preview.visible{display:block}
      #masterUnitCreditCard .auc-preview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}
      #masterUnitCreditCard .auc-stat{padding:10px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(185,216,232,.10)}
      #masterUnitCreditCard .auc-stat small{display:block;color:#8fb7c8;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
      #masterUnitCreditCard .auc-stat strong{display:block;color:#fff;font-size:14px;overflow-wrap:anywhere}
      #masterUnitCreditCard .auc-message{display:none;margin-top:12px;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,212,138,.25);background:rgba(0,212,138,.07);color:#b7f2dc}
      #masterUnitCreditCard .auc-message.visible{display:block}
      #masterUnitCreditCard .auc-message.error{border-color:rgba(255,125,134,.30);background:rgba(255,125,134,.08);color:#ffd0d4}
      #masterUnitCreditCard .auc-warning{margin-top:10px;color:#ffe59b;font-size:12px;line-height:1.45}
      @media(max-width:760px){#masterUnitCreditCard .auc-grid{grid-template-columns:1fr}#masterUnitCreditCard .auc-preview-grid{grid-template-columns:1fr 1fr}.auc-full{grid-column:1!important}}
    `;
    document.head.appendChild(style);
  }

  function injectCard() {
    const masterPanel = document.getElementById("tab-master");
    if (!masterPanel || document.getElementById("masterUnitCreditCard")) return null;
    injectStyles();

    const card = document.createElement("article");
    card.className = "content-card full";
    card.id = "masterUnitCreditCard";
    card.style.marginBottom = "16px";
    card.innerHTML = `
      <div class="panel-heading">
        <div>
          <h3>🎁 Units manuell gutschreiben</h3>
          <p class="muted">Nur Master. Die Gutschrift läuft ausschließlich als Geschenk-Units und verändert keine Kauf-, Referral-, FIFO- oder Wechselstubenlogik.</p>
        </div>
      </div>

      <div class="auc-grid">
        <div class="auc-field auc-full">
          <label for="aucUserKey">Empfänger · User-ID oder E-Mail</label>
          <input id="aucUserKey" type="text" autocomplete="off" placeholder="z. B. 260000000 oder name@example.com">
        </div>
        <div class="auc-actions auc-full">
          <button class="button button-neutral" type="button" id="aucLookupButton">Nutzer prüfen</button>
        </div>
      </div>

      <div class="auc-preview" id="aucPreview">
        <strong id="aucPreviewTitle">Nutzer gefunden</strong>
        <div class="auc-preview-grid">
          <div class="auc-stat"><small>User-ID</small><strong id="aucPreviewUserId">–</strong></div>
          <div class="auc-stat"><small>E-Mail</small><strong id="aucPreviewEmail">–</strong></div>
          <div class="auc-stat"><small>Geschenk-Units</small><strong id="aucPreviewGift">–</strong></div>
          <div class="auc-stat"><small>Einsetzbare Units</small><strong id="aucPreviewUsable">–</strong></div>
        </div>
      </div>

      <div class="auc-grid" style="margin-top:14px">
        <div class="auc-field">
          <label for="aucUnits">Units · frei wählbar</label>
          <input id="aucUnits" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="z. B. 10 oder 27,5">
        </div>
        <div class="auc-field">
          <label for="aucReason">Grund · frei wählbar</label>
          <input id="aucReason" type="text" maxlength="120" placeholder="z. B. Webinar-Gewinn">
        </div>
        <div class="auc-field auc-full">
          <label for="aucNote">Notiz · optional</label>
          <textarea id="aucNote" maxlength="500" placeholder="Interne Notiz zur Gutschrift"></textarea>
        </div>
        <div class="auc-actions auc-full">
          <button class="button button-green" type="button" id="aucCreditButton" disabled>Units gutschreiben</button>
        </div>
      </div>

      <div class="auc-warning">Vor jeder Buchung wird der Empfänger angezeigt und die genaue Unit-Zahl nochmals bestätigt. Jede Buchung erhält eine eindeutige Request-ID und wird separat protokolliert.</div>
      <div class="auc-message" id="aucMessage"></div>
    `;

    const anchor = document.getElementById("masterWalletApprovalCard") || document.getElementById("masterCostBookCard");
    if (anchor) anchor.parentNode.insertBefore(card, anchor);
    else masterPanel.appendChild(card);

    document.getElementById("aucLookupButton")?.addEventListener("click", lookupUser);
    document.getElementById("aucCreditButton")?.addEventListener("click", creditUnits);
    document.getElementById("aucUserKey")?.addEventListener("input", () => {
      resolvedUser = null;
      document.getElementById("aucCreditButton").disabled = true;
      document.getElementById("aucPreview").classList.remove("visible");
    });
    return card;
  }

  function showMessage(text, error = false) {
    const el = document.getElementById("aucMessage");
    if (!el) return;
    el.textContent = text;
    el.classList.add("visible");
    el.classList.toggle("error", !!error);
  }

  async function post(payload) {
    const session = readSession();
    if (!isMaster(session) || !session.token) throw new Error("Master-Session ist nicht mehr gültig.");
    const sessionHash = await sha256Hex(session.token);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
        body: JSON.stringify({ ...payload, session_hash: sessionHash })
      });
      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch (_) {}
      if (!response.ok || result.ok !== true) throw new Error(result.message || "Aktion konnte nicht ausgeführt werden.");
      return result;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Keine Antwort vom Gutschrift-System. Es wurde nichts erneut ausgelöst.");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function lookupUser() {
    const input = document.getElementById("aucUserKey");
    const button = document.getElementById("aucLookupButton");
    const userKey = String(input?.value || "").trim();
    if (!userKey) return showMessage("Bitte zuerst User-ID oder E-Mail eingeben.", true);

    resolvedUser = null;
    document.getElementById("aucCreditButton").disabled = true;
    button.disabled = true;
    button.textContent = "Prüfe …";
    showMessage("Nutzer wird geprüft …");

    try {
      const result = await post({ action: "lookup", user_key: userKey });
      if (!result.user_id || !result.email) throw new Error("Kein eindeutiger Nutzer gefunden.");
      resolvedUser = result;
      document.getElementById("aucPreviewTitle").textContent = result.name ? `Gefunden: ${result.name}` : "Nutzer gefunden";
      document.getElementById("aucPreviewUserId").textContent = result.user_id;
      document.getElementById("aucPreviewEmail").textContent = result.email;
      document.getElementById("aucPreviewGift").textContent = formatUnits(result.geschenk_units);
      document.getElementById("aucPreviewUsable").textContent = formatUnits(result.einsetzbare_units);
      document.getElementById("aucPreview").classList.add("visible");
      document.getElementById("aucCreditButton").disabled = false;
      showMessage("Empfänger geprüft. Noch wurde nichts gebucht.");
    } catch (error) {
      document.getElementById("aucPreview").classList.remove("visible");
      showMessage(error?.message || String(error), true);
    } finally {
      button.disabled = false;
      button.textContent = "Nutzer prüfen";
    }
  }

  async function creditUnits() {
    if (!resolvedUser?.user_id) return showMessage("Bitte den Empfänger zuerst erneut prüfen.", true);

    const amount = parseNumber(document.getElementById("aucUnits")?.value);
    const reason = String(document.getElementById("aucReason")?.value || "").trim();
    const note = String(document.getElementById("aucNote")?.value || "").trim();
    if (!Number.isFinite(amount) || amount <= 0) return showMessage("Bitte eine positive Unit-Zahl eingeben.", true);
    if (!reason) return showMessage("Bitte einen Grund für die Gutschrift eintragen.", true);

    const confirmText = `${formatUnits(amount)} Units an ${resolvedUser.email} (User ${resolvedUser.user_id}) als Geschenk-Units gutschreiben?`;
    if (!window.confirm(confirmText)) return;

    const button = document.getElementById("aucCreditButton");
    button.disabled = true;
    button.textContent = "Buche …";
    showMessage("Gutschrift wird verarbeitet …");

    try {
      const result = await post({
        action: "credit",
        user_key: String(resolvedUser.user_id),
        units: amount,
        grund: reason,
        notiz: note,
        request_id: requestId()
      });
      showMessage(`${formatUnits(result.units)} Units erfolgreich gutgeschrieben. Neuer Stand einsetzbar: ${formatUnits(result.einsetzbar_nachher)} Units.`);
      document.getElementById("aucUnits").value = "";
      document.getElementById("aucReason").value = "";
      document.getElementById("aucNote").value = "";
      await lookupUser();
    } catch (error) {
      showMessage(error?.message || String(error), true);
    } finally {
      button.disabled = false;
      button.textContent = "Units gutschreiben";
    }
  }

  function start() {
    const session = readSession();
    if (!isMaster(session)) return;
    injectCard();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
