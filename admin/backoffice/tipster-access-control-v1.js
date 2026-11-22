(function () {
  "use strict";
  const MODULE_ID = "biTipsterAccessControl";
  const SESSION_KEY = "betinsight_admin_session_v1";
  const API_URL = "https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-tipster-access";
  let busy = false;
  let lastList = [];

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
    catch (_) { return null; }
  }
  function isMaster(s) {
    return !!s && !!s.token &&
      (String(s.role || "").toUpperCase() === "MASTER" ||
       String(s.master || "").toUpperCase() === "JA");
  }
  async function sha256Hex(value) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
    return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("");
  }
  async function request(action, extra) {
    const session = readSession();
    if (!isMaster(session)) throw new Error("Nur der Master darf Zugänge steuern.");
    const hash = await sha256Hex(session.token);
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({}, extra || {}, { action: action, session_hash: hash }))
    });
    let data;
    try { data = await response.json(); }
    catch (_) { throw new Error("Der Zugangsserver hat keine gültige Antwort geliefert."); }
    if (!response.ok || !data || data.ok !== true) {
      const messages = {
        INVALID_SESSION: "Deine Master-Sitzung ist abgelaufen. Bitte erneut anmelden.",
        MASTER_REQUIRED: "Nur der Master darf Tippgeber-Zugänge ändern.",
        TIPSTER_NOT_FOUND: "Das Tippgeberkonto existiert nicht mehr.",
        REQUEST_ALREADY_USED: "Dieser Vorgang wurde bereits bearbeitet.",
        RATE_LIMITED: "Zu viele Anfragen. Bitte später erneut versuchen."
      };
      throw new Error(messages[String(data && data.error || "")] ||
        String(data && data.message || data && data.error || "Zugang konnte nicht geändert werden."));
    }
    return data;
  }
  function makeElement(tag, cls, content) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content != null) el.textContent = String(content);
    return el;
  }
  function displayMessage(message, error) {
    const el = document.getElementById("biAccessFeedback");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("error", !!error);
    el.setAttribute("role", error ? "alert" : "status");
  }
  function updateBusy(state) {
    busy = !!state;
    const card = document.getElementById(MODULE_ID);
    if (card) card.querySelectorAll("button").forEach(btn => { btn.disabled = busy; });
  }
  function showAccounts(items) {
    const wrap = document.getElementById("biAccessRows");
    if (!wrap) return;
    lastList = Array.isArray(items) ? items : [];
    wrap.replaceChildren();
    if (!lastList.length) {
      wrap.appendChild(makeElement("p", "bi-access-empty", "Noch keine Tippgeberkonten angelegt."));
      return;
    }
    lastList.forEach(item => {
      const active = item.access_active === true;
      const row = makeElement("div", "bi-access-row");
      const person = makeElement("div", "bi-access-person");
      person.appendChild(makeElement("strong", "", item.name || item.admin_id || "Tippgeber"));
      person.appendChild(makeElement("small", "", String(item.admin_id || "") +
        " · Tippabgabe: " + (item.tips_allowed === true ? "separat freigegeben" : "separat gesperrt")));
      const control = makeElement("div", "bi-access-control");
      const status = makeElement("span", "bi-access-status " + (active ? "on" : "off"),
        active ? "Zugang AN" : "Zugang AUS");
      const button = makeElement("button", "bi-access-switch " + (active ? "on" : "off"),
        active ? "Zugang ausschalten" : "Zugang einschalten");
      button.type = "button";
      button.setAttribute("aria-label", (active ? "Zugang für " + (item.name || item.admin_id) +
        " ausschalten" : "Zugang für " + (item.name || item.admin_id) + " einschalten"));
      button.setAttribute("aria-pressed", String(active));
      button.addEventListener("click", () => setAccess(item, !active));
      control.append(status, button);
      row.append(person, control);
      wrap.appendChild(row);
    });
  }
  async function loadAccounts(silent) {
    if (busy) return;
    updateBusy(true);
    if (!silent) displayMessage("Zugänge werden aktuell geladen …");
    try {
      const out = await request("list");
      showAccounts(out.tipsters);
      if (!silent) displayMessage("Aktueller Stand geladen. Die Liste ergänzt künftige Tippgeber automatisch.");
    } catch (e) {
      displayMessage(e && e.message || "Zugänge konnten nicht geladen werden.", true);
    } finally {
      updateBusy(false);
    }
  }
  async function setAccess(item, active) {
    if (busy) return;
    const name = String(item.name || item.admin_id || "Tippgeber");
    const question = active
      ? name + " wieder für beide Backoffice-Anmeldungen freigeben? Seine Tippabgabe- und Provisionsregeln bleiben unverändert."
      : name + " für beide Backoffice-Anmeldungen sperren? Alle offenen Sitzungen dieses Kontos werden sofort beendet.";
    if (!window.confirm(question)) return;
    updateBusy(true);
    displayMessage("Zugangsänderung wird geprüft …");
    try {
      const requestId = "TIPSTER-ACCESS-" + (crypto.randomUUID ?
        crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
      const result = await request("set", {
        admin_id: String(item.admin_id || ""),
        active: active,
        request_id: requestId
      });
      displayMessage(name + (result.access_active ? " hat wieder Login-Zugang." :
        " ist für beide Backoffice-Anmeldungen gesperrt.") +
        (result.sessions_revoked ? " Beendete Sitzungen: " + result.sessions_revoked + "." : ""));
      updateBusy(false);
      const reload = await request("list");
      showAccounts(reload.tipsters);
    } catch (e) {
      displayMessage(e && e.message || "Zugangsänderung fehlgeschlagen. Bitte neu laden.", true);
      updateBusy(false);
    }
  }
  function injectStyles() {
    if (document.getElementById("biAccessStyles")) return;
    const style = document.createElement("style");
    style.id = "biAccessStyles";
    style.textContent = [
      "#"+MODULE_ID+"{margin:16px 0 22px;border:1px solid rgba(77,187,247,.32);border-radius:16px;background:rgba(6,31,46,.97);padding:20px;box-shadow:0 12px 32px rgba(0,0,0,.16)}",
      "#"+MODULE_ID+" .bi-access-head{display:flex;align-items:start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}",
      "#"+MODULE_ID+" h3{margin:0 0 7px;color:#fff;font-size:20px}",
      "#"+MODULE_ID+" p{color:#aacbda;font-size:13px;line-height:1.55;margin:0}",
      "#"+MODULE_ID+" .bi-access-refresh{border:1px solid rgba(107,200,240,.35);border-radius:10px;padding:9px 14px;background:rgba(19,110,153,.25);color:#fff;cursor:pointer;font-weight:700}",
      "#"+MODULE_ID+" .bi-access-row{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;padding:14px 0;border-top:1px solid rgba(163,205,226,.16)}",
      "#"+MODULE_ID+" .bi-access-person{min-width:180px;flex:1}",
      "#"+MODULE_ID+" .bi-access-person strong{display:block;color:#fff;font-size:16px}",
      "#"+MODULE_ID+" .bi-access-person small{display:block;color:#9ec5d7;font-size:12px;margin-top:5px;line-height:1.45}",
      "#"+MODULE_ID+" .bi-access-control{display:flex;align-items:center;gap:12px;flex-wrap:wrap}",
      "#"+MODULE_ID+" .bi-access-status{font-size:12px;border-radius:999px;padding:6px 10px;font-weight:800;white-space:nowrap}",
      "#"+MODULE_ID+" .bi-access-status.on{background:rgba(0,212,138,.1);color:#8ff0c4;border:1px solid rgba(0,212,138,.32)}",
      "#"+MODULE_ID+" .bi-access-status.off{background:rgba(255,125,134,.1);color:#ffb7c0;border:1px solid rgba(255,125,134,.30)}",
      "#"+MODULE_ID+" .bi-access-switch{padding:11px 14px;min-width:164px;border-radius:10px;border:0;cursor:pointer;font-weight:800;font-size:13px}",
      "#"+MODULE_ID+" .bi-access-switch.on{background:#9c3c48;color:white}",
      "#"+MODULE_ID+" .bi-access-switch.off{background:#16c18f;color:#04271e}",
      "#"+MODULE_ID+" button:disabled{opacity:.48;cursor:wait}",
      "#"+MODULE_ID+" .bi-access-feedback{margin:12px 0 0;min-height:18px;color:#a5efd5;font-size:12px}",
      "#"+MODULE_ID+" .bi-access-feedback.error{color:#ffb7c0}",
      "#"+MODULE_ID+" .bi-access-note{margin-top:14px!important;color:#9dbccb!important;font-size:12px!important}",
      "@media(max-width:560px){#"+MODULE_ID+"{padding:15px}#"+MODULE_ID+" .bi-access-control{width:100%;justify-content:space-between}#"+MODULE_ID+" .bi-access-switch{min-width:0}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  function mount() {
    const session = readSession();
    if (!isMaster(session)) return;
    const masterPanel = document.getElementById("tab-master");
    if (!masterPanel || document.getElementById(MODULE_ID)) return;
    injectStyles();
    const card = document.createElement("article");
    card.id = MODULE_ID;
    card.className = "content-card full";
    card.innerHTML =
      '<div class="bi-access-head"><div><h3>🔐 Tippgeber-Zugänge · Ein/Aus</h3>' +
      '<p>Master-Steuerung: Ein ermöglicht die Anmeldung im Admin Center und persönlichen Backoffice. ' +
      'Aus sperrt beide Wege und beendet bestehende Sitzungen.</p></div>' +
      '<button class="bi-access-refresh" id="biAccessRefresh" type="button">Aktualisieren</button></div>' +
      '<div id="biAccessRows"><p class="bi-access-empty">Tippgeber werden geladen …</p></div>' +
      '<div class="bi-access-feedback" id="biAccessFeedback" role="status" aria-live="polite"></div>' +
      '<p class="bi-access-note">Zugang und Tippabgaberecht sind getrennt. ' +
      'Dieses Modul verändert weder Provisionsprozente noch bestehende Abrechnungen.</p>';
    const anchor = document.getElementById("tipsterCards");
    if (anchor && masterPanel.contains(anchor)) anchor.insertAdjacentElement("beforebegin", card);
    else masterPanel.prepend(card);
    document.getElementById("biAccessRefresh").addEventListener("click", () => loadAccounts(false));
    loadAccounts(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();
