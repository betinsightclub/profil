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

  function applyCleanup() {
    simplifyProvisionCopy();
    simplifyUnitUsageIntro();
    simplifyOwnProvisionLabels();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCleanup, { once: true });
  } else {
    applyCleanup();
  }

  const observer = new MutationObserver(function () {
    simplifyUnitUsageIntro();
    simplifyOwnProvisionLabels();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
