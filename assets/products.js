/* Top Optica – products page. Source: backend (TopApi 'products') or SITE_CONFIG.products.
 * Empty list → elegant "COMING SOON" state. No cart/payment yet: each product has a
 * WhatsApp inquiry button (hook: window.TopProducts.onInquiry can be replaced later by a cart). */
(function () {
  "use strict";
  var C = window.SITE_CONFIG || {}, API = window.TopApi;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var grid = $("#pr-grid"), empty = $("#pr-empty"), filters = $("#pr-filters");
  var waBase = C.whatsappNumber ? "https://wa.me/" + String(C.whatsappNumber).replace(/\D/g, "") : "";
  var all = [], cat = "";
  window.TopProducts = {
    inquiryUrl: function (p) { return waBase ? waBase + "?text=" + encodeURIComponent("שלום, אשמח לפרטים על " + p.name + (p.price ? " (₪" + p.price + ")" : "")) : "index.html#contact"; }
  };
  function safeImg(u) { return /^https:\/\//i.test(u || "") || /^assets\//.test(u || "") ? u : ""; }
  function render() {
    var list = all.filter(function (p) { return !cat || p.category === cat; });
    if (!all.length) { grid.innerHTML = ""; empty.hidden = false; filters.hidden = true; return; }
    empty.hidden = true;
    var cats = all.map(function (p) { return p.category; }).filter(function (c, i, a) { return c && a.indexOf(c) === i; });
    filters.hidden = cats.length < 2;
    filters.innerHTML = ['<button type="button" class="pr-filter" data-c="" aria-pressed="' + (!cat) + '">הכול</button>'].concat(cats.map(function (c) {
      return '<button type="button" class="pr-filter" data-c="' + esc(c) + '" aria-pressed="' + (cat === c) + '">' + esc(c) + "</button>";
    })).join("");
    grid.innerHTML = list.map(function (p, i) {
      var img = safeImg(p.imageUrl);
      return '<article class="pr-card reveal in" style="--d:' + i * 60 + 'ms">' +
        '<div class="pr-img">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">' : '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-glasses"/></svg>') +
        (p.inStock === false ? '<span class="pr-badge out">אזל מהמלאי</span>' : "") + "</div>" +
        '<div class="pr-body">' + (p.category ? '<span class="pr-cat">' + esc(p.category) + "</span>" : "") + "<h3>" + esc(p.name) + "</h3>" +
        (p.description ? "<p>" + esc(p.description) + "</p>" : "<p></p>") +
        '<div class="pr-foot"><span class="pr-price">' + (p.price ? "₪" + esc(p.price) : "") + '</span>' +
        '<a class="btn btn-gold btn-sm" href="' + esc(window.TopProducts.inquiryUrl(p)) + '" target="_blank" rel="noopener" aria-label="בירור בוואטסאפ על ' + esc(p.name) + '">לפרטים</a></div></div></article>';
    }).join("");
  }
  filters.addEventListener("click", function (e) { var b = e.target.closest(".pr-filter"); if (!b) return; cat = b.getAttribute("data-c"); render(); });
  function done(list) { all = (list || []).filter(function (p) { return p && p.name && p.visible !== false; }); render(); }
  if (API && API.enabled) {
    grid.innerHTML = '<div class="bk-loading" style="grid-column:1/-1"><span class="bk-spin" aria-hidden="true"></span><p>טוען מוצרים…</p></div>';
    API.get("products").then(function (d) { done(d.products); }, function () { done(C.products); });
  } else done(C.products);
})();
