// Removes import map overrides unless a developer enabled the devtools panel
// (localStorage.setItem('devtools', true)). Runs before import-map-overrides.js
// applies them.
// The former page (dev-libs, panel always visible) stored an override that
// loads single-spa from cdn.jsdelivr.net in every visitor's browser. That
// breaks the app in networks without internet and under the
// Content-Security-Policy.
(function () {
  try {
    if (localStorage.getItem('devtools') !== null) {
      return;
    }
    Object.keys(localStorage)
      .filter(function (key) {
        return key.indexOf('import-map-override') === 0;
      })
      .forEach(function (key) {
        localStorage.removeItem(key);
      });
  } catch (e) {
    // localStorage not available (e.g. blocked): nothing to clean up.
  }
})();
