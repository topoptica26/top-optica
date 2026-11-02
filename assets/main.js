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


  // ---- Clinic: autoplay muted tour while visible + photo lightbox
  var vid = $("#clinic-video");
  if (vid && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    vid.muted = true;
    var userPaused = false;
    vid.addEventListener("pause", function () { if (vid.dataset.auto !== "1") userPaused = true; vid.dataset.auto = ""; });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!userPaused) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!vid.paused) { vid.dataset.auto = "1"; vid.pause(); }
      });
    }, { threshold: 0.5 }).observe(vid);
  }
  var lb = $("#lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = $("img", lb);
    $$(".clinic-photo").forEach(function (b) {
      b.addEventListener("click", function () {
        var im = $("img", b); lbImg.src = b.getAttribute("data-full"); lbImg.alt = im.alt; lb.showModal();
      });
    });
    $(".lightbox-close", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  } else {
    $$(".clinic-photo").forEach(function (b) { b.addEventListener("click", function () { window.open(b.getAttribute("data-full"), "_blank"); }); });
  }

  // ---- Liat: lazy-loaded 3D greeter beside the floating WhatsApp button
  (function () {
    var box = $("#liat"), stage = $("#liat-stage");
    if (!box || !stage || !/^https?:$/.test(location.protocol)) return;
    var KEY = "liatHidden";
    try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}
    var conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""))) return;
    if (!window.customElements || !window.WebGLRenderingContext) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var WAVE = "Liat_Wave_v1", HIPS = "Liat_HandsOnHips_v1";
    var bubbleTimer, peekTimer, small = window.matchMedia("(max-width:560px)");
    function bubble(ms) {
      clearTimeout(bubbleTimer); box.classList.add("show-bubble");
      bubbleTimer = setTimeout(function () { box.classList.remove("show-bubble"); }, ms);
    }
    function start() {
      var s = document.createElement("script");
      s.type = "module"; s.src = "assets/model-viewer.min.js";
      s.onload = function () {
        var MV = customElements.get("model-viewer");
        if (MV) MV.meshoptDecoderLocation = new URL("assets/meshopt_decoder.js", location.href).href;
        var mv = document.createElement("model-viewer");
        mv.setAttribute("src", "assets/liat.glb");
        mv.setAttribute("alt", "ליאת, האופטומטריסטית של טופ אופטיקה, מנופפת לשלום");
        mv.setAttribute("camera-orbit", "-28deg 84deg 2.5m");
        mv.setAttribute("camera-target", "0m 0.84m 0m");
        mv.setAttribute("field-of-view", "38deg");
        mv.setAttribute("disable-zoom", ""); mv.setAttribute("disable-pan", ""); mv.setAttribute("disable-tap", "");
        mv.setAttribute("interaction-prompt", "none");
        mv.setAttribute("shadow-intensity", "0.55"); mv.setAttribute("shadow-softness", "1");
        mv.setAttribute("exposure", "1.05");
        mv.setAttribute("tone-mapping", "neutral");
        mv.setAttribute("animation-name", WAVE);
        mv.setAttribute("loading", "eager");
        mv.addEventListener("load", function () {
          box.classList.add("is-ready");
          if (reduce) { mv.pause(); mv.currentTime = 1.1; }
          else { mv.play({ repetitions: 1 }); }
          var seen = false; try { seen = sessionStorage.getItem("liatHi") === "1"; sessionStorage.setItem("liatHi", "1"); } catch (e) {}
          if (!seen) setTimeout(function () { bubble(7000); }, 700);
          if (small.matches) peekTimer = setTimeout(function () { box.classList.add("is-peek"); }, seen ? 4000 : 9000);
        });
        var next = HIPS;
        mv.addEventListener("finished", function () {
          if (reduce) return;
          mv.animationName = next;
          mv.play({ repetitions: next === HIPS ? 2 : 1 });
          next = next === HIPS ? WAVE : HIPS;
        });
        mv.addEventListener("error", function () { box.hidden = true; });
        stage.appendChild(mv);
      };
      s.onerror = function () { box.hidden = true; };
      box.hidden = false;
      document.head.appendChild(s);
    }
    stage.addEventListener("mouseenter", function () { bubble(3500); });
    stage.addEventListener("focus", function () { bubble(3500); });
    $("#liat-close").addEventListener("click", function () {
      box.classList.remove("is-ready"); setTimeout(function () { box.hidden = true; }, 400);
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    });
    function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 1) })(start, { timeout: 3000 }); }
    if (document.readyState === "complete") setTimeout(idle, 1200);
    else window.addEventListener("load", function () { setTimeout(idle, 1200); });
  })();

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
