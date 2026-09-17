/* BetInsight Bankbeleg Upload UI v1.0 · 2026-09-17
   Käuferseitiger, servergebundener Beleg-Upload für Bankkäufe.
   F5-sicher: Die Anzeige wird aus der serverseitig geladenen Kaufhistorie rekonstruiert,
   nicht aus localStorage. Der Upload selbst ändert niemals Units oder Zahlungsstatus.
*/
(() => {
  "use strict";

  const ENDPOINT = "https://hook.eu1.make.com/b8msm9217bae16nfb19np26ezenonuzu";
  const MAX_BYTES = 8 * 1024 * 1024;
  const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (!/\/wechselboerse\/angebote$/.test(path)) return;

  const token = () => window.BetInsightSession?.getDashboardUuid?.() || "";

  function installStyles() {
    if (document.getElementById("bi-bank-proof-style")) return;
    const style = document.createElement("style");
    style.id = "bi-bank-proof-style";
    style.textContent = `
      .bi-proof-box{grid-column:1/-1;margin-top:2px;padding:12px 13px;border:1px solid rgba(89,168,255,.25);border-radius:11px;background:rgba(89,168,255,.055)}
      .bi-proof-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.bi-proof-head strong{display:block;color:#edf8ff;font-size:12px}.bi-proof-head span{display:block;margin-top:3px;color:#85aabc;font-size:10px;line-height:1.45}
      .bi-proof-actions{display:flex;align-items:center;gap:8px;margin-top:10px}.bi-proof-file{display:none}.bi-proof-btn{min-height:38px;padding:8px 12px;border:1px solid rgba(89,168,255,.34);border-radius:9px;color:#d9efff;background:rgba(89,168,255,.08);font-size:11px;font-weight:900;cursor:pointer}.bi-proof-btn:hover{background:rgba(89,168,255,.14)}.bi-proof-btn:disabled{opacity:.55;cursor:not-allowed}.bi-proof-state{color:#85aabc;font-size:10px;line-height:1.4}.bi-proof-state.ok{color:#9af0cf}.bi-proof-state.error{color:#ffb8c1}
      @media(max-width:700px){.bi-proof-actions{align-items:stretch;flex-direction:column}.bi-proof-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function bookingFromRow(row) {
    return (row.textContent || "").match(/BIK-[A-Z0-9-]+/i)?.[0] || "";
  }

  function isEligibleBankRow(row) {
    const text = String(row.textContent || "");
    const bank = /Banküberweisung/i.test(text);
    const uploadPhase = /Zahlung gemeldet|Übertragung wird gebucht|Abgeschlossen/i.test(text);
    const closedWithoutPayment = /Abgelaufen|Storniert/i.test(text);
    return bank && uploadPhase && !closedWithoutPayment && !!bookingFromRow(row);
  }

  async function upload(box, file, booking) {
    const state = box.querySelector(".bi-proof-state");
    const button = box.querySelector(".bi-proof-btn");
    const dashboardToken = token();
    if (!dashboardToken) throw new Error("Kein gültiger Dashboard-Zugang erkannt.");
    if (!file) throw new Error("Bitte zuerst einen Screenshot oder PDF-Beleg auswählen.");
    if (!ALLOWED.has(file.type)) throw new Error("Erlaubt sind PNG, JPG, WEBP oder PDF.");
    if (file.size > MAX_BYTES) throw new Error("Der Beleg darf höchstens 8 MB groß sein.");

    button.disabled = true;
    button.textContent = "Beleg wird gespeichert …";
    state.className = "bi-proof-state";
    state.textContent = "Upload und Zuordnung zur Buchungsnummer werden geprüft.";

    const form = new FormData();
    form.append("dashboard_token", dashboardToken);
    form.append("buchungsnummer", booking);
    form.append("beleg", file, file.name);

    const response = await fetch(ENDPOINT, {method:"POST", body:form, cache:"no-store"});
    const raw = String(await response.text() || "").replace(/^\uFEFF/, "").trim();
    let data = {};
    try { data = JSON.parse(raw || "{}"); } catch (_) { data = {message:raw}; }
    if (!response.ok || data.ok === false) throw new Error(data.message || "Der Beleg konnte nicht gespeichert werden.");

    state.className = "bi-proof-state ok";
    state.textContent = data.message || "Beleg sicher gespeichert und dieser Buchung zugeordnet.";
    button.textContent = data.status === "bank_proof_already_uploaded" ? "Beleg bereits gespeichert" : "Beleg gespeichert";
    button.disabled = true;
    box.dataset.uploaded = "1";
  }

  function addUpload(row) {
    if (!isEligibleBankRow(row)) return;
    if (row.querySelector(".bi-proof-box")) return;
    const booking = bookingFromRow(row);
    const box = document.createElement("div");
    box.className = "bi-proof-box";
    box.dataset.booking = booking;
    box.innerHTML = `
      <div class="bi-proof-head"><div><strong>📎 Zahlungsbeleg / Screenshot</strong><span>Optionaler Nachweis zur Banküberweisung. Auch nach F5 bleibt diese Möglichkeit über deine Kaufhistorie verfügbar.</span></div></div>
      <div class="bi-proof-actions">
        <input class="bi-proof-file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf">
        <button class="bi-proof-btn" type="button">Screenshot / Beleg hochladen</button>
        <span class="bi-proof-state">PNG, JPG, WEBP oder PDF · max. 8 MB</span>
      </div>`;
    row.appendChild(box);
    const input = box.querySelector(".bi-proof-file");
    const button = box.querySelector(".bi-proof-btn");
    button.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await upload(box, file, booking);
      } catch (e) {
        const state = box.querySelector(".bi-proof-state");
        state.className = "bi-proof-state error";
        state.textContent = e?.message || "Upload fehlgeschlagen.";
        button.disabled = false;
        button.textContent = "Erneut versuchen";
      } finally {
        input.value = "";
      }
    });
  }

  function decorate() {
    document.querySelectorAll(".bi-purchase-row").forEach(addUpload);
  }

  installStyles();
  decorate();
  const observer = new MutationObserver(decorate);
  observer.observe(document.documentElement, {subtree:true, childList:true});
})();
