(() => {
  "use strict";

  const SESSION_KEY = "betinsight_admin_session_v1";
  const READ_API_URL = "https://hook.eu1.make.com/hvkixmp4n1ego6exgprjn6x04oe4a6fw";
  const APPROVAL_API_URL = "https://hook.eu1.make.com/9y0a7nvseam40tqie3jyu39qv62lynp9";

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function requestId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function parsePending(raw) {
    const text = String(raw || "").trim();
    if (!text) return [];
    return text.split("§").map(entry => {
      const p = entry.split("|");
      return {
        walletId: p[0] || "",
        adminId: p[1] || "",
        adminName: p[2] || "",
        currency: p[3] || "",
        network: p[4] || "",
        address: p[5] || "",
        walletStatus: p[6] || "",
        approvalStatus: p[7] || "",
        changedAt: p[8] || "",
        lockedUntil: p[9] || "",
        payoutMode: p[10] || "",
        personalMinimum: p[11] || "",
        systemMinimum: p[12] || "",
        autoAllowed: p[13] || ""
      };
    }).filter(item => item.walletId && item.adminId !== "ADM-001");
  }

  function formatMode(value) {
    const mode = String(value || "").toUpperCase();
    if (mode === "AUTOMATISCH") return "Automatisch";
    if (mode === "SAMMEL_5_15_25") return "Sammel 5./15./25.";
    return mode ? mode.replaceAll("_", " ") : "Noch nicht gewählt";
  }

  function formatMinimum(item) {
    const raw = item.personalMinimum || item.systemMinimum || "0";
    const number = Number(String(raw).replace(",", "."));
    return Number.isFinite(number)
      ? new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(number) + " €"
      : escapeHtml(raw) + " €";
  }

  function injectStyles() {
    if (document.getElementById("walletApprovalStyles")) return;
    const style = document.createElement("style");
    style.id = "walletApprovalStyles";
    style.textContent = `
      #masterWalletApprovalCard .wallet-approval-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
      #masterWalletApprovalCard .wallet-approval-badge{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,218,118,.35);background:rgba(255,218,118,.09);color:#ffe59b;font-size:12px;font-weight:900}
      #masterWalletApprovalCard .wallet-approval-table-wrap{overflow-x:auto;margin-top:14px}
      #masterWalletApprovalCard table{width:100%;border-collapse:collapse;min-width:980px}
      #masterWalletApprovalCard th,#masterWalletApprovalCard td{padding:10px 9px;text-align:left;border-bottom:1px solid rgba(185,216,232,.12);vertical-align:top}
      #masterWalletApprovalCard th{color:#9bcfe4;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
      #masterWalletApprovalCard td{font-size:13px;color:#fff}
      #masterWalletApprovalCard .wallet-address-full{font-family:Consolas,Monaco,monospace;overflow-wrap:anywhere;word-break:break-all;max-width:330px}
      #masterWalletApprovalCard .wallet-approval-actions{display:flex;gap:7px;flex-wrap:wrap}
      #masterWalletApprovalCard .wallet-approval-actions .button{min-height:36px;padding:8px 10px;font-size:12px}
      #masterWalletApprovalCard .wallet-approval-empty{padding:16px;border:1px solid rgba(0,212,138,.22);border-radius:11px;background:rgba(0,212,138,.06);color:#b9d8e8;margin-top:14px}
      #masterWalletApprovalCard .wallet-approval-message{margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(22,168,245,.08);border:1px solid rgba(22,168,245,.24);color:#cdefff}
      #masterWalletApprovalCard .wallet-approval-message.error{background:rgba(255,125,134,.08);border-color:rgba(255,125,134,.28);color:#ffd3d7}
    `;
    document.head.appendChild(style);
  }

  function injectCard() {
    const masterPanel = document.getElementById("tab-master");
    if (!masterPanel || document.getElementById("masterWalletApprovalCard")) return null;

    injectStyles();
    const card = document.createElement("article");
    card.className = "content-card full";
    card.id = "masterWalletApprovalCard";
    card.style.marginBottom = "16px";
    card.innerHTML = `
      <div class="wallet-approval-head">
        <div>
          <h3>🔐 Wallet-Freigaben</h3>
          <p class="muted">Neue oder geänderte Wallet-Adressen von Martin und Frank müssen hier vom Master freigegeben werden. Eine bestehende 24-Stunden-Sperre wird durch die Freigabe nicht verkürzt.</p>
        </div>
        <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
          <span class="wallet-approval-badge" id="walletApprovalCount">0 offen</span>
          <button class="button button-neutral" type="button" id="walletApprovalReload">Neu laden</button>
        </div>
      </div>
      <div id="walletApprovalContent" class="wallet-approval-empty">Wallet-Freigaben werden geladen …</div>
      <div id="walletApprovalMessage" class="wallet-approval-message" style="display:none"></div>
    `;

    const anchor = document.getElementById("masterCostBookCard");
    if (anchor) anchor.parentNode.insertBefore(card, anchor);
    else masterPanel.appendChild(card);

    document.getElementById("walletApprovalReload")?.addEventListener("click", loadPendingWalletApprovals);
    return card;
  }

  function showMessage(text, error = false) {
    const el = document.getElementById("walletApprovalMessage");
    if (!el) return;
    el.textContent = text;
    el.style.display = "block";
    el.classList.toggle("error", !!error);
  }

  function renderPending(items) {
    const content = document.getElementById("walletApprovalContent");
    const count = document.getElementById("walletApprovalCount");
    if (!content || !count) return;

    count.textContent = `${items.length} offen`;
    if (!items.length) {
      content.className = "wallet-approval-empty";
      content.innerHTML = "Aktuell gibt es keine offenen Wallet-Freigaben für Martin oder Frank.";
      return;
    }

    content.className = "wallet-approval-table-wrap";
    content.innerHTML = `
      <table>
        <thead><tr>
          <th>Admin</th><th>Route</th><th>Wallet-Adresse</th><th>Geändert</th><th>Sperre bis</th><th>Modus</th><th>Minimum</th><th>Aktion</th>
        </tr></thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><strong>${escapeHtml(item.adminName)}</strong><br><span class="muted">${escapeHtml(item.adminId)}</span></td>
              <td><strong>${escapeHtml(item.currency)}</strong><br><span class="muted">${escapeHtml(item.network)}</span></td>
              <td><div class="wallet-address-full privacy-sensitive">${escapeHtml(item.address)}</div></td>
              <td>${escapeHtml(item.changedAt || "–")}</td>
              <td>${escapeHtml(item.lockedUntil || "–")}</td>
              <td>${escapeHtml(formatMode(item.payoutMode))}</td>
              <td>${escapeHtml(formatMinimum(item))}</td>
              <td>
                <div class="wallet-approval-actions">
                  <button class="button button-green" type="button" data-wallet-action="approve" data-wallet-id="${escapeHtml(item.walletId)}" data-wallet-admin="${escapeHtml(item.adminName)}" data-wallet-route="${escapeHtml(item.currency + " / " + item.network)}">Genehmigen</button>
                  <button class="button button-red" type="button" data-wallet-action="reject" data-wallet-id="${escapeHtml(item.walletId)}" data-wallet-admin="${escapeHtml(item.adminName)}" data-wallet-route="${escapeHtml(item.currency + " / " + item.network)}">Ablehnen</button>
                </div>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;

    content.querySelectorAll("[data-wallet-action]").forEach(button => {
      button.addEventListener("click", () => submitDecision(button));
    });
  }

  async function loadPendingWalletApprovals() {
    const session = readSession();
    if (!isMaster(session) || !session.token) return;
    const content = document.getElementById("walletApprovalContent");
    if (content) {
      content.className = "wallet-approval-empty";
      content.textContent = "Wallet-Freigaben werden geladen …";
    }

    try {
      const sessionHash = await sha256Hex(session.token);
      const response = await fetch(READ_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "omit",
        body: JSON.stringify({ action: "load", session_hash: sessionHash })
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || String(result.role || "").toUpperCase() !== "MASTER") {
        throw new Error(result.message || "Master-Daten konnten nicht geladen werden.");
      }
      renderPending(parsePending(result.pending_wallet_approvals_raw));
    } catch (error) {
      renderPending([]);
      showMessage(error?.message || String(error), true);
    }
  }

  async function submitDecision(button) {
    const action = button.dataset.walletAction;
    const walletId = button.dataset.walletId;
    const adminName = button.dataset.walletAdmin || "Admin";
    const route = button.dataset.walletRoute || "Wallet";
    if (!walletId || !["approve", "reject"].includes(action)) return;

    const wording = action === "approve" ? "genehmigen" : "ablehnen";
    if (!window.confirm(`${route} von ${adminName} wirklich ${wording}?`)) return;

    const session = readSession();
    if (!isMaster(session) || !session.token) {
      showMessage("Master-Session ist nicht mehr gültig.", true);
      return;
    }

    const allButtons = document.querySelectorAll("#masterWalletApprovalCard [data-wallet-action]");
    allButtons.forEach(el => { el.disabled = true; });
    showMessage(action === "approve" ? "Wallet wird genehmigt …" : "Wallet wird abgelehnt …");

    try {
      const sessionHash = await sha256Hex(session.token);
      const response = await fetch(APPROVAL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "omit",
        body: JSON.stringify({
          action,
          session_hash: sessionHash,
          wallet_id: walletId,
          request_id: requestId()
        })
      });
      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch (_) {}
      if (!response.ok || result.ok !== true) {
        throw new Error(result.message || "Wallet-Entscheidung konnte nicht gespeichert werden.");
      }
      showMessage(result.message || (action === "approve" ? "Wallet wurde genehmigt." : "Wallet wurde abgelehnt."));
      await loadPendingWalletApprovals();
    } catch (error) {
      showMessage(error?.message || String(error), true);
    } finally {
      document.querySelectorAll("#masterWalletApprovalCard [data-wallet-action]").forEach(el => { el.disabled = false; });
    }
  }

  function start() {
    const session = readSession();
    if (!isMaster(session)) return;
    const card = injectCard();
    if (!card) return;
    loadPendingWalletApprovals();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();