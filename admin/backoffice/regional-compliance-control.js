/* BetInsight Master Backoffice · Brazil regional compliance control
   Version 2026-09-27-01 */
(() => {
  "use strict";

  const API_URL = "https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-regional-config";
  const SESSION_KEY = "betinsight_admin_session_v1";

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
    catch (_) { return null; }
  }

  function isMaster(session) {
    return String(session?.master || "").toUpperCase() === "JA" ||
      String(session?.role || "").toUpperCase() === "MASTER";
  }

  async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(String(value || ""));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
  }

  function style() {
    if (document.getElementById("biRegionalControlStyle")) return;
    const el = document.createElement("style");
    el.id = "biRegionalControlStyle";
    el.textContent = `
      .bi-regional-control{margin:0 0 16px;padding:18px;border:1px solid rgba(255,218,118,.32);border-radius:16px;background:linear-gradient(180deg,rgba(255,218,118,.07),rgba(3,19,28,.82))}
      .bi-regional-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .bi-regional-title{font-size:18px;font-weight:900;color:#fff}
      .bi-regional-sub{margin-top:5px;color:#b9d8e8;font-size:12px;line-height:1.5;max-width:760px}
      .bi-regional-switch{position:relative;width:72px;height:38px;flex:0 0 72px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:#7d2c35;cursor:pointer;transition:.18s}
      .bi-regional-switch:before{content:"";position:absolute;top:4px;left:4px;width:28px;height:28px;border-radius:50%;background:#fff;transition:.18s;box-shadow:0 3px 10px rgba(0,0,0,.32)}
      .bi-regional-switch[aria-pressed="true"]{background:#079663;border-color:rgba(0,212,138,.54)}
      .bi-regional-switch[aria-pressed="true"]:before{transform:translateX(34px)}
      .bi-regional-switch:disabled{opacity:.55;cursor:wait}
      .bi-regional-status{display:flex;align-items:center;gap:8px;margin-top:14px;padding:11px 12px;border-radius:11px;background:rgba(255,255,255,.035);color:#d9edf6;font-size:12px}
      .bi-regional-dot{width:9px;height:9px;border-radius:50%;background:#ff7d86;box-shadow:0 0 0 4px rgba(255,125,134,.09)}
      .bi-regional-status.active .bi-regional-dot{background:#00d48a;box-shadow:0 0 0 4px rgba(0,212,138,.10)}
      .bi-regional-meta{margin-top:9px;color:#87afc1;font-size:11px;line-height:1.45}
      .bi-regional-message{margin-top:10px;min-height:18px;color:#ffe59b;font-size:12px}
      .bi-regional-message.error{color:#ffc6ca}
      @media(max-width:620px){.bi-regional-head{align-items:flex-start}.bi-regional-switch{margin-left:auto}}
    `;
    document.head.appendChild(el);
  }

  function createCard() {
    const panel = document.getElementById("tab-master");
    if (!panel || document.getElementById("biRegionalControl")) return null;
    const note = panel.querySelector(".master-note");
    const card = document.createElement("article");
    card.id = "biRegionalControl";
    card.className = "bi-regional-control";
    card.innerHTML = `
      <div class="bi-regional-head">
        <div>
          <div class="bi-regional-title">🇧🇷 Brasilien – Wettanbieter/Quoten/Affiliate sperren</div>
          <div class="bi-regional-sub">Zentraler Schalter für die Brasilien-Sonderregel. EIN blendet Wettanbieter, Casino-/Betting-Affiliate-Funktionen, Weiterleitungen und anbieterbezogene Quotenfunktionen für Brasilien aus und sperrt den betreffenden Premium-Kaufweg.</div>
        </div>
        <button id="biBrazilSwitch" class="bi-regional-switch" type="button" role="switch" aria-pressed="true" aria-label="Brasilien-Sperre ein- oder ausschalten" disabled></button>
      </div>
      <div id="biBrazilStatus" class="bi-regional-status active">
        <span class="bi-regional-dot"></span>
        <strong>Status wird geladen …</strong>
      </div>
      <div id="biBrazilMeta" class="bi-regional-meta">Die Einstellung wird zentral gespeichert und gilt für alle Nutzer. Bei Nichterreichbarkeit bleibt Brasilien sicherheitshalber gesperrt.</div>
      <div id="biBrazilMessage" class="bi-regional-message" aria-live="polite"></div>
    `;
    if (note) note.insertAdjacentElement("afterend", card);
    else panel.prepend(card);
    return card;
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  function render(active, updatedAt = "") {
    const button = document.getElementById("biBrazilSwitch");
    const status = document.getElementById("biBrazilStatus");
    const meta = document.getElementById("biBrazilMeta");
    if (!button || !status || !meta) return;

    button.setAttribute("aria-pressed", active ? "true" : "false");
    status.classList.toggle("active", active);
    status.querySelector("strong").textContent = active
      ? "AKTIV · Brasilien ist für Wettanbieter/Quoten/Affiliate gesperrt"
      : "AUS · Brasilien-Sonderregel ist technisch deaktiviert";

    const stamp = formatDate(updatedAt);
    meta.textContent = (stamp ? "Letzte Änderung: " + stamp + ". " : "") +
      "Die Einstellung wird zentral gespeichert und gilt für alle Nutzer. Bei Nichterreichbarkeit bleibt Brasilien sicherheitshalber gesperrt.";
  }

  function message(text, error = false) {
    const el = document.getElementById("biBrazilMessage");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("error", error);
  }

  async function fetchState() {
    const response = await fetch(API_URL + "?v=" + Date.now(), {
      method: "GET",
      cache: "no-store",
      credentials: "omit"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true || typeof data.brazil_betting_block_active !== "boolean") {
      throw new Error("Status konnte nicht geladen werden.");
    }
    return data;
  }

  async function saveState(active) {
    const session = readSession();
    if (!isMaster(session) || !session?.token) throw new Error("Master-Session fehlt oder ist abgelaufen.");
    const sessionHash = await sha256Hex(session.token);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "omit",
      body: JSON.stringify({
        action: "set_brazil_betting_block",
        active: Boolean(active),
        session_hash: sessionHash
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      if (data.error === "master_required") throw new Error("Nur der Master-Admin darf diese Einstellung ändern.");
      if (data.error === "session_invalid") throw new Error("Die Admin-Session ist abgelaufen. Bitte neu einloggen.");
      throw new Error("Die Einstellung konnte nicht gespeichert werden.");
    }
    return data;
  }

  async function init() {
    let session = readSession();
    for (let i = 0; i < 25 && !session; i++) {
      await sleep(200);
      session = readSession();
    }
    if (!isMaster(session)) return;

    style();
    const card = createCard();
    if (!card) return;

    const button = document.getElementById("biBrazilSwitch");
    try {
      const state = await fetchState();
      render(state.brazil_betting_block_active, state.updated_at);
      button.disabled = false;
    } catch (error) {
      render(true, "");
      message("Status konnte nicht geladen werden. Sicherheitsmodus: Brasilien bleibt gesperrt.", true);
      button.disabled = false;
    }

    button.addEventListener("click", async () => {
      const current = button.getAttribute("aria-pressed") === "true";
      const next = !current;

      if (!next) {
        const confirmed = window.confirm(
          "Brasilien-Sperre wirklich deaktivieren? Danach können die angebundenen Wettanbieter-/Quotenfunktionen für Brasilien wieder sichtbar werden, sofern keine andere Länderregel greift."
        );
        if (!confirmed) return;
      }

      button.disabled = true;
      message(next ? "Brasilien-Sperre wird aktiviert …" : "Brasilien-Sperre wird deaktiviert …");

      try {
        const saved = await saveState(next);
        render(saved.brazil_betting_block_active, saved.updated_at);
        message(saved.brazil_betting_block_active
          ? "Gespeichert: Brasilien-Sperre ist aktiv."
          : "Gespeichert: Brasilien-Sperre ist deaktiviert."
        );
        window.BetInsightRegionalRestrictions?.refresh?.();
      } catch (error) {
        message(error?.message || "Änderung fehlgeschlagen.", true);
        try {
          const state = await fetchState();
          render(state.brazil_betting_block_active, state.updated_at);
        } catch (_) {}
      } finally {
        button.disabled = false;
      }
    });
  }

  init();
})();