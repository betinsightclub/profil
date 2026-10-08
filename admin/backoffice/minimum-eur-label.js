(function () {
  "use strict";

  function minimumColumnIndex() {
    const table = document.querySelector('#balanceTableBody')?.closest('table');
    if (!table) return -1;
    const headers = Array.from(table.querySelectorAll('thead th')).map(function (th) {
      return String(th.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    });
    return headers.findIndex(function (text) {
      return text.includes('mindestauszahlung');
    });
  }

  function formatMinimumValues() {
    const tbody = document.getElementById("balanceTableBody");
    if (!tbody) return;

    const targetIndex = minimumColumnIndex();
    if (targetIndex < 0) return;

    tbody.querySelectorAll("tr").forEach(function (row) {
      const cells = row.querySelectorAll("td");
      if (cells.length <= targetIndex) return;

      const target = cells[targetIndex].querySelector(".privacy-sensitive") || cells[targetIndex];
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
