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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', simplifyProvisionCopy, { once: true });
  } else {
    simplifyProvisionCopy();
  }
})();
