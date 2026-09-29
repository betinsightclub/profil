(function () {
  function applyFrankSharePrivacy() {
    const adminName = document.getElementById("adminName");
    if (!adminName || (adminName.textContent || "").trim().toLowerCase() !== "frank") return;

    const factor = document.getElementById("effectiveFactor");
    if (factor) factor.textContent = "Dein Anteil";

    const quantity = document.getElementById("selfQuantitySystem");
    if (quantity) quantity.style.display = "none";

    const preview = document.querySelector("#personalTipsterCard .tipster-factor-preview");
    if (preview) preview.style.display = "none";

    const intro = document.querySelector("#personalTipsterCard .personal-tipster-head .muted");
    if (intro) intro.textContent = "Deine Wochenleistung und dein aktueller Fortschritt. Die endgültige Freigabe bleibt beim Master.";

    const info = document.getElementById("selfTipsterInfo");
    if (info) info.textContent = "Deine Vergütung wird automatisch als dein persönlicher Anteil berücksichtigt.";
  }

  applyFrankSharePrivacy();
  new MutationObserver(applyFrankSharePrivacy).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();