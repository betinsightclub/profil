/* BetInsight Tipp-Benachrichtigungen · v1.2 · 2026-09-05
   Sparmodus:
   - regelmäßige Prüfung: nur statische tip-status.json von GitHub Pages = 0 Make-Credits
   - USER.CC (letzter_tipp_gesehen) wird nur zur gerätebezogenen Initialisierung und beim Öffnen der Tippseite genutzt
   - auf der Tippseite werden bereits freigeschaltete Tipp-IDs clientseitig aus „Neue Tipps“ ausgeblendet
   - keine LIVE-ALARM-/Telegram-Logik
*/
(() => {
  "use strict";
  if (window.__betInsightTipNotificationsInstalled) return;
  window.__betInsightTipNotificationsInstalled = true;

  const PROFILE_URL = "https://hook.eu1.make.com/h51f7yyocer340kadcpp078uwcy2svbq";
  const SEEN_WRITE_URL = "https://hook.eu1.make.com/rba6hw9weyssdg1timisut854q823g4p";
  const OPEN_TIPS_URL = "https://hook.eu1.make.com/36gm8kvlfcb7jwae8ypxe8oripquonq5";
  const UNLOCKED_TIPS_URL = "https://hook.eu1.make.com/7q3edcra1gwxd7vvklv4l7gdxn7zbihr";
  const UNLOCK_URL = "https://hook.eu1.make.com/k1qn9hlfqd7yhz55vwiotkojgpuqzxug";
  const POLL_MS = 180000;
  const baseTitle = String(document.title || "BetInsight").replace(/^\(\d+\)\s*/, "");

  let currentStatus = null;
  let dashboardToken = "";
  let seenSequence = null;
  let initialized = false;
  let lastObservedSequence = null;
  let tokenRetries = 0;
  let unlockedIdsPromise = null;
  let nativeFetch = null;
  let filterInstalled = false;

  const clean = value => String(value ?? "").trim();
  const seq = value => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  };
  const session = () => window.BetInsightSession;

  function appPath(segment = "") {
    if (session()?.appPath) return session().appPath(segment);
    const base = location.hostname.toLowerCase() === "betinsightclub.github.io" ? "/profil/" : "/";
    const part = clean(segment).replace(/^\/+|\/+$/g, "");
    if (!part) return base;
    return `${base}${part}${/\.[a-z0-9]{2,8}$/i.test(part) ? "" : "/"}`;
  }

  function pagePath() {
    return String(location.pathname || "/").replace(/\/index\.html$/i, "/").replace(/\/+$/, "/");
  }
  function isDashboard() { return pagePath() === appPath("").replace(/\/+$/, "/"); }
  function isTips() { return pagePath() === appPath("tipps").replace(/\/+$/, "/"); }

  function getDashboardToken() {
    const direct = clean(session()?.getDashboardUuid?.());
    if (direct) return direct;
    try { return clean(localStorage.getItem("betinsight_dashboard_token")); } catch (_) { return ""; }
  }

  const seenKey = token => `betinsight_tip_seen_seq:${token}`;
  const popupKey = token => `betinsight_tip_popup_seq:${token}`;

  function readLocalSeen(token) {
    try {
      const raw = localStorage.getItem(seenKey(token));
      return raw === null ? null : seq(raw);
    } catch (_) { return null; }
  }
  function writeLocalSeen(token, value) {
    try { localStorage.setItem(seenKey(token), String(seq(value))); } catch (_) {}
  }
  function readPopupSeen(token) {
    try { return seq(localStorage.getItem(popupKey(token))); } catch (_) { return 0; }
  }
  function writePopupSeen(token, value) {
    try { localStorage.setItem(popupKey(token), String(seq(value))); } catch (_) {}
  }

  function parseArrayPayload(raw) {
    let text = String(raw ?? "").replace(/^\uFEFF/, "").trim();
    const first = text.indexOf("[");
    const last = text.lastIndexOf("]");
    if (first !== -1 && last > first) text = text.slice(first, last + 1).trim();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  }

  function parseObjectPayload(raw) {
    let text = String(raw ?? "").replace(/^\uFEFF/, "").trim();
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last > first) text = text.slice(first, last + 1).trim();
    const data = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  }

  async function loadStatus() {
    const path = appPath("tip-status.json");
    const response = await fetch(`${path}?_=${Date.now()}`, { cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error(`Tip-Status HTTP ${response.status}`);
    const data = await response.json();
    return {
      sequence: seq(data.sequence),
      latestTipId: clean(data.latest_tip_id),
      publishedAt: clean(data.published_at)
    };
  }

  async function loadServerSeen(token) {
    const response = await fetch(`${PROFILE_URL}?token=${encodeURIComponent(token)}&_=${Date.now()}`, {
      cache: "no-store", credentials: "omit"
    });
    if (!response.ok) throw new Error(`Profilstatus HTTP ${response.status}`);
    const data = await response.json();
    if (!data || data.found === false) throw new Error("Profilstatus nicht gefunden");
    const raw = data.letzter_tipp_gesehen;
    return raw === undefined || raw === null || clean(raw) === "" ? null : seq(raw);
  }

  function saveServerSeen(value) {
    if (!dashboardToken) return;
    const url = `${SEEN_WRITE_URL}?token=${encodeURIComponent(dashboardToken)}&seen=${encodeURIComponent(String(seq(value)))}`;
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
      .bi-tip-toast{position:fixed;z-index:16000;right:18px;top:18px;width:min(360px,calc(100vw - 36px));padding:15px 17px;border:1px solid rgba(45,198,255,.40);border-radius:15px;background:linear-gradient(145deg,#0b4057,#061f2d);box-shadow:0 18px 48px rgba(0,0,0,.42);color:#fff;text-align:left}.bi-tip-toast strong{display:block;margin-bottom:5px;font-size:14px}.bi-tip-toast span{color:#bee5f5;font-size:12px;line-height:1.4}
      .bi-tip-popup-overlay{position:fixed;inset:0;z-index:16500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,10,16,.72);backdrop-filter:blur(5px)}
      .bi-tip-popup{width:min(470px,100%);padding:24px;border:1px solid rgba(46,199,255,.43);border-radius:21px;background:linear-gradient(145deg,#0b4057,#061e2b 72%);box-shadow:0 28px 80px rgba(0,0,0,.55);text-align:left}.bi-tip-popup h3{margin:0 0 9px;color:#fff;font-size:22px}.bi-tip-popup p{margin:0;color:#c5e3f0;line-height:1.55;font-size:14px}
      .bi-tip-popup-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:19px}.bi-tip-popup-actions button{min-height:42px;padding:10px 15px;border-radius:11px;font-weight:900;cursor:pointer}.bi-tip-popup-open{border:0;background:linear-gradient(90deg,#168dff,#08bdec);color:#fff}.bi-tip-popup-later{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#d9eef7}
      @media(max-width:560px){.bi-tip-toast{right:12px;top:12px;width:calc(100vw - 24px)}.bi-tip-popup{padding:21px 18px}}
    `;
    document.head.appendChild(style);
  }

  function tipTargets() {
    return [...document.querySelectorAll("button,a")].filter(element => {
      const onclick = clean(element.getAttribute("onclick"));
      const text = clean(element.textContent).replace(/\s+/g, " ");
      return onclick.includes("goTipps") || /^🔥?\s*Neue Tipps(?:\s|$)/i.test(text);
    });
  }

  function unread() {
    if (!currentStatus || seenSequence === null) return 0;
    return Math.max(0, currentStatus.sequence - seenSequence);
  }

  function renderBadge() {
    if (!isDashboard()) return;
    ensureStyles();
    const count = unread();
    const targets = tipTargets();
    if (count <= 0) {
      for (const target of targets) {
        target.querySelectorAll(":scope > .bi-tip-unread-badge").forEach(badge => badge.remove());
      }
      return;
    }
    const label = count > 99 ? "99+" : String(count);
    for (const target of targets) {
      target.classList.add("bi-tip-notification-target");
      let badge = target.querySelector(":scope > .bi-tip-unread-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "bi-tip-unread-badge";
        badge.setAttribute("aria-label", "Neue ungesehene Tipps");
        target.appendChild(badge);
      }
      if (badge.textContent !== label) badge.textContent = label;
    }
  }

  function render() {
    const count = unread();
    renderBadge();
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
  }

  function showToast() {
    const count = unread();
    if (!isDashboard() || count <= 0) return;
    ensureStyles();
    document.querySelector(".bi-tip-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "bi-tip-toast";
    toast.innerHTML = `<strong>🔥 ${count === 1 ? "Neuer BetInsight-Tipp" : `${count} neue BetInsight-Tipps`}</strong><span>${count === 1 ? "Ein neuer Tipp ist verfügbar." : "Neue Tipps sind verfügbar."}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 6500);
  }

  function closePopup() { document.getElementById("biTipPopupOverlay")?.remove(); }

  function markSeen(value = currentStatus?.sequence || 0) {
    seenSequence = seq(value);
    writeLocalSeen(dashboardToken, seenSequence);
    saveServerSeen(seenSequence);
    render();
  }

  function openTips() {
    markSeen();
    closePopup();
    if (session()?.navigateLocal) session().navigateLocal("tipps");
    else location.assign(appPath("tipps"));
  }

  function showLoginPopup() {
    const count = unread();
    if (!isDashboard() || count <= 0 || !dashboardToken || !currentStatus) return;
    if (readPopupSeen(dashboardToken) >= currentStatus.sequence) return;
    writePopupSeen(dashboardToken, currentStatus.sequence);
    ensureStyles();
    closePopup();
    const overlay = document.createElement("div");
    overlay.id = "biTipPopupOverlay";
    overlay.className = "bi-tip-popup-overlay";
    overlay.innerHTML = `<div class="bi-tip-popup" role="dialog" aria-modal="true"><h3>🔥 ${count === 1 ? "Neuer BetInsight-Tipp verfügbar" : `${count} neue BetInsight-Tipps verfügbar`}</h3><p>${count === 1 ? "Seit deinem letzten Besuch wurde ein neuer Tipp veröffentlicht." : `Seit deinem letzten Besuch wurden ${count} neue Tipps veröffentlicht.`}</p><div class="bi-tip-popup-actions"><button class="bi-tip-popup-open" type="button">Tipp${count === 1 ? "" : "s"} ansehen</button><button class="bi-tip-popup-later" type="button">Später</button></div></div>`;
    overlay.querySelector(".bi-tip-popup-open")?.addEventListener("click", openTips);
    overlay.querySelector(".bi-tip-popup-later")?.addEventListener("click", closePopup);
    overlay.addEventListener("click", event => { if (event.target === overlay) closePopup(); });
    document.body.appendChild(overlay);
  }

  async function initializeSeen() {
    const local = readLocalSeen(dashboardToken);
    if (local !== null) {
      seenSequence = local;
      return true;
    }
    const server = await loadServerSeen(dashboardToken);
    if (server === null) {
      seenSequence = currentStatus.sequence;
      writeLocalSeen(dashboardToken, seenSequence);
      saveServerSeen(seenSequence);
    } else {
      seenSequence = server;
      writeLocalSeen(dashboardToken, seenSequence);
    }
    return true;
  }

  async function loadUnlockedIds(fetchFn) {
    const token = getDashboardToken();
    if (!token) return new Set();
    const response = await fetchFn(`${UNLOCKED_TIPS_URL}?token=${encodeURIComponent(token)}&cachebuster=${Date.now()}`, {
      method: "GET", cache: "no-store", credentials: "omit"
    });
    if (!response.ok) throw new Error(`Freigeschaltete Tipps HTTP ${response.status}`);
    const items = parseArrayPayload(await response.text());
    return new Set(items.map(item => clean(item?.tipp_id ?? item?.["1"])).filter(Boolean));
  }

  function cloneResponseWithJson(response, payload) {
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(payload), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  function installUserTipFiltering() {
    if (!isTips() || filterInstalled) return;
    filterInstalled = true;
    nativeFetch = window.fetch.bind(window);
    unlockedIdsPromise = loadUnlockedIds(nativeFetch).catch(error => {
      console.warn("BetInsight Tipp-Filter: Freigeschaltete IDs konnten nicht geladen werden", error);
      return new Set();
    });

    window.fetch = async function(input, init) {
      const requestUrl = typeof input === "string" ? input : clean(input?.url);
      const response = await nativeFetch(input, init);

      if (requestUrl.startsWith(OPEN_TIPS_URL)) {
        try {
          const ids = await unlockedIdsPromise;
          const items = parseArrayPayload(await response.clone().text());
          const filtered = items.filter(item => !ids.has(clean(item?.tipp_id)));
          return cloneResponseWithJson(response, filtered);
        } catch (error) {
          console.warn("BetInsight Tipp-Filter: Offene Tipps konnten nicht gefiltert werden", error);
          return response;
        }
      }

      if (requestUrl.startsWith(UNLOCK_URL)) {
        try {
          const data = parseObjectPayload(await response.clone().text());
          if ((data.status === "success" || data.status === "already_unlocked") && clean(data.tipp_id)) {
            const ids = await unlockedIdsPromise;
            ids.add(clean(data.tipp_id));
            unlockedIdsPromise = Promise.resolve(ids);
            setTimeout(() => {
              try { if (typeof window.loadPage === "function") window.loadPage(); } catch (_) {}
            }, 50);
          }
        } catch (error) {
          console.warn("BetInsight Tipp-Filter: Freischaltungsantwort konnte nicht ausgewertet werden", error);
        }
      }

      return response;
    };

    unlockedIdsPromise.then(() => {
      setTimeout(() => {
        try { if (typeof window.loadPage === "function") window.loadPage(); } catch (_) {}
      }, 0);
    });
  }

  async function check(first = false) {
    dashboardToken = getDashboardToken();
    if (!dashboardToken) {
      if (tokenRetries++ < 20) setTimeout(() => check(true), 600);
      return;
    }
    try {
      const next = await loadStatus();
      const previous = lastObservedSequence;
      currentStatus = next;

      if (isTips()) {
        const local = readLocalSeen(dashboardToken);
        seenSequence = local === null ? 0 : local;
        if (seenSequence < next.sequence) markSeen(next.sequence);
        document.title = baseTitle;
        lastObservedSequence = next.sequence;
        return;
      }

      if (!isDashboard()) return;
      if (!initialized) {
        initialized = await initializeSeen();
        render();
        showLoginPopup();
      } else {
        render();
        if (!first && previous !== null && next.sequence > previous && unread() > 0) showToast();
      }
      lastObservedSequence = next.sequence;
    } catch (error) {
      console.warn("BetInsight Tipp-Benachrichtigung: Statusprüfung fehlgeschlagen", error);
    }
  }

  function installClickCapture() {
    if (!isDashboard()) return;
    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target.closest("button,a") : null;
      if (!target || !tipTargets().includes(target) || !dashboardToken || !currentStatus) return;
      markSeen(currentStatus.sequence);
    }, true);
  }

  function start() {
    if (!isDashboard() && !isTips()) return;
    installUserTipFiltering();
    installClickCapture();
    check(true);
    setTimeout(renderBadge, 1200);
    setTimeout(renderBadge, 3200);
    setInterval(() => check(false), POLL_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(false); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
