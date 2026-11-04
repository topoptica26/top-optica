/* Top Optica – online booking modal (service → date → time → details → confirmation)
 * Talks to backend/Code.gs through window.TopApi (assets/api.js).
 * If SITE_CONFIG.bookingApiUrl is empty, nothing changes: [data-book] links keep their
 * phone / WhatsApp href and [data-book-only] elements stay hidden. */
(function () {
  "use strict";
  var C = window.SITE_CONFIG || {}, API = window.TopApi;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"], DSHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  var MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  var parse = function (s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); };
  var heDate = function (s) { var d = parse(s); return "יום " + DAYS[d.getDay()] + ", " + d.getDate() + " ב" + MONTHS[d.getMonth()]; };
  var waBase = C.whatsappNumber ? "https://wa.me/" + String(C.whatsappNumber).replace(/\D/g, "") : "";
  var wa = function (text) { return waBase ? waBase + "?text=" + encodeURIComponent(text) : "#contact"; };

  // ---- Products nav link: shown only when there are products
  function revealProducts(n) { if (n > 0) $$("[data-products-link]").forEach(function (el) { el.hidden = false; }); }
  if (C.products && C.products.length) revealProducts(C.products.length);
  else if (API && API.enabled) API.get("products").then(function (d) { revealProducts((d.products || []).length); }, function () {});

  if (!API || !API.enabled) return; // graceful fallback: links stay phone / WhatsApp

  // ---- Activate booking CTAs
  $$("[data-book-only]").forEach(function (el) { el.hidden = false; });
  document.documentElement.classList.add("has-booking");
  var stage = $("#liat-stage"), bub = $("#liat-bubble");
  if (stage) { stage.setAttribute("data-book", ""); stage.removeAttribute("target"); stage.setAttribute("aria-label", "ליאת, האופטומטריסטית – קביעת תור אונליין"); }
  if (bub) bub.textContent = "שלום! אפשר לקבוע תור אונליין 😊";

  var st = { step: 1, services: null, svc: null, days: null, date: null, time: null, opened: 0, busy: false };

  // ---- Build dialog
  var dlg = document.createElement("dialog");
  dlg.className = "bk"; dlg.id = "booking"; dlg.setAttribute("aria-labelledby", "bk-title");
  dlg.innerHTML =
    '<div class="bk-panel">' +
      '<header class="bk-head">' +
        '<button type="button" class="bk-icon bk-back" aria-label="חזרה לשלב הקודם"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="bk-titles"><p class="bk-kicker">TOP OPTICA</p><h2 id="bk-title">קביעת תור</h2></div>' +
        '<button type="button" class="bk-icon bk-x" aria-label="סגירה"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      '</header>' +
      '<ol class="bk-steps" aria-label="שלבי ההזמנה"><li data-s="1"><span>1</span>שירות</li><li data-s="2"><span>2</span>מועד</li><li data-s="3"><span>3</span>פרטים</li><li data-s="4"><span>4</span>אישור</li></ol>' +
      '<div class="bk-body" tabindex="-1"></div>' +
      '<footer class="bk-foot" hidden><div class="bk-sum"></div><button type="button" class="btn btn-gold bk-next">המשך</button></footer>' +
      '<p class="bk-live" aria-live="polite" role="status"></p>' +
    '</div>';
  document.body.appendChild(dlg);
  var body = $(".bk-body", dlg), foot = $(".bk-foot", dlg), next = $(".bk-next", dlg), sum = $(".bk-sum", dlg), live = $(".bk-live", dlg);
  var say = function (t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); };

  function open(serviceId) {
    st.opened = Date.now();
    if (st.step === 4 || st.step === 0) reset();
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.body.classList.add("bk-lock");
    if (serviceId) st.pendingSvc = serviceId;
    render();
  }
  function close() { if (dlg.open && dlg.close) dlg.close(); dlg.removeAttribute("open"); document.body.classList.remove("bk-lock"); }
  function reset() { st.step = 1; st.svc = null; st.days = null; st.date = null; st.time = null; st.done = null; st.cancel = null; }
  dlg.addEventListener("close", function () { document.body.classList.remove("bk-lock"); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  $(".bk-x", dlg).addEventListener("click", close);
  $(".bk-back", dlg).addEventListener("click", function () { if (st.step > 1 && st.step < 4) { st.step--; render(); } });
  next.addEventListener("click", function () {
    if (st.step === 2 && st.time) { st.step = 3; render(); }
    else if (st.step === 3) { var f = $("form", body); if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); }
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-book]");
    if (!t) return;
    e.preventDefault(); document.body.classList.remove("nav-open");
    open(t.getAttribute("data-book") || null);
  });

  function loading(msg) { body.innerHTML = '<div class="bk-loading"><span class="bk-spin" aria-hidden="true"></span><p>' + esc(msg || "טוען…") + "</p></div>"; }
  function errorBox(err, retry) {
    body.innerHTML = '<div class="bk-error"><p class="bk-error-t">' + esc(err && err.message || "משהו השתבש") + '</p><div class="bk-error-a">' +
      (retry ? '<button type="button" class="btn btn-gold btn-sm bk-retry">נסו שוב</button>' : "") +
      '<a class="btn btn-ghost btn-sm" href="' + esc(wa(C.whatsappMessage || "שלום, אשמח לקבוע תור")) + '" target="_blank" rel="noopener">קביעה בוואטסאפ</a></div></div>';
    var r = $(".bk-retry", body); if (r) r.addEventListener("click", retry);
  }

  function render() {
    dlg.setAttribute("data-step", st.step);
    $$(".bk-steps li", dlg).forEach(function (li) {
      var s = +li.getAttribute("data-s");
      li.classList.toggle("is-on", s === st.step); li.classList.toggle("is-done", s < st.step);
      if (s === st.step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    $(".bk-back", dlg).style.visibility = st.step > 1 && st.step < 4 ? "visible" : "hidden";
    foot.hidden = !(st.step === 2 || st.step === 3);
    if (st.cancel) return renderCancel();
    if (st.step === 1) return renderServices();
    if (st.step === 2) return renderDates();
    if (st.step === 3) return renderDetails();
    if (st.step === 4) return renderDone();
  }
  function updateFoot() {
    if (st.step === 2) {
      next.textContent = "המשך"; next.disabled = !st.time;
      sum.innerHTML = st.time ? "<strong>" + esc(st.svc.name) + "</strong><span>" + esc(heDate(st.date)) + " · " + esc(st.time) + "</span>" : "<span>בחרו יום ושעה</span>";
    } else if (st.step === 3) {
      next.textContent = st.busy ? "שולח…" : "אישור התור"; next.disabled = st.busy;
      sum.innerHTML = "<strong>" + esc(st.svc.name) + "</strong><span>" + esc(heDate(st.date)) + " · " + esc(st.time) + "</span>";
    }
  }

  // Step 1 – service
  function renderServices() {
    if (!st.services) {
      loading("טוען שירותים…");
      API.get("services").then(function (d) { st.services = d.services || []; render(); }, function (e) { errorBox(e, render); });
      return;
    }
    if (st.pendingSvc) { var pre = st.services.filter(function (s) { return s.id === st.pendingSvc; })[0]; st.pendingSvc = null; if (pre) { st.svc = pre; st.step = 2; return render(); } }
    body.innerHTML = '<h3 class="bk-h">איזה שירות תרצו?</h3><div class="bk-svcs" role="radiogroup" aria-label="בחירת שירות">' +
      st.services.map(function (s, i) {
        var on = st.svc && st.svc.id === s.id;
        return '<button type="button" role="radio" aria-checked="' + on + '" class="bk-svc' + (on ? " is-on" : "") + '" data-i="' + i + '" style="--d:' + i * 40 + 'ms">' +
          '<span class="bk-svc-main"><span class="bk-svc-name">' + esc(s.name) + "</span>" + (s.description ? '<span class="bk-svc-desc">' + esc(s.description) + "</span>" : "") + "</span>" +
          '<span class="bk-svc-meta"><span class="bk-chip">' + esc(s.duration) + " דק׳</span>" + (s.price ? '<span class="bk-price">₪' + esc(s.price) + "</span>" : "") + "</span></button>";
      }).join("") + "</div>";
    $$(".bk-svc", body).forEach(function (b) {
      b.addEventListener("click", function () {
        var s = st.services[+b.getAttribute("data-i")];
        if (!st.svc || st.svc.id !== s.id) { st.days = null; st.date = null; st.time = null; }
        st.svc = s; st.step = 2; render(); say("נבחר: " + s.name + ". בחרו יום");
      });
    });
    focusBody();
  }

  // Step 2 – date strip + time slots
  function renderDates() {
    updateFoot();
    if (!st.days) {
      loading("בודקים שעות פנויות…");
      API.get("days", { serviceId: st.svc.id }).then(function (d) {
        st.days = d.days || [];
        if (!st.date) { var first = st.days.filter(function (x) { return x.slots.length; })[0]; st.date = first ? first.date : null; }
        render();
      }, function (e) { errorBox(e, render); });
      return;
    }
    var anyOpen = st.days.some(function (x) { return x.slots.length; });
    var html = '<h3 class="bk-h">מתי נוח לכם?</h3><p class="bk-sub">' + esc(st.svc.name) + " · " + esc(st.svc.duration) + " דק׳</p>";
    if (!anyOpen) {
      html += '<div class="bk-empty"><p>אין כרגע שעות פנויות אונליין לשירות הזה.</p><a class="btn btn-gold btn-sm" href="' + esc(wa("שלום, אשמח לתאם תור ל" + st.svc.name)) + '" target="_blank" rel="noopener">תיאום בוואטסאפ</a></div>';
      body.innerHTML = html; return;
    }
    var month = "";
    html += '<div class="bk-strip-wrap"><button type="button" class="bk-strip-nav prev" aria-label="ימים קודמים">›</button><div class="bk-strip" role="listbox" aria-label="בחירת יום">';
    st.days.forEach(function (d) {
      var dt = parse(d.date), m = MONTHS[dt.getMonth()], on = d.date === st.date, ok = d.slots.length > 0;
      if (m !== month) { html += '<span class="bk-month" aria-hidden="true">' + m + "</span>"; month = m; }
      html += '<button type="button" role="option" class="bk-day' + (on ? " is-on" : "") + '" data-date="' + d.date + '" aria-selected="' + on + '"' + (ok ? "" : " disabled") +
        ' aria-label="' + esc(heDate(d.date)) + (ok ? ", " + d.slots.length + " שעות פנויות" : ", אין שעות פנויות") + '">' +
        '<span class="bk-dw">' + DSHORT[dt.getDay()] + '</span><span class="bk-dn">' + dt.getDate() + "</span>" +
        '<span class="bk-dot" aria-hidden="true"></span></button>';
    });
    html += '</div><button type="button" class="bk-strip-nav next" aria-label="ימים נוספים">‹</button></div><div class="bk-slots" id="bk-slots"></div>';
    body.innerHTML = html;
    var strip = $(".bk-strip", body);
    $$(".bk-day", body).forEach(function (b) {
      b.addEventListener("click", function () {
        st.date = b.getAttribute("data-date"); st.time = null;
        $$(".bk-day", body).forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on); });
        renderSlots(); updateFoot(); say(heDate(st.date));
      });
    });
    $(".bk-strip-nav.prev", body).addEventListener("click", function () { strip.scrollBy({ left: 240, behavior: "smooth" }); });
    $(".bk-strip-nav.next", body).addEventListener("click", function () { strip.scrollBy({ left: -240, behavior: "smooth" }); });
    var cur = $(".bk-day.is-on", body); if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
    renderSlots();
  }
  function renderSlots() {
    var box = $("#bk-slots", body); if (!box) return;
    var day = st.days.filter(function (d) { return d.date === st.date; })[0];
    if (!day) { box.innerHTML = ""; return; }
    var groups = [["בוקר", function (m) { return m < 720; }], ["צהריים", function (m) { return m >= 720 && m < 960; }], ["ערב", function (m) { return m >= 960; }]];
    var toM = function (t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; };
    box.innerHTML = '<p class="bk-date-t">' + esc(heDate(day.date)) + "</p>" + groups.map(function (g) {
      var s = day.slots.filter(function (t) { return g[1](toM(t)); });
      if (!s.length) return "";
      return '<div class="bk-sg"><p class="bk-sg-t">' + g[0] + '</p><div class="bk-sg-list" role="radiogroup" aria-label="' + g[0] + '">' + s.map(function (t, i) {
        var on = t === st.time;
        return '<button type="button" role="radio" aria-checked="' + on + '" class="bk-slot' + (on ? " is-on" : "") + '" data-t="' + t + '" style="--d:' + i * 18 + 'ms" dir="ltr">' + t + "</button>";
      }).join("") + "</div></div>";
    }).join("");
    $$(".bk-slot", box).forEach(function (b) {
      b.addEventListener("click", function () {
        st.time = b.getAttribute("data-t");
        $$(".bk-slot", box).forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", on); });
        updateFoot(); say("נבחרה השעה " + st.time); next.focus({ preventScroll: true });
      });
    });
  }

  // Step 3 – details
  var saved = { name: "", phone: "", email: "", notes: "" };
  function renderDetails() {
    updateFoot();
    body.innerHTML = '<h3 class="bk-h">כמעט סיימנו</h3><p class="bk-sub">' + esc(st.svc.name) + " · " + esc(heDate(st.date)) + " · <span dir=\"ltr\">" + esc(st.time) + "</span></p>" +
      '<form class="bk-form" novalidate>' +
        '<label class="bk-field"><span>שם מלא <b aria-hidden="true">*</b></span><input name="name" autocomplete="name" required minlength="2" maxlength="80" value="' + esc(saved.name) + '"></label>' +
        '<label class="bk-field"><span>טלפון נייד <b aria-hidden="true">*</b></span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required dir="ltr" placeholder="050-0000000" value="' + esc(saved.phone) + '"></label>' +
        '<label class="bk-field"><span>אימייל <em>(לקבלת אישור – לא חובה)</em></span><input name="email" type="email" inputmode="email" autocomplete="email" dir="ltr" maxlength="120" value="' + esc(saved.email) + '"></label>' +
        '<label class="bk-field"><span>הערות <em>(לא חובה)</em></span><textarea name="notes" rows="2" maxlength="500" placeholder="למשל: מרכיב/ה עדשות מגע, בדיקה לילד/ה…">' + esc(saved.notes) + "</textarea></label>" +
        '<label class="bk-hp" aria-hidden="true">אתר<input name="website" tabindex="-1" autocomplete="off"></label>' +
        '<p class="bk-err" role="alert" hidden></p>' +
        '<p class="bk-note">הפרטים משמשים לתיאום התור בלבד.</p>' +
        '<button type="submit" hidden></button>' +
      "</form>";
    var f = $("form", body), err = $(".bk-err", f);
    $$("input,textarea", f).forEach(function (i) { i.addEventListener("input", function () { saved[i.name] = i.value; i.removeAttribute("aria-invalid"); }); });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (st.busy) return;
      var v = { name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), notes: f.notes.value.trim(), website: f.website.value };
      var bad = null;
      if (v.name.length < 2) bad = [f.name, "נא למלא שם מלא"];
      else if (!/^0\d{8,9}$/.test(v.phone.replace(/[\s\-()]/g, "").replace(/^\+972/, "0"))) bad = [f.phone, "נא למלא מספר טלפון תקין"];
      else if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) bad = [f.email, "כתובת האימייל לא תקינה"];
      if (bad) { err.textContent = bad[1]; err.hidden = false; bad[0].setAttribute("aria-invalid", "true"); bad[0].focus(); return; }
      err.hidden = true; st.busy = true; updateFoot();
      API.post("book", Object.assign(v, { serviceId: st.svc.id, date: st.date, time: st.time, elapsed: Date.now() - st.opened })).then(function (d) {
        st.busy = false; st.done = d.booking; st.done.email = v.email; st.step = 4; render(); say("התור נקבע בהצלחה");
      }, function (e2) {
        st.busy = false; updateFoot();
        err.textContent = e2.message; err.hidden = false;
        if (e2.code === "slot_taken") { st.days = null; st.time = null; setTimeout(function () { st.step = 2; render(); }, 1600); }
      });
    });
    focusBody(f.name);
  }

  // Step 4 – confirmation
  function gcal(b) {
    var d = b.date.replace(/-/g, ""), s = b.time.replace(":", "") + "00", e = b.endTime.replace(":", "") + "00";
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(b.serviceName + " – טופ אופטיקה") +
      "&dates=" + d + "T" + s + "/" + d + "T" + e + "&ctz=Asia/Jerusalem&location=" + encodeURIComponent(C.address || "");
  }
  function renderDone() {
    var b = st.done;
    body.innerHTML = '<div class="bk-done"><div class="bk-check" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>' +
      '<h3 class="bk-h">התור נקבע!</h3><p class="bk-sub">נתראה בקליניקה, ' + esc(b.name.split(" ")[0]) + " 👓</p>" +
      '<dl class="bk-card"><div><dt>שירות</dt><dd>' + esc(b.serviceName) + "</dd></div><div><dt>מועד</dt><dd>" + esc(heDate(b.date)) + ' · <span dir="ltr">' + esc(b.time) + "</span></dd></div>" +
      "<div><dt>כתובת</dt><dd>" + esc(C.address || "") + '</dd></div><div><dt>מספר תור</dt><dd dir="ltr">' + esc(b.id) + "</dd></div></dl>" +
      (b.email ? '<p class="bk-note">שלחנו אישור עם קישור לביטול אל <span dir="ltr">' + esc(b.email) + "</span></p>" : '<p class="bk-note">לשינוי או ביטול – צרו קשר בוואטסאפ או בטלפון.</p>') +
      '<div class="bk-done-a"><a class="btn btn-gold" href="' + esc(gcal(b)) + '" target="_blank" rel="noopener">הוספה ליומן</a>' +
      (C.wazeUrl ? '<a class="btn btn-ghost" href="' + esc(C.wazeUrl) + '" target="_blank" rel="noopener">ניווט ב-Waze</a>' : "") +
      '<button type="button" class="btn btn-ghost bk-close2">סגירה</button></div></div>';
    $(".bk-close2", body).addEventListener("click", close);
    focusBody();
  }

  // Cancel flow: ?cancel=<token> (link from the confirmation email)
  function renderCancel() {
    $(".bk-steps", dlg).hidden = true; $(".bk-back", dlg).style.visibility = "hidden"; foot.hidden = true;
    $("#bk-title").textContent = "ביטול תור";
    var c = st.cancel;
    if (!c.booking && !c.error) {
      loading("מאתרים את התור…");
      API.post("lookup", { token: c.token }).then(function (d) { c.booking = d.booking; render(); }, function (e) { c.error = e; render(); });
      return;
    }
    if (c.error) return errorBox(c.error);
    var b = c.booking;
    var card = '<dl class="bk-card"><div><dt>שירות</dt><dd>' + esc(b.serviceName) + "</dd></div><div><dt>מועד</dt><dd>" + esc(heDate(b.date)) + ' · <span dir="ltr">' + esc(b.time) + "</span></dd></div><div><dt>שם</dt><dd>" + esc(b.name) + "</dd></div></dl>";
    if (b.status === "cancelled") {
      body.innerHTML = '<div class="bk-done"><h3 class="bk-h">התור בוטל</h3>' + card + '<div class="bk-done-a"><button type="button" class="btn btn-gold bk-new">קביעת תור חדש</button></div></div>';
      $(".bk-new", body).addEventListener("click", function () { st.cancel = null; $(".bk-steps", dlg).hidden = false; $("#bk-title").textContent = "קביעת תור"; reset(); render(); });
      return;
    }
    body.innerHTML = '<div class="bk-done"><h3 class="bk-h">לבטל את התור?</h3>' + card + '<p class="bk-err" role="alert" hidden></p><div class="bk-done-a"><button type="button" class="btn btn-danger bk-do">כן, לבטל את התור</button><button type="button" class="btn btn-ghost bk-keep">השארת התור</button></div></div>';
    $(".bk-keep", body).addEventListener("click", function () { history.replaceState(null, "", location.pathname); close(); });
    $(".bk-do", body).addEventListener("click", function (e) {
      e.target.disabled = true; e.target.textContent = "מבטל…";
      API.post("cancel", { token: c.token }).then(function (d) { c.booking = d.booking; history.replaceState(null, "", location.pathname); render(); say("התור בוטל"); },
        function (er) { var p = $(".bk-err", body); p.textContent = er.message; p.hidden = false; e.target.disabled = false; e.target.textContent = "כן, לבטל את התור"; });
    });
  }

  function focusBody(el) { setTimeout(function () { (el || body).focus({ preventScroll: true }); body.scrollTop = 0; }, 30); }

  // Deep links: #book / ?book=1 open the modal, ?cancel=TOKEN opens the cancel view
  var qs = new URLSearchParams(location.search);
  if (qs.get("cancel")) { st.cancel = { token: qs.get("cancel") }; open(); }
  else if (qs.get("book") === "1" || location.hash === "#book") open(qs.get("service"));
})();
