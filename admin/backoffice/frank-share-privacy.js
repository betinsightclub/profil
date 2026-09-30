(function () {
  "use strict";
  const SESSION_KEY = "betinsight_admin_session_v1";

  function getAdminId() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
      return String(s.adminId || "");
    } catch (_) {
      return "";
    }
  }

  function applyFrankPrivacy() {
    if (getAdminId() !== "ADM-003") return;

    const adminName = document.getElementById("adminName");
    if (adminName && adminName.textContent.trim() === "Admin") adminName.textContent = "Frank";

    const factor = document.getElementById("effectiveFactor");
    if (factor && factor.textContent !== "Dein Anteil") factor.textContent = "Dein Anteil";

    const quantity = document.getElementById("selfQuantitySystem");
    if (quantity) quantity.style.display = "none";

    const preview = document.querySelector("#personalTipsterCard .tipster-factor-preview");
    if (preview) preview.style.display = "none";
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      applyFrankPrivacy();
    });
  }

  schedule();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();