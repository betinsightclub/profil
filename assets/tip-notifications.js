/* BetInsight Tipp-Benachrichtigungen · v1.0 · 2026-09-05
   Sparmodus:
   - regelmäßige Prüfung liest nur die statische tip-status.json von GitHub Pages (0 Make-Credits)
   - USER.CC = letzter_tipp_gesehen wird nur beim Initialisieren eines Geräts und beim Öffnen der Tippseite benötigt
   - keine Live-Alarm-/Telegram-Logik in diesem Modul
*/
(() => {
  "use strict";

  if (window.__betInsightTipNotificationsInstalled) return;
  window.__betInsightTipNotificationsInstalled = true;

  const PROFILE_URL = "https://hook.eu1.make.com/h51f7yyocer340kadcpp078uwcy2svbq";
  const SEEN_WRITE_URL = "https://hook.eu1.make.com/rba6hw9weyssdg1timisut854q823g4p";
  const POLL_MS = 180000;
  const session = () => window.BetInsightSession;
  const baseTitle = String(document.title || "BetInsight").replace(/^\(\d+\)\s*/, "");

  let status = null;
  let dashboardToken = "";
  let seenSequence = null;
  let initialized = false;
  let lastObservedSequence = null;
  let pollTimer = null;
  let observer = null;

  const clean = value => String(value ?? "").trim();
  const toSequence = value => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  };

  function appPath(segment = "") {
    if (session()?.appPath) return session().appPath(segment);
    const base = window.location.hostname.toLowerCase() === "betinsightclub.github.io" ? "/profil/" : "/";
    const normalized = clean(segment).replace(/^\/+|\/+$/g, "");
    return normalized ? `${base}${normalized}` : base;
  }

  function statusUrl() {
    const path = appPath("tip-status.json");
    return `${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`;
  }

  function normalizedPath() {
    return String(window.location.pathname || "/").replace(/\/index\.html$/i, "/").replace(/\/+$/, "/");
  }

  function isDashboardPage() {
    const base = appPath("").replace(/\/+$/, "/");
    return normalizedPath() === base;
  }

  function isTipsPage() {
    const target = appPath("tipps").replace(/\/+$/, "/");
    return normalizedPath() === target;
  }

  function getDashboardToken() {
    const fromSession = clean(session()?.getDashboardUuid?.());
    if (fromSession) return fromSession;
    try { return clean(localStorage.getItem("betinsight_dashboard_token")); } catch (_) { return ""; }
  }

  function seenKey(token) { return `betinsight_tip_seen_seq:${token}`; }
  function popupKey(token) { return `betinsight_tip_popup_seq:${token}`; }

  function readLocalSeen(token) {
    try {
      const raw = localStorage.getItem(seenKey(token));
      return raw === null ? null : toSequence(raw);
    } catch (_) { return null; }
  }

  function writeLocalSeen(token, value) {
    try { localStorage.setItem(seenKey(token), String(toSequence(value))); } catch (_) {}
  }

  function readPopupSequence(token) {
    try { return toSequence(localStorage.getItem(popupKey(token))); } catch (_) { return 0; }
  }

  function writePopupSequence(token, value) {
    try { localStorage.setItem(popupKey(token), String(toSequence(value))); } catch (_) {}
  }

  async function fetchStatus() {
    const response = await fetch(statusUrl(), { method: "GET", cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error(`Tip-Status HTTP ${response.status}`);
    const data = await response.json();
    return {
      version: toSequence(data.version || 1),
      sequence: toSequence(data.sequence),
      latestTipId: clean(data.latest_tip_id),
      publishedAt: clean(data.published_at)
    };
  }

  async function fetchServerSeen(token) {
    const response = await fetch(`${PROFILE_URL}?token=${encodeURIComponent(token)}&_=${Date.now()}`, {
      method: "GET", cache: "no-store", credentials: "omit"
    });
    if (!response.ok) throw new Error(`Profilstatus HTTP ${response.status}`);
    const data = await response.json();
    if (!data || data.found === false) throw new Error("Profilstatus nicht gefunden");
    const raw = data.letzter_tipp_gesehen;
    if (raw === undefined || raw === null || clean(raw) === "") return null;
    return toSequence(raw);
  }

  function persistServerSeen(token, value) {
    if (!token) return;
    const seq = toSequence(value);
    const url = `${SEEN_WRITE_URL}?token=${encodeURIComponent(token)}&seen=${encodeURIComponent(String(seq))}`;
    try {
      fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", keepalive: true, credentials: "omit" }).catch(() => {});
    } catch (_) {}
  }

  function ensureStyles() {
    if (document.getElementById("bi-tip-notification-style")) return;
    const style = document.createElement("style");
    style.id = "bi-tip-notification-style";
    style.textContent = `
      .bi-tip-notification-target{position:relative!important}
      .bi-tip-unread-badge{position:absolute;top:-9px;right:-9px;min-width:24px;height:24px;padding:0 6px;display:inline-flex;align-items:center;justify-content:center;border:2px solid #fff;border-radius:999px;background:#ff394d;color:#fff;font-size:12px;font-weight:900;line-height:1;box-shadow:0 5px 16px rgba(255,57,77,.45);z-index:8}
      .bi-tip-toast{position:fixed;z-index:16000;right:18px;top:18px;width:min(360px,calc(100vw - 36px));padding:15px 17px;border:1px solid rgba(45,198,255,.40);border-radius:15px;background:linear-gradient(145deg,#0b4057,#061f2d);box-shadow:0 18px 48px rgba(0,0,0,.42);color:#fff;text-align:left;animation:biTipToastIn .2s ease-out}
      .bi-tip-toast strong{display:block;margin-bottom:5px;font-size:14px}.bi-tip-toast span{color:#bee5f5;font-size:12px;line-height:1.4}
      .bi-tip-popup-overlay{position:fixed;inset:0;z-index:16500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,10,16,.72);backdrop-filter:blur(5px)}
      .bi-tip-popup{width:min(470px,100%);padding:24px;border:1px solid rgba(46,199,255,.43);border-radius:21px;background:linear-gradient(145deg,#0b4057,#061e2b 72%);box-shadow:0 28px 80px rgba(0,0,0,.55);text-align:left}
      .bi-tip-popup h3{margin:0 0 9px;color:#fff;font-size:22px}.bi-tip-popup p{margin:0;color:#c5e3f0;line-height:1.55;font-size:14px}
      .bi-tip-popup-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:19px}.bi-tip-popup-actions button{min-height:42px;padding:10px 15px;border-radius:11px;font-weight:900;cursor:pointer}
      .bi-tip-popup-open{border:0;background:linear-gradient(90deg,#168dff,#08bdec);color:#fff}.bi-tip-popup-later{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#d9eef7}
      @keyframes biTipToastIn{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
      @media(max-width:560px){.bi-tip-toast{right:12px;top:12px;width:calc(100vw - 24px)}.bi-tip-popup{padding:21px 18px}}
    `;
    document.head.appendChild(style);
  }

  function candidateTipButtons() {
    const nodes = [...document.querySelectorAll("button,a")];
    return nodes.filter(element => {
      const onclick = clean(element.getAttribute("onclick"));
      const text = clean(element.textContent).replace(/\s+/g, " ");
      return onclick.includes("goTipps") || /^🔥?\s*Neue Tipps(?:\s|$)/i.test(text);
    });
  }

  function renderBadge(unread) {
    if (!isDashboardPage()) return;
    ensureStyles();
    const count = Math.max(0, toSequence(unread));
    for (const button of candidateTipButtons()) {
      button.classList.add("bi-tip-notification-target");
      let badge = button.querySelector(":scope > .bi-tip-unread-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "bi-tip-unread-badge";
        badge.setAttribute("aria-label", "Neue ungesehene Tipps");
        button.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
    }
  }

  function renderTitle(unread) {
    const count = Math.max(0, toSequence(unread));
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
  }

  function unreadCount() {
    if (!status || seenSequence === null) return 0;
    return Math.max(0, status.sequence - seenSequence);
  }

  function render() {
    const unread = unreadCount();
    renderBadge(unread);
    renderTitle(unread);
  }

  function showToast(unread) {
    if (!isDashboardPage() || unread <= 0) return;
    ensureStyles();
    document.querySelector(".bi-tip-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "bi-tip-toast";
    toast.innerHTML = `<strong>🔥 ${unread === 1 ? "Neuer BetInsight-Tipp" : `${unread} neue BetInsight-Tipps`}</strong><span>${unread === 1 ? "Ein neuer Tipp ist verfügbar." : "Neue Tipps sind verfügbar."}</span>`;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 6500);
  }

  function closePopup() {
    document.getElementById("biTipPopupOverlay")?.remove();
  }

  function markSeenAndOpenTips() {
    if (!dashboardToken || !status) return;
    seenSequence = status.sequence;
    writeLocalSeen(dashboardToken, seenSequence);
    persistServerSeen(dashboardToken, seenSequence);
    render();
    closePopup();
    if (session()?.navigateLocal) session().navigateLocal("tipps");
    else window.location.assign(appPath("tipps"));
  }

  function showLoginPopup(unread) {
    if (!isDashboardPage() || unread <= 0 || !dashboardToken || !status) return;
    if (readPopupSequence(dashboardToken) >= status.sequence) return;
    writePopupSequence(dashboardToken, status.sequence);
    ensureStyles();
    closePopup();
    const overlay = document.createElement("div");
    overlay.id = "biTipPopupOverlay";
    overlay.className = "bi-tip-popup-overlay";
    overlay.innerHTML = `<div class="bi-tip-popup" role="dialog" aria-modal="true" aria-labelledby="biTipPopupTitle"><h3 id="biTipPopupTitle">🔥 ${unread === 1 ? "Neuer BetInsight-Tipp verfügbar" : `${unread} neue BetInsight-Tipps verfügbar`}</h3><p>${unread === 1 ? "Seit deinem letzten Besuch wurde ein neuer Tipp veröffentlicht." : `Seit deinem letzten Besuch wurden ${unread} neue Tipps veröffentlicht.`}</p><div class="bi-tip-popup-actions"><button class="bi-tip-popup-open" type="button">Tipp${unread === 1 ? "" : "s"} ansehen</button><button class="bi-tip-popup-later" type="button">Später</button></div></div>`;
    overlay.querySelector(".bi-tip-popup-open")?.addEventListener("click", markSeenAndOpenTips);
    overlay.querySelector(".bi-tip-popup-later")?.addEventListener("click", closePopup);
    overlay.addEventListener("click", event => { if (event.target === overlay) closePopup(); });
    document.body.appendChild(overlay);
  }

  async function initializeSeen(currentStatus) {
    dashboardToken = getDashboardToken();
    if (!dashboardToken) return false;
    const local = readLocalSeen(dashboardToken);
    if (local !== null) {
      seenSequence = local;
      return true;
    }

    try {
      const server = await fetchServerSeen(dashboardToken);
      if (server === null) {
        // Neues Konto bzw. noch nie initialisiert: vorhandene Tipps gelten als bereits gesehen.
        seenSequence = currentStatus.sequence;
        writeLocalSeen(dashboardToken, seenSequence);
        persistServerSeen(dashboardToken, seenSequence);
      } else {
        seenSequence = server;
        writeLocalSeen(dashboardToken, seenSequence);
      }
      return true;
    } catch (error) {
      console.warn("BetInsight Tipp-Benachrichtigung: Seen-Stand noch nicht verfügbar", error);
      return false;
    }
  }

  async function markTipsPageSeen(currentStatus) {
    dashboardToken = getDashboardToken();
    if (!dashboardToken) return false;
    const local = readLocalSeen(dashboardToken);
    if (local === null || local < currentStatus.sequence) {
      seenSequence = currentStatus.sequence;
      writeLocalSeen(dashboardToken, seenSequence);
      persistServerSeen(dashboardToken, seenSequence);
    } else {
      seenSequence = local;
    }
    renderTitle(0);
    return true;
  }

  function installClickCapture() {
    if (!isDashboardPage()) return;
    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target.closest("button,a") : null;
      if (!target || !candidateTipButtons().includes(target) || !dashboardToken || !status) return;
      seenSequence = status.sequence;
      writeLocalSeen(dashboardToken, seenSequence);
      persistServerSeen(dashboardToken, seenSequence);
      render();
    }, true);
  }

  function watchForButtons() {
    if (!isDashboardPage() || typeof MutationObserver !== "function") return;
    observer = new MutationObserver(() => renderBadge(unreadCount()));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function check({ first = false } = {}) {
    try {
      const nextStatus = await fetchStatus();
      const previous = lastObservedSequence;
      status = nextStatus;

      if (isTipsPage()) {
        await markTipsPageSeen(nextStatus);
        lastObservedSequence = nextStatus.sequence;
        return;
      }

      if (!isDashboardPage()) {
        lastObservedSequence = nextStatus.sequence;
        return;
      }

      if (!initialized) {
        initialized = await initializeSeen(nextStatus);
        if (!initialized) return;
        render();
        showLoginPopup(unreadCount());
      } else {
        render();
        if (!first && previous !== null && nextStatus.sequence > previous && unreadCount() > 0) showToast(unreadCount());
      }
      lastObservedSequence = nextStatus.sequence;
    } catch (error) {
      console.warn("BetInsight Tipp-Benachrichtigung: Statusprüfung fehlgeschlagen", error);
    }
  }

  function start() {
    if (!isDashboardPage() && !isTipsPage()) return;
    installClickCapture();
    watchForButtons();
    check({ first: true });
    pollTimer = window.setInterval(() => check(), POLL_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
    window.addEventListener("pagehide", () => {
      if (pollTimer) window.clearInterval(pollTimer);
      observer?.disconnect();
    }, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
