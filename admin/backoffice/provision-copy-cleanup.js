(function () {
  function simplifyProvisionCopy() {
    const boxes = document.querySelectorAll('.info-box');
    for (const box of boxes) {
      const text = (box.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text.includes('So wird gerechnet:')) continue;

      box.innerHTML = '<strong>Hinweis:</strong> Angezeigt werden ausschließlich bestätigte Zahlungen und die daraus für dich relevanten Provisionswerte. Die Berechnung erfolgt automatisch anhand der tatsächlich verbrauchten Kauf-Units.';
      break;
    }
  }

  function simplifyUnitUsageIntro() {
    const intro = document.getElementById('uupIntro');
    if (!intro) return false;

    const text = (intro.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text.includes('Beträge anderer Admins') && !text.includes('Private Einzelansicht')) return false;

    intro.textContent = 'Jede tatsächlich verbrauchte Kaufcharge wird dokumentiert. Du siehst den Verbrauch und ausschließlich deine eigenen Provisionswerte.';
    return true;
  }

  function simplifyOwnProvisionLabels() {
    let changed = false;
    const elements = document.querySelectorAll('.uup-stat-label, #uupHeadRow th');

    for (const el of elements) {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();

      if (text === 'Martin · eigene Provision' || text === 'Frank · eigene Provision') {
        el.textContent = 'Eigene Provision';
        changed = true;
        continue;
      }

      if (text === 'Martin · eigene Provision · geladen' || text === 'Frank · eigene Provision · geladen') {
        el.textContent = 'Eigene Provision · geladen';
        changed = true;
      }
    }

    return changed;
  }

  function removePrivateTipsterExtraColumn() {
    const head = document.getElementById('uupHeadRow');
    const body = document.getElementById('uupBody');
    if (!head || !body) return false;

    const headers = Array.from(head.children);
    let extraIndex = headers.findIndex((th) => (th.textContent || '').replace(/\s+/g, ' ').trim() === 'Tippgeber extra · nur wenn eigen');

    if (extraIndex >= 0) {
      headers[extraIndex].remove();
      for (const row of body.querySelectorAll('tr')) {
        if (row.children.length > extraIndex) row.children[extraIndex].remove();
      }
      return true;
    }

    const headerTexts = Array.from(head.children).map((th) => (th.textContent || '').replace(/\s+/g, ' ').trim());
    const isPrivateView = headerTexts.includes('Eigene Provision') && head.children.length === 7;
    if (!isPrivateView) return false;

    for (const row of body.querySelectorAll('tr')) {
      if (row.children.length === 8) row.children[6].remove();
    }
    return true;
  }

  function applyCleanup() {
    simplifyProvisionCopy();
    simplifyUnitUsageIntro();
    simplifyOwnProvisionLabels();
    removePrivateTipsterExtraColumn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCleanup, { once: true });
  } else {
    applyCleanup();
  }

  const observer = new MutationObserver(function () {
    simplifyUnitUsageIntro();
    simplifyOwnProvisionLabels();
    removePrivateTipsterExtraColumn();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
