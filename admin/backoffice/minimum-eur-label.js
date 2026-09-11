(function () {
  "use strict";

  function formatMinimumValues() {
    const tbody = document.getElementById("balanceTableBody");
    if (!tbody) return;

    tbody.querySelectorAll("tr").forEach(function (row) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 5) return;

      const target = cells[4].querySelector(".privacy-sensitive") || cells[4];
      const raw = String(target.textContent || "").trim();

      if (!raw || raw === "–" || raw.includes("€ Mindestwert")) return;

      const normalized = raw
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^0-9.-]/g, "");
      const value = Number(normalized);
      if (!Number.isFinite(value)) return;

      const formatted = new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2
      }).format(value);

      target.textContent = formatted + " € Mindestwert";
    });
  }

  function init() {
    const tbody = document.getElementById("balanceTableBody");
    if (!tbody) return;

    formatMinimumValues();

    const observer = new MutationObserver(function () {
      formatMinimumValues();
    });

    observer.observe(tbody, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
