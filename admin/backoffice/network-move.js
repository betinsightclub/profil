(() => {
  "use strict";

  const SESSION_KEY = "betinsight_admin_session_v1";
  const API_URL = "https://hook.eu1.make.com/gqt1nfypadrxrc6zdo944xthtuuraz9q";

  let previewState = null;

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function injectStyles() {
    if (document.getElementById("networkMoveStyles")) return;
    const style = document.createElement("style");
    style.id = "networkMoveStyles";
    style.textContent = `
      #masterNetworkMoveCard .nmove-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      #masterNetworkMoveCard .nmove-full{grid-column:1/-1}
      #masterNetworkMoveCard .nmove-field label{display:block;margin-bottom:6px;font-size:12px;font-weight:800;color:#b9d8e8}
      #masterNetworkMoveCard .nmove-field input,#masterNetworkMoveCard .nmove-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(185,216,232,.22);border-radius:10px;background:#071f2d;color:#fff;padding:10px 11px;outline:none}
      #masterNetworkMoveCard .nmove-field textarea{min-height:72px;resize:vertical}
      #masterNetworkMoveCard .nmove-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
      #masterNetworkMoveCard .nmove-preview{display:none;margin-top:14px;padding:14px;border:1px solid rgba(22,168,245,.28);border-radius:12px;background:rgba(22,168,245,.07)}
      #masterNetworkMoveCard .nmove-preview.visible{display:block}
      #masterNetworkMoveCard .nmove-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:11px}
      #masterNetworkMoveCard .nmove-stat{padding:10px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(185,216,232,.10)}
      #masterNetworkMoveCard .nmove-stat small{display:block;color:#8fb7c8;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
      #masterNetworkMoveCard .nmove-stat strong{display:block;color:#fff;font-size:13px;overflow-wrap:anywhere}
      #masterNetworkMoveCard .nmove-list{margin-top:12px;padding:0;list-style:none;display:grid;gap:6px;max-height:210px;overflow:auto}
      #masterNetworkMoveCard .nmove-list li{padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.035);border:1px solid rgba(185,216,232,.09);font-size:12px;color:#d9edf6}
      #masterNetworkMoveCard .nmove-warning{margin-top:12px;padding:11px 12px;border-radius:10px;border:1px solid rgba(255,218,118,.30);background:rgba(255,218,118,.08);color:#ffe59b;font-size:12px;line-height:1.5}
      #masterNetworkMoveCard .nmove-confirm{display:none;margin-top:12px;padding:11px 12px;border-radius:10px;border:1px solid rgba(255,125,134,.28);background:rgba(255,125,134,.07);color:#ffd4d8}
      #masterNetworkMoveCard .nmove-confirm.visible{display:block}
      #masterNetworkMoveCard .nmove-message{display:none;margin-top:12px;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,212,138,.25);background:rgba(0,212,138,.07);color:#b7f2dc}
      #masterNetworkMoveCard .nmove-message.visible{display:block}
      #masterNetworkMoveCard .nmove-message.error{border-color:rgba(255,125,134,.30);background:rgba(255,125,134,.08);color:#ffd0d4}
      #masterNetworkMoveCard .nmove-check{display:flex;gap:9px;align-items:flex-start;font-size:12px;line-height:1.45}
      #masterNetworkMoveCard .nmove-check input{margin-top:2px}
      @media(max-width:820px){#masterNetworkMoveCard .nmove-grid{grid-template-columns:1fr}#masterNetworkMoveCard .nmove-full{grid-column:1}#masterNetworkMoveCard .nmove-stats{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectCard() {
    const masterPanel = document.getElementById("tab-master");
    if (!masterPanel || document.getElementById("masterNetworkMoveCard")) return null;
    injectStyles();

    const card = document.createElement("article");
    card.className = "content-card full";
    card.id = "masterNetworkMoveCard";
    card.style.marginBottom = "16px";
    card.innerHTML = `
      <div class="panel-heading">
        <div>
          <h3>🌳 Netzwerkstruktur verschieben</h3>
          <p class="muted">Nur Master. Verschiebt einen Nutzer inklusive seiner kompletten bestehenden Downline unter einen neuen Sponsor oder in den POOL – ohne Neuregistrierung.</p>
        </div>
      </div>

      <div class="nmove-grid">
        <div class="nmove-field">
          <label for="nmoveRoot">Zu verschiebender Nutzer</label>
          <input id="nmoveRoot" type="text" autocomplete="off" placeholder="User-ID, BI-Code oder E-Mail">
        </div>
        <div class="nmove-field">
          <label for="nmoveSponsor">Neuer Sponsor</label>
          <input id="nmoveSponsor" type="text" autocomplete="off" placeholder="User-ID, BI-Code, E-Mail oder POOL">
        </div>
        <div class="nmove-actions nmove-full">
          <button class="button button-neutral" type="button" id="nmovePreviewButton">Vorschau prüfen</button>
        </div>
      </div>

      <div class="nmove-preview" id="nmovePreview">
        <strong>Vorschau · noch nichts verändert</strong>
        <div class="nmove-stats">
          <div class="nmove-stat"><small>Nutzer</small><strong id="nmoveRootInfo">–</strong></div>
          <div class="nmove-stat"><small>Alter Sponsor</small><strong id="nmoveOldSponsor">–</strong></div>
          <div class="nmove-stat"><small>Neuer Sponsor</small><strong id="nmoveNewSponsor">–</strong></div>
          <div class="nmove-stat"><small>Gesamter Ast</small><strong id="nmoveAffected">–</strong></div>
        </div>
        <ul class="nmove-list" id="nmoveAffectedList"></ul>
        <div class="nmove-warning">Bestehende Käufe, Units, Wallets, Premiumstatus und bereits entstandene Provisionen bleiben unverändert. Erst zukünftige Käufe bzw. zukünftige provisionsrelevante Ereignisse verwenden die neue Struktur.</div>
      </div>

      <div class="nmove-confirm" id="nmoveConfirmArea">
        <div class="nmove-grid">
          <div class="nmove-field">
            <label for="nmoveReason">Grund</label>
            <input id="nmoveReason" type="text" maxlength="160" placeholder="z. B. falsche Registrierung / POOL-Korrektur">
          </div>
          <div class="nmove-field nmove-full">
            <label for="nmoveNote">Interne Notiz · optional</label>
            <textarea id="nmoveNote" maxlength="800" placeholder="Warum wird der Ast verschoben?"></textarea>
          </div>
          <label class="nmove-check nmove-full">
            <input id="nmoveConfirmCheck" type="checkbox">
            <span>Ich habe alten Sponsor, neuen Sponsor und die Anzahl der betroffenen Nutzer geprüft. Mir ist bewusst, dass keine historischen Provisionen rückwirkend neu verteilt werden.</span>
          </label>
          <div class="nmove-actions nmove-full">
            <button class="button button-red" type="button" id="nmoveExecuteButton" disabled>Gesamten Ast verschieben</button>
          </div>
        </div>
      </div>

      <div class="nmove-message" id="nmoveMessage"></div>
    `;

    const anchor = document.getElementById("masterUnitCreditCard") || document.getElementById("masterWalletApprovalCard") || document.getElementById("masterCostBookCard");
    if (anchor) anchor.parentNode.insertBefore(card, anchor);
    else masterPanel.appendChild(card);

    document.getElementById("nmovePreviewButton")?.addEventListener("click", previewMove);
    document.getElementById("nmoveExecuteButton")?.addEventListener("click", executeMove);
    document.getElementById("nmoveConfirmCheck")?.addEventListener("change", syncExecuteButton);
    document.getElementById("nmoveReason")?.addEventListener("input", syncExecuteButton);
    ["nmoveRoot", "nmoveSponsor"].forEach(id => document.getElementById(id)?.addEventListener("input", invalidatePreview));
    return card;
  }

  function showMessage(text, error = false) {
    const el = document.getElementById("nmoveMessage");
    if (!el) return;
    el.textContent = text;
    el.classList.add("visible");
    el.classList.toggle("error", !!error);
  }

  function displayName(item) {
    if (!item) return "–";
    const label = item.name || item.email || item.ref_code || item.user_id || "–";
    const code = item.ref_code ? ` · ${item.ref_code}` : item.user_id ? ` · ${item.user_id}` : "";
    return `${label}${code}`;
  }

  function invalidatePreview() {
    previewState = null;
    document.getElementById("nmovePreview")?.classList.remove("visible");
    document.getElementById("nmoveConfirmArea")?.classList.remove("visible");
    const check = document.getElementById("nmoveConfirmCheck");
    if (check) check.checked = false;
    syncExecuteButton();
  }

  function syncExecuteButton() {
    const button = document.getElementById("nmoveExecuteButton");
    const checked = !!document.getElementById("nmoveConfirmCheck")?.checked;
    const reason = String(document.getElementById("nmoveReason")?.value || "").trim();
    if (button) button.disabled = !(previewState?.preview_token && checked && reason);
  }

  async function post(payload, timeoutMs = 20000) {
    const session = readSession();
    if (!isMaster(session) || !session.token) throw new Error("Master-Session ist nicht mehr gültig.");
    const sessionHash = await sha256Hex(session.token);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
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
      if (!response.ok || result.ok !== true) throw new Error(result.message || "Aktion konnte nicht sicher ausgeführt werden.");
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  async function previewMove() {
    const rootKey = String(document.getElementById("nmoveRoot")?.value || "").trim();
    const sponsorKey = String(document.getElementById("nmoveSponsor")?.value || "").trim();
    if (!rootKey || !sponsorKey) return showMessage("Bitte Nutzer und neuen Sponsor eingeben. Für den Firmenpool einfach POOL verwenden.", true);

    invalidatePreview();
    const button = document.getElementById("nmovePreviewButton");
    button.disabled = true;
    button.textContent = "Prüfe komplette Struktur …";
    showMessage("Struktur wird nur gelesen und geprüft …");

    try {
      const result = await post({ action: "preview", root_key: rootKey, new_sponsor_key: sponsorKey }, 25000);
      previewState = result;
      document.getElementById("nmoveRootInfo").textContent = displayName(result.root);
      document.getElementById("nmoveOldSponsor").textContent = displayName(result.old_sponsor);
      document.getElementById("nmoveNewSponsor").textContent = displayName(result.new_sponsor);
      document.getElementById("nmoveAffected").textContent = `${result.affected_count || 0} Nutzer · ${result.descendants_count || 0} darunter`;

      const list = document.getElementById("nmoveAffectedList");
      const preview = Array.isArray(result.affected_preview) ? result.affected_preview : [];
      list.innerHTML = preview.length
        ? preview.map(item => `<li>Ebene im Ast ${Number(item.depth || 0)} · <strong>${escapeHtml(item.ref_code || item.user_id)}</strong> · ${escapeHtml(item.name || "")}</li>`).join("")
        : "<li>Keine Detailvorschau verfügbar.</li>";
      if ((result.affected_count || 0) > preview.length) {
        list.insertAdjacentHTML("beforeend", `<li>… plus ${Number(result.affected_count) - preview.length} weitere Nutzer im Ast.</li>`);
      }

      document.getElementById("nmovePreview").classList.add("visible");
      document.getElementById("nmoveConfirmArea").classList.add("visible");
      showMessage("Vorschau geprüft. Noch wurde keine Struktur verändert.");
      syncExecuteButton();
    } catch (error) {
      previewState = null;
      const message = error?.name === "AbortError"
        ? "Die Vorschau hat zu lange gedauert. Es wurde nichts verändert; du kannst die Vorschau erneut laden."
        : (error?.message || String(error));
      showMessage(message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Vorschau prüfen";
    }
  }

  async function executeMove() {
    if (!previewState?.preview_token) return showMessage("Bitte zuerst eine neue Vorschau erstellen.", true);
    const rootKey = String(document.getElementById("nmoveRoot")?.value || "").trim();
    const sponsorKey = String(document.getElementById("nmoveSponsor")?.value || "").trim();
    const reason = String(document.getElementById("nmoveReason")?.value || "").trim();
    const note = String(document.getElementById("nmoveNote")?.value || "").trim();
    if (!reason) return showMessage("Bitte einen Grund angeben.", true);
    if (!document.getElementById("nmoveConfirmCheck")?.checked) return showMessage("Bitte die Sicherheitsbestätigung aktivieren.", true);

    const affected = Number(previewState.affected_count || 0);
    const question = `${displayName(previewState.root)} inklusive ${Math.max(0, affected - 1)} Downline-Nutzer wirklich unter ${displayName(previewState.new_sponsor)} verschieben?\n\nHistorische Provisionen werden NICHT rückwirkend verändert.`;
    if (!window.confirm(question)) return;

    const reqId = requestId();
    const button = document.getElementById("nmoveExecuteButton");
    button.disabled = true;
    button.textContent = "Verschiebe + prüfe …";
    showMessage(`Verschiebung wird verarbeitet. Request-ID: ${reqId}`);

    try {
      const result = await post({
        action: "execute",
        root_key: rootKey,
        new_sponsor_key: sponsorKey,
        preview_token: previewState.preview_token,
        request_id: reqId,
        reason,
        note
      }, 45000);
      showMessage(`Erfolgreich: ${result.affected_count || affected} Nutzer verschoben. Move-ID: ${result.move_id || "–"}. Historische Provisionen blieben unverändert.`);
      previewState = null;
      document.getElementById("nmovePreview")?.classList.remove("visible");
      document.getElementById("nmoveConfirmArea")?.classList.remove("visible");
      document.getElementById("nmoveReason").value = "";
      document.getElementById("nmoveNote").value = "";
      document.getElementById("nmoveConfirmCheck").checked = false;
    } catch (error) {
      const message = error?.name === "AbortError"
        ? `Die Antwort hat zu lange gedauert. NICHT sofort erneut verschieben. Bitte zuerst eine neue Vorschau laden; Request-ID war ${reqId}.`
        : (error?.message || String(error));
      showMessage(message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Gesamten Ast verschieben";
      syncExecuteButton();
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
