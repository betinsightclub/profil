/* BetInsight Bank-Flow loader v1.2 · 2026-09-17
   Keeps the proven bank-flow implementation isolated and adds the F5-safe bank proof upload UI.
*/
(() => {
  "use strict";
  const current = document.currentScript?.src || window.location.href;
  const base = new URL("./", current);

  function load(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(file, base).toString();
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`BetInsight asset konnte nicht geladen werden: ${file}`));
      document.head.appendChild(script);
    });
  }

  load("bank-flow-ui-v1-core.js?v=20260917-1")
    .then(() => load("bank-proof-upload-v1.js?v=20260917-3"))
    .catch(error => console.error(error));
})();
