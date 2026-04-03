// Minimal local fallback to avoid external CDN failures.
// If a real ArabicReshaper library is loaded elsewhere, this file will not override it.
(function () {
  if (!window.ArabicReshaper) {
    window.ArabicReshaper = {
      reshape: function (text) {
        return text || "";
      }
    };
  }
})();
