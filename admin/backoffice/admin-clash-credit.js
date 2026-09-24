(() => {
  "use strict";

  const SESSION_KEY = "betinsight_admin_session_v1";
  const API_URL = "https://lszlaglwlixejzytrurg.supabase.co/functions/v1/admin-clash-credit";

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
    return !!session &&
      (String(session.master || "").toUpperCase() === "JA" ||
       String(session.role || "").toUpperCase() === "MASTER");
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
    return crypto.randomUUID ? crypto.randomUUID() : `clash-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function parseInteger(value) {
    const n = Number(String(value ?? "").trim());
    return Number.isInteger(n) ? n : NaN;
  }

  function formatTokens(value) {
    const n = Number(value);
    return Number.isFinite(n)
      ? new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(n)
      : "–";
  }

  function injectStyles() {
    if (document.getElementById("adminClashCreditStyles")) return;
    const style = document.createElement("style");
    style.id = "adminClashCreditStyles";
    style.textContent = `
      #masterClashCreditCard .acc-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(160px,.55fr);gap:12px}
      #masterClashCreditCard .acc-full{grid-column:1/-1}
      #masterClashCreditCard .acc-field label{display:block;margin-bottom:6px;font-size:12px;font-weight:800;color:#b9d8e8}
      #masterClashCreditCard .acc-field input,#masterClashCreditCard .acc-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(185,216,232,.22);border-radius:10px;background:#071f2d;color:#fff;padding:10px 11px;outline:none}
      #masterClashCreditCard .acc-field textarea{min-height:74px;resize:vertical}
      #masterClashCreditCard .acc-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
      #masterClashCreditCard .acc-preview{display:none;margin-top:14px;padding:13px;border:1px solid rgba(247,198,78,.28);border-radius:12px;background:rgba(247,198,78,.07)}
      #masterClashCreditCard .acc-preview.visible{display:block}
      #masterClashCreditCard .acc-preview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}
      #masterClashCreditCard .acc-stat{padding:10px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(185,216,232,.10)}
      #masterClashCreditCard .acc-stat small{display:block;color:#8fb7c8;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
      #masterClashCreditCard .acc-stat strong{display:block;color:#fff;font-size:14px;overflow-wrap:anywhere}
      #masterClashCreditCard .acc-message{display:none;margin-top:12px;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,212,138,.25);background:rgba(0,212,138,.07);color:#b7f2dc}
      #masterClashCreditCard .acc-message.visible{display:block}
      #masterClashCreditCard .acc-message.error{border-color:rgba(255,125,134,.30);background:rgba(255,125,134,.08);color:#ffd0d4}
      #masterClashCreditCard .acc-warning{margin-top:10px;color:#ffe59b;font-size:12px;line-height:1.45}
      @media(max-width:760px){#masterClashCreditCard .acc-grid{grid-template-columns:1fr}#masterClashCreditCard .acc-preview-grid{grid-template-columns:1fr 1fr}.acc-full{grid-column:1!important}}
    `;
    document.head.appendChild(style);
  }

  function injectCard() {
    const masterPanel = document.getElementById("tab-master");
    if (!masterPanel || document.getElementById("masterClashCreditCard")) return null;
    injectStyles();

    const card = document.createElement("article");
    card.className = "content-card full";
    card.id = "masterClashCreditCard";
    card.style.marginBottom = "16px";
    card.innerHTML = `
      <div class="panel-heading">
        <div>
          <h3>⚔️ Clash-Token verschenken</h3>
          <p class="muted">Nur Master. Die Gutschrift erhöht ausschließlich das dauerhafte TIME-CLASH-Spielguthaben. Units, FIFO, Referral, Premium und Wechselstube bleiben unverändert.</p>
        </div>
      </div>

      <div class="acc-grid">
        <div class="acc-field acc-full">
          <label for="accUserKey">Empfänger · User-ID oder E-Mail</label>
          <input id="accUserKey" type="text" autocomplete="off" placeholder="z. B. 260000000 oder name@example.com">
        </div>
        <div class="acc-actions acc-full">
          <button class="button button-neutral" type="button" id="accLookupButton">Nutzer prüfen</button>
        </div>
      </div>

      <div class="acc-preview" id="accPreview">
        <strong id="accPreviewTitle">Nutzer gefunden</strong>
        <div class="acc-preview-grid">
          <div class="acc-stat"><small>User-ID</small><strong id="accPreviewUserId">–</strong></div>
          <div class="acc-stat"><small>E-Mail</small><strong id="accPreviewEmail">–</strong></div>
          <div class="acc-stat"><small>Dauerhafte Clash-Token</small><strong id="accPreviewPermanent">–</strong></div>
          <div class="acc-stat"><small>Gespeichertes Spielguthaben</small><strong id="accPreviewTotal">–</strong></div>
        </div>
      </div>

      <div class="acc-grid" style="margin-top:14px">
        <div class="acc-field">
          <label for="accTokens">Clash-Token · ganze Zahl</label>
          <input id="accTokens" type="number" min="1" max="10000" step="1" inputmode="numeric" placeholder="z. B. 5 oder 20">
        </div>
        <div class="acc-field">
          <label for="accReason">Grund</label>
          <input id="accReason" type="text" maxlength="120" placeholder="z. B. Gewinnspiel / Kulanz / Bonus">
        </div>
        <div class="acc-field acc-full">
          <label for="accNote">Notiz · optional</label>
          <textarea id="accNote" maxlength="500" placeholder="Interne Notiz zur Clash-Token-Gutschrift"></textarea>
        </div>
        <div class="acc-actions acc-full">
          <button class="button button-green" type="button" id="accCreditButton" disabled>Clash-Token gutschreiben</button>
        </div>
      </div>

      <div class="acc-warning">Clash-Token werden als dauerhaftes Spielguthaben gutgeschrieben und verfallen nicht beim Wochenwechsel. Jede Buchung ist per Request-ID gegen Doppelklick geschützt und wird separat protokolliert.</div>
      <div class="acc-message" id="accMessage"></div>
    `;

    const unitCard = document.getElementById("masterUnitCreditCard");
    const walletCard = document.getElementById("masterWalletApprovalCard");
    if (unitCard?.parentNode) unitCard.parentNode.insertBefore(card, unitCard.nextSibling);
    else if (walletCard?.parentNode) walletCard.parentNode.insertBefore(card, walletCard);
    else masterPanel.appendChild(card);

    document.getElementById("accLookupButton")?.addEventListener("click", lookupUser);
    document.getElementById("accCreditButton")?.addEventListener("click", creditTokens);
    document.getElementById("accUserKey")?.addEventListener("input", () => {
      resolvedUser = null;
      const credit = document.getElementById("accCreditButton");
      if (credit) credit.disabled = true;
      document.getElementById("accPreview")?.classList.remove("visible");
    });
    return card;
  }

  function showMessage(text, error = false) {
    const el = document.getElementById("accMessage");
    if (!el) return;
    el.textContent = text;
    el.classList.add("visible");
    el.classList.toggle("error", !!error);
  }

  async function post(payload) {
    const session = readSession();
    if (!isMaster(session) || !session?.token) throw new Error("Master-Session ist nicht mehr gültig.");

    const sessionHash = await sha256Hex(session.token);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

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

      if (!response.ok || result.ok !== true) {
        throw new Error(result.message || "Aktion konnte nicht ausgeführt werden.");
      }
      return result;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Keine Antwort vom Clash-Token-System. Es wurde nichts erneut ausgelöst.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function lookupUser() {
    const input = document.getElementById("accUserKey");
    const button = document.getElementById("accLookupButton");
    const userKey = String(input?.value || "").trim();
    if (!userKey) return showMessage("Bitte zuerst User-ID oder E-Mail eingeben.", true);

    resolvedUser = null;
    const creditButton = document.getElementById("accCreditButton");
    if (creditButton) creditButton.disabled = true;
    button.disabled = true;
    button.textContent = "Prüfe …";
    showMessage("Nutzer und Clash-Konto werden geprüft …");

    try {
      const result = await post({ action: "lookup", user_key: userKey });
      if (!result.user_id || !result.email) throw new Error("Kein eindeutiger Nutzer gefunden.");

      resolvedUser = result;
      document.getElementById("accPreviewTitle").textContent = result.name ? `Gefunden: ${result.name}` : "Nutzer gefunden";
      document.getElementById("accPreviewUserId").textContent = result.user_id;
      document.getElementById("accPreviewEmail").textContent = result.email;
      document.getElementById("accPreviewPermanent").textContent = formatTokens(result.permanent_tokens);
      document.getElementById("accPreviewTotal").textContent = result.balance_exists ? formatTokens(result.stored_total) : "noch kein Clash-Konto";
      document.getElementById("accPreview").classList.add("visible");
      creditButton.disabled = false;
      showMessage("Empfänger geprüft. Noch wurde nichts gebucht.");
    } catch (error) {
      document.getElementById("accPreview")?.classList.remove("visible");
      showMessage(error?.message || String(error), true);
    } finally {
      button.disabled = false;
      button.textContent = "Nutzer prüfen";
    }
  }

  async function creditTokens() {
    if (!resolvedUser?.user_id) return showMessage("Bitte den Empfänger zuerst erneut prüfen.", true);

    const amount = parseInteger(document.getElementById("accTokens")?.value);
    const reason = String(document.getElementById("accReason")?.value || "").trim();
    const note = String(document.getElementById("accNote")?.value || "").trim();

    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
      return showMessage("Bitte eine ganze Clash-Token-Zahl zwischen 1 und 10.000 eingeben.", true);
    }
    if (!reason) return showMessage("Bitte einen Grund für die Gutschrift eintragen.", true);

    const confirmText = `${formatTokens(amount)} dauerhafte Clash-Token an ${resolvedUser.email} (User ${resolvedUser.user_id}) gutschreiben?`;
    if (!window.confirm(confirmText)) return;

    const button = document.getElementById("accCreditButton");
    button.disabled = true;
    button.textContent = "Buche …";
    showMessage("Clash-Token werden verarbeitet …");

    try {
      const result = await post({
        action: "credit",
        user_key: String(resolvedUser.user_id),
        tokens: amount,
        grund: reason,
        notiz: note,
        request_id: requestId()
      });

      showMessage(
        result.duplicate
          ? "Diese Gutschrift wurde bereits verarbeitet. Es wurde nichts doppelt gebucht."
          : `${formatTokens(result.tokens)} Clash-Token erfolgreich gutgeschrieben. Neuer dauerhafter Stand: ${formatTokens(result.permanent_after)}.`
      );

      document.getElementById("accTokens").value = "";
      document.getElementById("accReason").value = "";
      document.getElementById("accNote").value = "";
      await lookupUser();
    } catch (error) {
      showMessage(error?.message || String(error), true);
    } finally {
      button.disabled = false;
      button.textContent = "Clash-Token gutschreiben";
    }
  }

  function start() {
    const session = readSession();
    if (!isMaster(session)) return;
    injectCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
