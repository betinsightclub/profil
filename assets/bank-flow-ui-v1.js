/* BetInsight Bank-Flow UI v1.0 · 2026-09-01
   UI-only enhancement for bank transfer confirmation and buyer purchase visibility.
   No Unit/account/Sheet mutations are implemented here except the explicit existing bank-report
   and seller-finalizer webhooks already protected server-side.
*/
(() => {
  "use strict";

  const BUYER_HISTORY_ENDPOINT = "https://hook.eu1.make.com/wqielna22hhc1e4j7jcy4m3mi4g1g89x";
  const BUYER_REPORT_ENDPOINT = "https://hook.eu1.make.com/r74qeeasiztm4w6e1d21ib59xhzq8yrr";
  const BUYER_STATUS_ENDPOINT = "https://hook.eu1.make.com/icmvtr3aakrc1aw46dwtmh844qprp4jn";
  const SELLER_CONFIRM_ENDPOINT = "https://hook.eu1.make.com/80tpoc4jceq3gj6fng5rm9i5w9ga3ygl";
  const STORAGE_KEY = "betinsight_active_purchase_reservation";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isBuyerPage = /\/wechselboerse\/angebote$/.test(path);
  const isSellerPage = /\/meine-verkaufsangebote$/.test(path);
  if (!isBuyerPage && !isSellerPage) return;

  const token = () => window.BetInsightSession?.getDashboardUuid?.() || "";
  const reqId = () => globalThis.crypto?.randomUUID?.() || (`req-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const number = (value, fallback = 0) => {
    if (typeof value === "string") value = value.replace(",", ".");
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const euro = value => number(value).toLocaleString("de-DE", {style:"currency", currency:"EUR", minimumFractionDigits:2});
  const units = value => number(value).toLocaleString("de-DE", {minimumFractionDigits:0, maximumFractionDigits:2});

  function installStyles() {
    if (document.getElementById("bi-bank-flow-ui-style")) return;
    const style = document.createElement("style");
    style.id = "bi-bank-flow-ui-style";
    style.textContent = `
      .bi-bank-modal{position:fixed;inset:0;z-index:10020;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(2,10,16,.76);backdrop-filter:blur(9px)}
      .bi-bank-modal.is-open{display:flex}.bi-bank-dialog{width:min(100%,560px);overflow:hidden;border:1px solid rgba(89,168,255,.28);border-radius:22px;background:linear-gradient(155deg,#102536,#091923);box-shadow:0 30px 90px rgba(0,0,0,.52)}
      .bi-bank-dialog-head{display:flex;align-items:flex-start;gap:13px;padding:22px 22px 15px}.bi-bank-dialog-icon{display:grid;flex:0 0 46px;height:46px;place-items:center;border:1px solid rgba(89,168,255,.3);border-radius:14px;background:rgba(89,168,255,.1);font-size:22px}
      .bi-bank-dialog-head h3{margin:1px 0 5px;color:#fff;font-size:21px}.bi-bank-dialog-head p{margin:0;color:#9eb4c4;font-size:13px;line-height:1.5}.bi-bank-dialog-body{padding:0 22px 20px}
      .bi-bank-summary{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:3px 0 14px}.bi-bank-summary-item{padding:12px 13px;border:1px solid rgba(145,166,183,.18);border-radius:12px;background:rgba(0,0,0,.15)}.bi-bank-summary-item.wide{grid-column:1/-1}.bi-bank-summary-item span{display:block;margin-bottom:5px;color:#8faabd;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.bi-bank-summary-item strong{display:block;color:#f7fbff;font-size:15px;overflow-wrap:anywhere}.bi-bank-summary-item.amount strong{color:#7ee9c5;font-size:22px}
      .bi-bank-warning{padding:13px 14px;border:1px solid rgba(255,200,87,.35);border-radius:12px;color:#ffe8b1;background:rgba(255,200,87,.075);font-size:12px;line-height:1.55}.bi-bank-warning strong{color:#fff1c9}
      .bi-bank-dialog-actions{display:flex;justify-content:flex-end;gap:10px;padding:15px 22px 21px;border-top:1px solid rgba(145,166,183,.14)}.bi-bank-btn{min-height:44px;padding:10px 16px;border:1px solid rgba(145,166,183,.22);border-radius:11px;color:#dce9f2;background:rgba(255,255,255,.04);font-weight:800;cursor:pointer}.bi-bank-btn.primary{border-color:rgba(37,230,167,.48);color:#031c14;background:linear-gradient(135deg,#25e6a7,#73efc8)}.bi-bank-btn:disabled{opacity:.55;cursor:not-allowed}
      .bi-bank-progress{display:none;margin:0 22px 20px;padding:12px 14px;border:1px solid rgba(89,168,255,.3);border-radius:11px;color:#d9efff;background:rgba(89,168,255,.07);font-size:12px;line-height:1.5}.bi-bank-progress.show{display:block}.bi-bank-progress.ok{border-color:rgba(37,230,167,.35);color:#caffed;background:rgba(37,230,167,.07)}.bi-bank-progress.error{border-color:rgba(255,107,125,.38);color:#ffd8de;background:rgba(255,107,125,.07)}
      .bi-purchases{margin-top:20px;padding:20px;border:1px solid rgba(80,168,214,.23);border-radius:18px;background:linear-gradient(145deg,rgba(13,43,59,.94),rgba(7,27,39,.96));box-shadow:0 16px 36px rgba(0,0,0,.2)}.bi-purchases-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:14px}.bi-purchases-head h3{margin:0 0 5px;color:#fff;font-size:21px}.bi-purchases-head p{margin:0;color:#85aabc;font-size:12px;line-height:1.5}.bi-purchases-refresh{min-height:38px;padding:8px 12px;border:1px solid rgba(80,168,214,.28);border-radius:10px;color:#d9efff;background:rgba(22,199,243,.06);font-weight:800;cursor:pointer}.bi-purchases-list{display:grid;gap:10px}.bi-purchase-row{display:grid;grid-template-columns:minmax(0,1.25fr) .7fr .75fr auto;align-items:center;gap:12px;padding:14px;border:1px solid rgba(80,168,214,.17);border-radius:13px;background:rgba(0,0,0,.12)}.bi-purchase-main strong{display:block;color:#fff;font-size:15px}.bi-purchase-main span,.bi-purchase-cell span{display:block;margin-top:4px;color:#85aabc;font-size:10px}.bi-purchase-cell strong{display:block;color:#edf8ff;font-size:13px}.bi-status{display:inline-flex;min-height:30px;align-items:center;padding:0 9px;border-radius:999px;font-size:10px;font-weight:900;white-space:nowrap}.bi-status.pending{color:#ffe8b1;border:1px solid rgba(255,200,87,.35);background:rgba(255,200,87,.08)}.bi-status.open{color:#d9efff;border:1px solid rgba(89,168,255,.35);background:rgba(89,168,255,.08)}.bi-status.done{color:#caffed;border:1px solid rgba(37,230,167,.35);background:rgba(37,230,167,.08)}.bi-status.closed{color:#d0dce5;border:1px solid rgba(145,166,183,.3);background:rgba(145,166,183,.06)}.bi-status.error{color:#ffd8de;border:1px solid rgba(255,107,125,.35);background:rgba(255,107,125,.07)}.bi-purchases-empty{padding:17px;border:1px dashed rgba(145,166,183,.25);border-radius:12px;color:#91a6b7;font-size:12px;text-align:center}.bi-purchases-more{display:flex;justify-content:center;margin-top:12px}.bi-purchases-more button{min-width:230px;min-height:42px;padding:9px 15px;border:1px solid rgba(22,199,243,.28);border-radius:10px;color:#d9f5ff;background:rgba(22,199,243,.06);font-weight:800;cursor:pointer}.bi-purchases-state{margin-top:8px;color:#85aabc;font-size:11px}.bi-purchases-state.error{color:#ffb8c1}
      @media(max-width:700px){.bi-bank-summary{grid-template-columns:1fr}.bi-bank-summary-item.wide{grid-column:auto}.bi-bank-dialog-actions{display:grid;grid-template-columns:1fr}.bi-bank-btn{width:100%}.bi-purchases-head{flex-direction:column}.bi-purchases-refresh{width:100%}.bi-purchase-row{grid-template-columns:1fr 1fr}.bi-purchase-main{grid-column:1/-1}.bi-status{justify-self:start}}
    `;
    document.head.appendChild(style);
  }

  function modal() {
    let root = document.getElementById("biBankModal");
    if (root) return root;
    root = document.createElement("div");
    root.id = "biBankModal";
    root.className = "bi-bank-modal";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.innerHTML = `<div class="bi-bank-dialog"><div class="bi-bank-dialog-head"><div class="bi-bank-dialog-icon">🏦</div><div><h3 id="biBankModalTitle">Bestätigung</h3><p id="biBankModalSub"></p></div></div><div class="bi-bank-dialog-body"><div id="biBankModalSummary" class="bi-bank-summary"></div><div id="biBankModalWarning" class="bi-bank-warning"></div></div><div id="biBankModalProgress" class="bi-bank-progress"></div><div class="bi-bank-dialog-actions"><button id="biBankModalCancel" class="bi-bank-btn" type="button">Abbrechen</button><button id="biBankModalConfirm" class="bi-bank-btn primary" type="button">Bestätigen</button></div></div>`;
    document.body.appendChild(root);
    root.addEventListener("click", e => { if (e.target === root) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("is-open")) closeModal(); });
    return root;
  }

  function closeModal() {
    const root = document.getElementById("biBankModal");
    if (!root || root.dataset.busy === "1") return;
    root.classList.remove("is-open");
  }

  function openModal({title, sub, summary, warning, confirmText, onConfirm}) {
    const root = modal();
    root.dataset.busy = "0";
    document.getElementById("biBankModalTitle").textContent = title;
    document.getElementById("biBankModalSub").textContent = sub;
    document.getElementById("biBankModalSummary").innerHTML = summary;
    document.getElementById("biBankModalWarning").innerHTML = warning;
    const progress = document.getElementById("biBankModalProgress");
    progress.className = "bi-bank-progress";
    progress.textContent = "";
    const cancel = document.getElementById("biBankModalCancel");
    const confirmButton = document.getElementById("biBankModalConfirm");
    cancel.disabled = false;
    confirmButton.disabled = false;
    confirmButton.textContent = confirmText;
    cancel.onclick = closeModal;
    confirmButton.onclick = async () => {
      root.dataset.busy = "1";
      cancel.disabled = true;
      confirmButton.disabled = true;
      confirmButton.textContent = "Wird sicher verarbeitet …";
      progress.className = "bi-bank-progress show";
      progress.textContent = "Sicherheitsprüfung läuft. Bitte diesen Vorgang nicht erneut starten.";
      try {
        await onConfirm(progress);
      } catch (e) {
        root.dataset.busy = "0";
        cancel.disabled = false;
        confirmButton.disabled = false;
        confirmButton.textContent = confirmText;
        progress.className = "bi-bank-progress show error";
        progress.textContent = e?.message || "Der Vorgang konnte nicht abgeschlossen werden.";
      }
    };
    root.classList.add("is-open");
  }

  async function postJson(endpoint, payload) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    const text = String(await response.text() || "").replace(/^\uFEFF/, "").trim();
    let data = {};
    try { data = JSON.parse(text || "{}"); } catch (_) { data = {message:text}; }
    if (!response.ok) {
      const error = new Error(data.message || "Die Anfrage konnte nicht abgeschlossen werden.");
      error.status = data.status || "";
      throw error;
    }
    return data;
  }

  function buyerState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (_) { return null; }
  }

  function enhanceBuyerConfirmation() {
    document.addEventListener("click", e => {
      const button = e.target.closest?.("#bankPaidButton");
      if (!button || button.disabled) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const state = buyerState();
      const dashboardToken = token();
      if (!state || state.paymentMethod !== "BANK" || !dashboardToken) return;
      const amount = document.getElementById("bankPayTotal")?.textContent?.trim() || "–";
      const booking = document.getElementById("bankBooking")?.textContent?.trim() || state.bookingNumber || "–";
      const unitText = document.getElementById("bankUnits")?.textContent?.trim() || "–";
      openModal({
        title: "Überweisung als gesendet melden",
        sub: "Dieser Schritt meldet nur deine Überweisung. Die Units werden noch nicht übertragen.",
        summary: `<div class="bi-bank-summary-item amount"><span>Überwiesener Betrag</span><strong>${esc(amount)}</strong></div><div class="bi-bank-summary-item"><span>Units</span><strong>${esc(unitText)}</strong></div><div class="bi-bank-summary-item wide"><span>Buchungsnummer / Verwendungszweck</span><strong>${esc(booking)}</strong></div>`,
        warning: `<strong>Bitte nur bestätigen, wenn du die Überweisung tatsächlich ausgeführt hast.</strong><br>Danach wartet BetInsight auf die Bestätigung des Verkäufers, dass der vollständige Betrag auf seinem echten Bankkonto eingegangen ist.`,
        confirmText: "Ja, Zahlung wurde gesendet",
        onConfirm: async progress => {
          const data = await postJson(BUYER_REPORT_ENDPOINT, {dashboard_token:dashboardToken, buchungsnummer:state.bookingNumber});
          progress.className = "bi-bank-progress show ok";
          progress.textContent = data.message || "Zahlung wurde gemeldet. Der Verkäufer prüft jetzt den Geldeingang.";
          const paidButton = document.getElementById("bankPaidButton");
          if (paidButton) { paidButton.disabled = true; paidButton.textContent = "Zahlung gemeldet – Verkäufer prüft"; }
          const timer = document.getElementById("bankTimer"); if (timer) timer.hidden = true;
          const result = document.getElementById("bankResult");
          if (result) { result.textContent = "Zahlung gemeldet. Verkäufer prüft den tatsächlichen Geldeingang."; result.className = "result-box visible warn"; }
          setTimeout(() => { const root=document.getElementById("biBankModal"); if(root){root.dataset.busy="0";root.classList.remove("is-open");} loadPurchases(true); }, 900);
          startBuyerCompletionPoll(state);
        }
      });
    }, true);
  }

  let buyerPoll = null;
  function startBuyerCompletionPoll(state) {
    clearInterval(buyerPoll);
    const check = async () => {
      try {
        const {status, message} = await postJson(BUYER_STATUS_ENDPOINT, {dashboard_token:state.token || token(), angebot_id:state.offerId});
        if (status === "bank_completed") {
          clearInterval(buyerPoll); buyerPoll = null;
          localStorage.removeItem(STORAGE_KEY);
          const paidButton = document.getElementById("bankPaidButton");
          if (paidButton) { paidButton.disabled = true; paidButton.textContent = "Abgeschlossen – Units gutgeschrieben"; }
          const result = document.getElementById("bankResult");
          if (result) { result.textContent = message || "Verkäufer hat den Geldeingang bestätigt. Die Units wurden gutgeschrieben."; result.className = "result-box visible ok"; }
          loadPurchases(true);
        }
      } catch (_) {}
    };
    check();
    buyerPoll = setInterval(check, 10000);
  }

  function enhanceSellerConfirmation() {
    document.addEventListener("click", e => {
      const button = e.target.closest?.("[data-bank-confirm]");
      if (!button || button.disabled) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const box = button.closest("[data-bank-status]");
      const text = box?.textContent || "";
      const bookingMatch = text.match(/BIK-[A-Z0-9-]+/i);
      const amountMatch = text.match(/(\d+[\.,]\d{2})\s*€/);
      const unitsMatch = button.textContent.match(/(\d+(?:[\.,]\d+)?)\s*Units/i);
      const booking = bookingMatch?.[0] || "";
      const amount = amountMatch ? `${amountMatch[1].replace(".", ",")} €` : "–";
      const unitCount = unitsMatch?.[1]?.replace(",", ".") || "0";
      if (!booking || !token()) return;
      openModal({
        title: "Geldeingang bestätigen",
        sub: "Dieser Schritt ist die verbindliche Freigabe für den Unit-Transfer.",
        summary: `<div class="bi-bank-summary-item amount"><span>Tatsächlich eingegangener Betrag</span><strong>${esc(amount)}</strong></div><div class="bi-bank-summary-item"><span>Übertragung</span><strong>${esc(units(unitCount))} Units</strong></div><div class="bi-bank-summary-item wide"><span>Buchungsnummer</span><strong>${esc(booking)}</strong></div>`,
        warning: `<strong>Bestätige ausschließlich den realen vollständigen Geldeingang auf deinem Bankkonto.</strong><br>Kein Screenshot, keine Zahlungsankündigung und keine Käufermeldung ersetzt den tatsächlichen Kontoeingang. Nach der Bestätigung wird der serverseitig reservierte Unit-Bestand einmalig an den Käufer übertragen.`,
        confirmText: `Geldeingang bestätigt – ${units(unitCount)} Units übertragen`,
        onConfirm: async progress => {
          const data = await postJson(SELLER_CONFIRM_ENDPOINT, {dashboard_token:token(), buchungsnummer:booking, request_id:reqId()});
          if (data.status !== "bank_transfer_completed" && data.status !== "bank_transfer_already_completed") throw new Error(data.message || "Der Bankverkauf konnte nicht abgeschlossen werden.");
          progress.className = "bi-bank-progress show ok";
          progress.textContent = data.status === "bank_transfer_completed" ? "Geldeingang bestätigt. Die Units wurden einmalig übertragen und der Verkauf abgeschlossen." : "Dieser Verkauf war bereits abgeschlossen. Es wurde kein zweiter Unit-Transfer ausgeführt.";
          setTimeout(() => location.reload(), 1100);
        }
      });
    }, true);
  }

  let purchases = [];
  let purchaseVisible = 3;
  let purchaseRefreshTimer = null;

  function statusInfo(status) {
    const s = String(status || "").toUpperCase();
    if (s === "ABGESCHLOSSEN") return {label:"Abgeschlossen – Units gutgeschrieben", cls:"done"};
    if (s === "TRANSFER_IN_PROGRESS") return {label:"Übertragung wird gebucht", cls:"pending"};
    if (s === "BANK_ZAHLUNG_GEMELDET") return {label:"Zahlung gemeldet – Verkäufer prüft", cls:"pending"};
    if (s === "RESERVIERT" || s === "KAUF_RESERVIERT") return {label:"Reserviert – Zahlung offen", cls:"open"};
    if (s === "ABGELAUFEN") return {label:"Abgelaufen", cls:"closed"};
    if (s === "STORNIERT") return {label:"Storniert", cls:"closed"};
    if (s.includes("FEHLER") || s.includes("BLOCK")) return {label:"Prüfung erforderlich", cls:"error"};
    return {label:s ? s.replaceAll("_", " ") : "Status offen", cls:"open"};
  }

  function isPending(status) {
    return ["RESERVIERT","KAUF_RESERVIERT","BANK_ZAHLUNG_GEMELDET","TRANSFER_IN_PROGRESS"].includes(String(status || "").toUpperCase());
  }

  function purchaseDate(row) {
    return row.completedAt || row.unitsTransferredAt || row.paymentReportedAt || row.reservedAt || "–";
  }

  function paymentLabel(row) {
    const method = String(row.paymentMethod || "").toUpperCase();
    if (method === "BANK") return "🏦 Banküberweisung";
    const coin = String(row.paymentCoin || "Krypto").toUpperCase();
    const network = String(row.paymentNetwork || "").toUpperCase();
    return `🪙 ${coin}${network ? ` · ${network}` : ""}`;
  }

  function purchaseTotal(row) {
    const base = number(row.saleValueEur);
    const fee = String(row.paymentMethod || "").toUpperCase() === "BANK" ? number(row.bankServiceEur, 1) : 0;
    return base + fee;
  }

  function ensurePurchasesSection() {
    if (document.getElementById("biPurchases")) return;
    const section = document.createElement("section");
    section.id = "biPurchases";
    section.className = "bi-purchases";
    section.innerHTML = `<div class="bi-purchases-head"><div><h3>🧾 Meine Käufe</h3><p>Deine letzten Wechselstuben-Käufe und ihr aktueller Bearbeitungsstatus.</p></div><button id="biPurchasesRefresh" class="bi-purchases-refresh" type="button">↻ Aktualisieren</button></div><div id="biPurchasesList" class="bi-purchases-list"><div class="bi-purchases-empty">Käufe werden geladen …</div></div><div id="biPurchasesMore" class="bi-purchases-more" hidden><button type="button">Weitere Käufe anzeigen</button></div><div id="biPurchasesState" class="bi-purchases-state">Nur Anzeige – diese Übersicht verändert keine Units.</div>`;
    const info = document.querySelector(".info-note");
    if (info) info.before(section); else document.querySelector("main")?.appendChild(section);
    document.getElementById("biPurchasesRefresh")?.addEventListener("click", () => loadPurchases(true));
    document.querySelector("#biPurchasesMore button")?.addEventListener("click", () => {purchaseVisible += 5; renderPurchases();});
  }

  function renderPurchases() {
    ensurePurchasesSection();
    const list = document.getElementById("biPurchasesList");
    const more = document.getElementById("biPurchasesMore");
    const state = document.getElementById("biPurchasesState");
    if (!list || !more || !state) return;
    if (!purchases.length) {
      list.innerHTML = '<div class="bi-purchases-empty">Noch keine Wechselstuben-Käufe vorhanden.</div>';
      more.hidden = true;
      state.className = "bi-purchases-state";
      state.textContent = "Nur Anzeige – diese Übersicht verändert keine Units.";
      return;
    }
    const shown = purchases.slice(0, purchaseVisible);
    list.innerHTML = shown.map(row => {
      const status = statusInfo(row.status);
      return `<article class="bi-purchase-row"><div class="bi-purchase-main"><strong>${esc(units(row.units))} Units · ${esc(paymentLabel(row))}</strong><span>${esc(row.bookingNumber || "–")} · ${esc(purchaseDate(row))}</span></div><div class="bi-purchase-cell"><strong>${esc(euro(purchaseTotal(row)))}</strong><span>${String(row.paymentMethod || "").toUpperCase()==="BANK" ? "inkl. Bank-Service" : "Zahlbetrag / Verkaufswert"}</span></div><div class="bi-purchase-cell"><strong>${esc(euro(row.unitPriceEur))}</strong><span>Preis je Unit</span></div><span class="bi-status ${status.cls}">${esc(status.label)}</span></article>`;
    }).join("");
    more.hidden = shown.length >= purchases.length;
    const pending = purchases.some(row => isPending(row.status));
    state.className = "bi-purchases-state";
    state.textContent = pending ? "Offener Vorgang erkannt – Status wird automatisch aktualisiert." : "Alle angezeigten Vorgänge sind abgeschlossen oder beendet.";
  }

  async function loadPurchases(resetVisible = false) {
    if (!isBuyerPage) return;
    ensurePurchasesSection();
    const state = document.getElementById("biPurchasesState");
    const refresh = document.getElementById("biPurchasesRefresh");
    if (refresh) refresh.disabled = true;
    try {
      const dashboardToken = token();
      if (!dashboardToken) throw new Error("Kein gültiger Dashboard-Zugang erkannt.");
      const data = await postJson(BUYER_HISTORY_ENDPOINT, {dashboard_token:dashboardToken});
      purchases = Array.isArray(data) ? data : (Array.isArray(data?.purchases) ? data.purchases : []);
      if (resetVisible) purchaseVisible = 3;
      renderPurchases();
      clearInterval(purchaseRefreshTimer);
      if (purchases.some(row => isPending(row.status))) purchaseRefreshTimer = setInterval(() => loadPurchases(false), 12000);
    } catch (e) {
      console.error(e);
      if (state) {state.className = "bi-purchases-state error"; state.textContent = "Kaufstatus konnte gerade nicht geladen werden. Bitte erneut aktualisieren.";}
    } finally {
      if (refresh) refresh.disabled = false;
    }
  }

  installStyles();
  modal();
  if (isBuyerPage) {
    enhanceBuyerConfirmation();
    ensurePurchasesSection();
    loadPurchases(true);
  }
  if (isSellerPage) enhanceSellerConfirmation();
})();
