/* BetInsight · mark Academy / resource child pages as Academy & Ressourcen in sidebar */
(() => {
  "use strict";

  function applyResourceActiveState() {
    const resourceLink = document.querySelector('.bi-nav-link[data-bi-nav-route="ressourcen"]');
    if (!resourceLink) return false;

    document.querySelectorAll('.bi-nav-link-active,.bi-nav-sub-link-active').forEach(el => {
      el.classList.remove('bi-nav-link-active','bi-nav-sub-link-active');
      el.removeAttribute('aria-current');
    });
    document.querySelectorAll('.bi-nav-group-current').forEach(el => el.classList.remove('bi-nav-group-current'));

    resourceLink.classList.add('bi-nav-link-active');
    resourceLink.setAttribute('aria-current','page');
    return true;
  }

  function init() {
    if (applyResourceActiveState()) return;

    const observer = new MutationObserver(() => {
      if (applyResourceActiveState()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});

    window.setTimeout(() => {
      applyResourceActiveState();
      observer.disconnect();
    }, 5000);
  }

  window.addEventListener('bi:languagechange', () => window.setTimeout(applyResourceActiveState, 0));
  window.addEventListener('pageshow', () => window.setTimeout(applyResourceActiveState, 0));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
