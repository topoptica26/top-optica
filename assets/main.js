/* Top Optica – site behaviour. Business details live in assets/config.js */
(function () {
  "use strict";
  var C = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var isPh = function (v) { return !v || /X{2,}|05X|יעודכן|תעודכן/.test(v); };

  // ---- Text bindings
  $$("[data-bind]").forEach(function (el) {
    var v = C[el.getAttribute("data-bind")];
    if (v) el.textContent = v;
    if (isPh(v)) el.classList.add("is-placeholder");
  });

  // ---- Links (tel / whatsapp). Empty numbers fall back to #contact.
  var tel = C.phoneDial ? "tel:" + C.phoneDial.replace(/[^\d+]/g, "") : "#contact";
  var wa = C.whatsappNumber
    ? "https://wa.me/" + C.whatsappNumber.replace(/\D/g, "") + (C.whatsappMessage ? "?text=" + encodeURIComponent(C.whatsappMessage) : "")
    : "#contact";
  if (C.email) $$('[data-href="email"]').forEach(function (a) { a.href = "mailto:" + C.email; });
  $$('[data-href="tel"]').forEach(function (a) { a.href = tel; });
  $$('[data-href="whatsapp"]').forEach(function (a) {
    a.href = wa;
    if (wa === "#contact") { a.removeAttribute("target"); a.removeAttribute("rel"); }
  });

  // ---- Hours
  var tb = $("#hours-table tbody");
  if (tb && C.hours && C.hours.length) {
    tb.innerHTML = C.hours.map(function (r) {
      return "<tr><th scope=\"row\">" + esc(r[0]) + "</th><td" + (isPh(r[1]) ? ' class="is-placeholder"' : "") + ">" + esc(r[1]) + "</td></tr>";
    }).join("") + (C.hoursNote ? '<tr><td colspan="2" class="hours-note">' + esc(C.hoursNote) + "</td></tr>" : "");
  }

  // ---- Services
  var list = $("#services-list");
  if (list && C.services) {
    list.innerHTML = C.services.map(function (s, i) {
      return '<article class="card reveal" style="--d:' + (i * 70) + 'ms">' +
        '<div class="card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + esc(s.icon || "eye") + '"/></svg></div>' +
        "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p>" +
        (C.servicesArePlaceholder ? '<span class="edit-badge" title="ניתן לעריכה ב-assets/config.js">✎ ניתן לעריכה</span>' : "") +
        "</article>";
    }).join("");
  }

  // ---- Map
  var wz = $("#waze-link");
  if (wz && C.wazeUrl) { wz.href = C.wazeUrl; wz.hidden = false; }
  if (C.mapEmbedUrl) {
    $("#map-box").innerHTML = '<iframe title="מפת הגעה לטופ אופטיקה" src="' + esc(C.mapEmbedUrl) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }

  // ---- Social
  var soc = $("#footer-social"), links = [];
  if (C.instagram) links.push('<a href="' + esc(C.instagram) + '" target="_blank" rel="noopener">Instagram</a>');
  if (C.facebook) links.push('<a href="' + esc(C.facebook) + '" target="_blank" rel="noopener">Facebook</a>');
  if (soc) soc.innerHTML = links.join("");

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  // ---- Mobile nav
  var toggle = $(".nav-toggle"), nav = $("#site-nav");
  function closeNav() { document.body.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "פתיחת תפריט"); }
  toggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  // ---- Header shadow on scroll
  var header = $(".site-header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // ---- Reveal on scroll
  var items = $$(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }
})();
