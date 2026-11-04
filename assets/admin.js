/* Top Optica – admin dashboard (admin.html). Talks to backend/Code.gs via TopApi.
 * Session token is kept in sessionStorage only (cleared when the tab closes). */
(function () {
  "use strict";
  var C = window.SITE_CONFIG || {}, API = window.TopApi;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  var MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  var STATUS = { confirmed: "מאושר", done: "הגיע/ה", noshow: "לא הגיע/ה", cancelled: "בוטל" };
  var pad = function (n) { return ("0" + n).slice(-2); };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var parse = function (s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); };
  var addDays = function (s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  var heDate = function (s) { var d = parse(s); return "יום " + DAYS[d.getDay()] + ", " + d.getDate() + " ב" + MONTHS[d.getMonth()]; };
  var TK = "topOpticaAdmTok";
  var S = { token: null, data: null, range: "week", from: null, to: null, withCancelled: false, bookings: [] };

  var toastEl = $("#toast"), toastT;
  function toast(msg, bad) { toastEl.textContent = msg; toastEl.className = "adm-toast show" + (bad ? " bad" : ""); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.className = "adm-toast"; }, 2600); }
  function call(action, body) {
    return API.post("admin." + action, Object.assign({ token: S.token }, body || {})).catch(function (e) {
      if (e.code === "auth") { logout(true); toast("פג תוקף ההתחברות – התחברו שוב", true); }
      throw e;
    });
  }
  function busyBtn(btn, p) { if (!btn) return p; var t = btn.textContent; btn.disabled = true; btn.textContent = "שומר…"; return p.then(function (r) { btn.disabled = false; btn.textContent = t; return r; }, function (e) { btn.disabled = false; btn.textContent = t; throw e; }); }
  function fail(e) { toast(e && e.message || "שגיאה", true); }

  // ---------- Login ----------
  var loginForm = $("#login-form");
  if (!API || !API.enabled) { $("#login-off").hidden = false; $("#login-btn").disabled = true; $("#login-pw").disabled = true; }
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = $("#login-pw").value, err = $("#login-err"), btn = $("#login-btn");
    if (!pw) { err.textContent = "נא להזין סיסמה"; err.hidden = false; return; }
    err.hidden = true; btn.disabled = true; btn.textContent = "מתחבר…";
    API.post("admin.login", { password: pw }).then(function (d) {
      S.token = d.token; try { sessionStorage.setItem(TK, d.token); } catch (x) {}
      $("#login-pw").value = ""; start();
    }, function (x) { err.textContent = x.message; err.hidden = false; }).then(function () { btn.disabled = false; btn.textContent = "כניסה"; });
  });
  function logout(silent) {
    if (!silent && S.token) API.post("admin.logout", { token: S.token }).catch(function () {});
    S.token = null; try { sessionStorage.removeItem(TK); } catch (x) {}
    $("#app").hidden = true; $("#login").hidden = false; document.title = "ניהול | טופ אופטיקה";
  }
  $("#logout").addEventListener("click", function () { logout(false); });

  function start() {
    $("#login").hidden = true; $("#app").hidden = false;
    $("#tab-bookings").innerHTML = '<div class="bk-loading"><span class="bk-spin"></span><p>טוען…</p></div>';
    call("bootstrap").then(function (d) { S.data = d; S.today = d.today || ymd(new Date()); setRange(S.range); renderAll(); }, fail);
  }
  function renderAll() { renderBlocks(); renderHours(); renderServices(); renderProducts(); renderSettings(); }

  // ---------- Tabs ----------
  $$(".adm-tabs [role=tab]").forEach(function (t) {
    t.addEventListener("click", function () { selectTab(t.getAttribute("data-tab")); });
    t.addEventListener("keydown", function (e) {
      var tabs = $$(".adm-tabs [role=tab]"), i = tabs.indexOf(t);
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); var n = tabs[(i + (e.key === "ArrowLeft" ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); selectTab(n.getAttribute("data-tab")); }
    });
  });
  function selectTab(name) {
    $$(".adm-tabs [role=tab]").forEach(function (t) { var on = t.getAttribute("data-tab") === name; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    $$(".adm-panel").forEach(function (p) { p.hidden = p.id !== "tab-" + name; });
    try { history.replaceState(null, "", location.pathname + location.search + "#" + name); } catch (x) {}
  }

  // ---------- Bookings ----------
  function setRange(r) {
    S.range = r;
    if (r === "today") { S.from = S.today; S.to = S.today; }
    else if (r === "week") { S.from = S.today; S.to = addDays(S.today, 6); }
    else if (r === "month") { S.from = S.today; S.to = addDays(S.today, 30); }
    else if (r === "past") { S.from = addDays(S.today, -30); S.to = addDays(S.today, -1); }
    loadBookings();
  }
  function loadBookings() {
    var p = $("#tab-bookings");
    if (!S.bookings.length) p.innerHTML = '<div class="bk-loading"><span class="bk-spin"></span><p>טוען תורים…</p></div>';
    var from = S.from < S.today ? S.from : S.today, to = S.to > addDays(S.today, 6) ? S.to : addDays(S.today, 6);
    call("bookings", { from: from, to: to, includeCancelled: true }).then(function (d) { S.bookings = d.bookings || []; renderBookings(); }, fail);
  }
  function renderBookings() {
    var p = $("#tab-bookings"), all = S.bookings;
    var active = function (b) { return b.status !== "cancelled"; };
    var todayList = all.filter(function (b) { return b.date === S.today && active(b); });
    var weekList = all.filter(function (b) { return b.date >= S.today && b.date <= addDays(S.today, 6) && active(b); });
    var now = new Date(), nowHM = pad(now.getHours()) + ":" + pad(now.getMinutes());
    var nextB = all.filter(function (b) { return b.status === "confirmed" && (b.date > S.today || (b.date === S.today && b.time >= nowHM)); })[0];
    var list = all.filter(function (b) { return b.date >= S.from && b.date <= S.to && (S.withCancelled || active(b)); });
    if (S.range === "past") list.reverse();
    var groups = {};
    list.forEach(function (b) { (groups[b.date] = groups[b.date] || []).push(b); });
    var ranges = [["today", "היום"], ["week", "7 ימים"], ["month", "30 יום"], ["past", "עבר"]];
    var html = '<div class="adm-stats">' +
      '<div class="adm-stat"><span class="adm-stat-n">' + todayList.length + '</span><span class="adm-stat-l">תורים היום</span></div>' +
      '<div class="adm-stat"><span class="adm-stat-n">' + weekList.length + '</span><span class="adm-stat-l">ב-7 הימים הקרובים</span></div>' +
      '<div class="adm-stat adm-stat-next"><span class="adm-stat-l">התור הבא</span>' + (nextB ? '<strong dir="auto">' + esc(nextB.name) + '</strong><span>' + (nextB.date === S.today ? "היום" : esc(heDate(nextB.date))) + ' · <b dir="ltr">' + esc(nextB.time) + "</b> · " + esc(nextB.serviceName) + "</span>" : "<strong>אין תורים קרובים</strong>") + "</div>" +
      "</div>" +
      '<div class="adm-bar"><div class="adm-seg" role="group" aria-label="טווח תאריכים">' + ranges.map(function (r) { return '<button type="button" data-r="' + r[0] + '" aria-pressed="' + (S.range === r[0]) + '">' + r[1] + "</button>"; }).join("") + "</div>" +
      '<label class="adm-check"><input type="checkbox" id="b-cancelled"' + (S.withCancelled ? " checked" : "") + "> כולל מבוטלים</label>" +
      '<span class="adm-grow"></span><button type="button" class="btn btn-ghost btn-sm" id="b-refresh">רענון</button><button type="button" class="btn btn-gold btn-sm" id="b-add">+ תור ידני</button></div>';
    var dates = Object.keys(groups).sort(); if (S.range === "past") dates.reverse();
    if (!dates.length) html += '<div class="adm-empty"><p>אין תורים בטווח הזה.</p></div>';
    dates.forEach(function (d) {
      html += '<h3 class="adm-day">' + (d === S.today ? '<span class="adm-today">היום</span>' : "") + esc(heDate(d)) + ' <span class="adm-count">' + groups[d].length + "</span></h3><ul class=\"adm-list\">";
      groups[d].forEach(function (b) {
        var waNum = "972" + String(b.phone).replace(/^0/, "");
        html += '<li class="adm-bk st-' + esc(b.status) + '"><div class="adm-bk-time" dir="ltr"><strong>' + esc(b.time) + "</strong><span>" + esc(b.endTime) + "</span></div>" +
          '<div class="adm-bk-main"><p class="adm-bk-name">' + esc(b.name) + (b.source === "admin" ? ' <span class="adm-tag">ידני</span>' : ' <span class="adm-tag web">אתר</span>') + "</p>" +
          '<p class="adm-bk-svc">' + esc(b.serviceName) + " · " + esc(b.duration) + " דק׳</p>" +
          '<p class="adm-bk-contact"><a href="tel:' + esc(b.phone) + '" dir="ltr">' + esc(b.phone) + '</a><a href="https://wa.me/' + esc(waNum) + '" target="_blank" rel="noopener">וואטסאפ</a>' + (b.email ? '<a href="mailto:' + esc(b.email) + '" dir="ltr">' + esc(b.email) + "</a>" : "") + "</p>" +
          (b.notes ? '<p class="adm-bk-notes">“' + esc(b.notes) + "”</p>" : "") + "</div>" +
          '<label class="adm-status"><span class="sr">סטטוס</span><select data-id="' + esc(b.id) + '" aria-label="סטטוס התור של ' + esc(b.name) + '">' +
          Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (k === b.status ? " selected" : "") + ">" + STATUS[k] + "</option>"; }).join("") + "</select></label></li>";
      });
      html += "</ul>";
    });
    p.innerHTML = html;
    $$(".adm-seg button", p).forEach(function (b) { b.addEventListener("click", function () { setRange(b.getAttribute("data-r")); }); });
    $("#b-cancelled").addEventListener("change", function (e) { S.withCancelled = e.target.checked; renderBookings(); });
    $("#b-refresh").addEventListener("click", loadBookings);
    $("#b-add").addEventListener("click", openManual);
    $$(".adm-status select", p).forEach(function (sel) {
      sel.addEventListener("change", function () {
        var b = S.bookings.filter(function (x) { return x.id === sel.getAttribute("data-id"); })[0], prev = b.status, val = sel.value;
        var notify = false;
        if (val === "cancelled") { if (!confirm("לבטל את התור של " + b.name + "? האירוע יימחק מהיומן.")) { sel.value = prev; return; } notify = !!b.email && confirm("לשלוח ללקוח/ה מייל על הביטול?"); }
        call("setStatus", { id: b.id, status: val, notifyCustomer: notify }).then(function (d) { Object.assign(b, d.booking); toast("הסטטוס עודכן: " + STATUS[val]); renderBookings(); }, function (e) { sel.value = prev; fail(e); });
      });
    });
  }

  // Manual booking dialog
  var dlg = $("#dlg-book");
  function openManual() {
    var svcs = S.data.services;
    dlg.innerHTML = '<form class="adm-form" method="dialog" novalidate><div class="adm-dlg-h"><h2 id="dlg-book-t">תור ידני</h2><button type="button" class="bk-icon adm-x" aria-label="סגירה">×</button></div>' +
      '<label class="bk-field"><span>שירות</span><select name="serviceId">' + svcs.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + " (" + s.duration + " דק׳)" + (s.visible ? "" : " – מוסתר") + "</option>"; }).join("") + "</select></label>" +
      '<div class="adm-row"><label class="bk-field"><span>תאריך</span><input type="date" name="date" value="' + S.today + '" required></label>' +
      '<label class="bk-field"><span>שעה</span><input type="time" name="time" step="300" required list="dl-slots"></label></div><datalist id="dl-slots"></datalist>' +
      '<p class="adm-hint" id="m-slots"></p>' +
      '<div class="adm-row"><label class="bk-field"><span>שם</span><input name="name" required></label><label class="bk-field"><span>טלפון</span><input name="phone" type="tel" dir="ltr" required></label></div>' +
      '<label class="bk-field"><span>אימייל (לא חובה)</span><input name="email" type="email" dir="ltr"></label>' +
      '<label class="bk-field"><span>הערות</span><textarea name="notes" rows="2"></textarea></label>' +
      '<label class="adm-check"><input type="checkbox" name="force"> לאפשר גם מחוץ לשעות / חפיפה</label>' +
      '<label class="adm-check"><input type="checkbox" name="notifyCustomer" checked> לשלוח אישור במייל ללקוח/ה (אם יש אימייל)</label>' +
      '<p class="bk-err" role="alert" hidden></p><div class="adm-dlg-a"><button type="button" class="btn btn-ghost adm-x">ביטול</button><button type="submit" class="btn btn-gold">שמירת התור</button></div></form>';
    var f = $("form", dlg);
    function slots() {
      var box = $("#m-slots", dlg); box.textContent = "בודק שעות פנויות…";
      call("availability", { date: f.date.value, serviceId: f.serviceId.value }).then(function (d) {
        var s = (d.days[0] && d.days[0].date === f.date.value) ? d.days[0].slots : [];
        $("#dl-slots", dlg).innerHTML = s.map(function (t) { return '<option value="' + t + '">'; }).join("");
        box.innerHTML = s.length ? "שעות פנויות: " + s.slice(0, 14).map(function (t) { return '<button type="button" class="adm-pill" data-t="' + t + '">' + t + "</button>"; }).join("") + (s.length > 14 ? " …" : "") : "אין שעות פנויות ביום הזה (אפשר לסמן \"מחוץ לשעות\")";
        $$(".adm-pill", box).forEach(function (b) { b.addEventListener("click", function () { f.time.value = b.getAttribute("data-t"); }); });
      }, function () { box.textContent = ""; });
    }
    f.date.addEventListener("change", slots); f.serviceId.addEventListener("change", slots); slots();
    $$(".adm-x", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $(".bk-err", f), btn = $("button[type=submit]", f);
      var body = { serviceId: f.serviceId.value, date: f.date.value, time: f.time.value, name: f.name.value, phone: f.phone.value, email: f.email.value, notes: f.notes.value, force: f.force.checked, notifyCustomer: f.notifyCustomer.checked };
      busyBtn(btn, call("addBooking", body)).then(function () { dlg.close(); toast("התור נשמר ונוסף ליומן ✓"); loadBookings(); }, function (x) { err.textContent = x.message; err.hidden = false; });
    });
    dlg.showModal(); f.serviceId.focus();
  }

  // ---------- Blocks ----------
  function renderBlocks() {
    var p = $("#tab-blocks"), list = S.data.blocks || [];
    p.innerHTML = '<div class="adm-card"><h2>חסימת יום או שעות</h2><p class="adm-muted">חופשה, השתלמות או סידורים – הזמנים שחוסמים כאן לא יוצעו ללקוחות באתר. גם אירועים ביומן הגוגל חוסמים אוטומטית.</p>' +
      '<form class="adm-form" id="blk-form"><div class="adm-row"><label class="bk-field"><span>מתאריך</span><input type="date" name="date" required value="' + S.today + '"></label><label class="bk-field"><span>עד תאריך (לא חובה)</span><input type="date" name="until"></label></div>' +
      '<label class="adm-check"><input type="checkbox" name="allDay" checked> כל היום</label>' +
      '<div class="adm-row" id="blk-hours" hidden><label class="bk-field"><span>משעה</span><input type="time" name="from" value="10:00"></label><label class="bk-field"><span>עד שעה</span><input type="time" name="to" value="12:00"></label></div>' +
      '<label class="bk-field"><span>סיבה (פנימי)</span><input name="reason" placeholder="למשל: השתלמות"></label><div><button class="btn btn-gold btn-sm" type="submit">הוספת חסימה</button></div></form></div>' +
      '<div class="adm-card"><h2>חסימות קרובות</h2>' + (list.length ? '<ul class="adm-blocks">' + list.map(function (b) {
        return '<li><div><strong>' + esc(heDate(b.date)) + '</strong><span dir="ltr">' + (b.from ? esc(b.from) + "–" + esc(b.to) : "") + "</span>" + (b.from ? "" : "<span>כל היום</span>") + (b.reason ? '<em>' + esc(b.reason) + "</em>" : "") + '</div><button type="button" class="btn btn-ghost btn-sm" data-del="' + esc(b.id) + '">הסרה</button></li>';
      }).join("") + "</ul>" : '<p class="adm-muted">אין חסימות.</p>') + "</div>";
    var f = $("#blk-form", p);
    f.allDay.addEventListener("change", function () { $("#blk-hours", p).hidden = f.allDay.checked; });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var body = { date: f.date.value, until: f.until.value, reason: f.reason.value };
      if (!f.allDay.checked) { body.from = f.from.value; body.to = f.to.value; }
      busyBtn($("button", f), call("addBlock", body)).then(function (d) { S.data.blocks = d.blocks; renderBlocks(); toast("החסימה נוספה ✓"); }, fail);
    });
    $$("[data-del]", p).forEach(function (b) { b.addEventListener("click", function () { busyBtn(b, call("deleteBlock", { id: b.getAttribute("data-del") })).then(function (d) { S.data.blocks = d.blocks; renderBlocks(); toast("החסימה הוסרה"); }, fail); }); });
  }

  // ---------- Hours + booking rules ----------
  function renderHours() {
    var p = $("#tab-hours"), s = S.data.settings, h = s.hours || {};
    var rows = DAYS.map(function (name, d) {
      var r = h[d] || h[String(d)] || [], open = r.length > 0, a = r[0] || ["10:00", "19:00"], b = r[1];
      return '<div class="adm-hrow' + (open ? "" : " is-closed") + '" data-d="' + d + '"><label class="adm-switch"><input type="checkbox" class="h-open"' + (open ? " checked" : "") + '><span class="adm-sw" aria-hidden="true"></span><b>' + name + "</b></label>" +
        '<div class="adm-hr"><input type="time" class="h-a1" value="' + a[0] + '" aria-label="' + name + ' משעה"><span>–</span><input type="time" class="h-a2" value="' + a[1] + '" aria-label="' + name + ' עד שעה"></div>' +
        '<div class="adm-hr h-second"' + (b ? "" : " hidden") + '><span class="adm-muted">ו-</span><input type="time" class="h-b1" value="' + (b ? b[0] : "16:00") + '" aria-label="' + name + ' משמרת שנייה משעה"><span>–</span><input type="time" class="h-b2" value="' + (b ? b[1] : "19:00") + '" aria-label="' + name + ' משמרת שנייה עד שעה"></div>' +
        '<button type="button" class="adm-link h-toggle2">' + (b ? "הסרת הפסקה" : "+ הפסקה") + "</button><span class=\"adm-closed\">סגור</span></div>";
    }).join("");
    p.innerHTML = '<div class="adm-card"><h2>שעות פעילות</h2><p class="adm-muted">השעות שבהן אפשר לקבוע תור אונליין. אפשר להוסיף הפסקה (שתי משמרות ביום).</p><div class="adm-hours">' + rows + "</div></div>" +
      '<div class="adm-card"><h2>כללי הזמנה</h2><div class="adm-grid4">' +
      num("slotStep", "מרווח בין שעות התחלה (דק׳)", s.slotStep) + num("bufferMin", "הפסקה בין תורים (דק׳)", s.bufferMin) +
      num("minLeadMin", "הזמנה לפחות X דק׳ מראש", s.minLeadMin) + num("maxDaysAhead", "כמה ימים קדימה", s.maxDaysAhead) + "</div></div>" +
      '<div class="adm-save"><button type="button" class="btn btn-gold" id="h-save">שמירת שעות וכללים</button></div>';
    $$(".adm-hrow", p).forEach(function (row) {
      $(".h-open", row).addEventListener("change", function (e) { row.classList.toggle("is-closed", !e.target.checked); });
      $(".h-toggle2", row).addEventListener("click", function (e) { var sec = $(".h-second", row); sec.hidden = !sec.hidden; e.target.textContent = sec.hidden ? "+ הפסקה" : "הסרת הפסקה"; if (!sec.hidden) { $(".h-a2", row).value = "13:00"; } });
    });
    $("#h-save", p).addEventListener("click", function (e) {
      var hours = {}, bad = false;
      $$(".adm-hrow", p).forEach(function (row) {
        var d = row.getAttribute("data-d"), r = [];
        if ($(".h-open", row).checked) {
          r.push([$(".h-a1", row).value, $(".h-a2", row).value]);
          if (!$(".h-second", row).hidden) r.push([$(".h-b1", row).value, $(".h-b2", row).value]);
        }
        r.forEach(function (x) { if (!x[0] || !x[1] || x[1] <= x[0]) bad = true; });
        hours[d] = r;
      });
      if (bad) return toast("בדקו את השעות – שעת הסיום חייבת להיות אחרי שעת ההתחלה", true);
      var body = { hours: hours };
      ["slotStep", "bufferMin", "minLeadMin", "maxDaysAhead"].forEach(function (k) { body[k] = $("#s-" + k, p).value; });
      busyBtn(e.target, call("saveSettings", { settings: body })).then(function (d) { S.data.settings = d.settings; renderHours(); toast("השעות נשמרו ✓"); }, fail);
    });
  }
  function num(k, label, v) { return '<label class="bk-field"><span>' + label + '</span><input type="number" min="0" id="s-' + k + '" value="' + esc(v) + '" inputmode="numeric"></label>'; }

  // ---------- Services ----------
  function renderServices() {
    var p = $("#tab-services"), list = S.data.services || [];
    p.innerHTML = '<div class="adm-head"><div><h2>שירותים</h2><p class="adm-muted">השירותים שהלקוחות בוחרים בהזמנה. משך השירות קובע כמה זמן נחסם ביומן.</p></div><button type="button" class="btn btn-gold btn-sm" id="sv-add">+ שירות חדש</button></div>' +
      '<div class="adm-items">' + list.map(svcCard).join("") + "</div>";
    $("#sv-add", p).addEventListener("click", function () { var box = $(".adm-items", p); box.insertAdjacentHTML("afterbegin", svcCard({ id: "", name: "", duration: 30, price: "", description: "", visible: true }, -1)); wireSvc(box.firstElementChild); $("input", box.firstElementChild).focus(); });
    $$(".adm-item", p).forEach(wireSvc);
  }
  function svcCard(s) {
    return '<form class="adm-item" data-id="' + esc(s.id) + '"><div class="adm-item-grid">' +
      '<label class="bk-field adm-span2"><span>שם השירות</span><input name="name" value="' + esc(s.name) + '" required></label>' +
      '<label class="bk-field"><span>משך (דק׳)</span><input name="duration" type="number" min="5" step="5" value="' + esc(s.duration) + '"></label>' +
      '<label class="bk-field"><span>מחיר ₪ (לא חובה)</span><input name="price" inputmode="decimal" value="' + esc(s.price) + '"></label>' +
      '<label class="bk-field adm-span4"><span>תיאור קצר</span><input name="description" value="' + esc(s.description) + '"></label></div>' +
      '<div class="adm-item-a"><label class="adm-switch"><input type="checkbox" name="visible"' + (s.visible ? " checked" : "") + '><span class="adm-sw" aria-hidden="true"></span>מוצג באתר</label><span class="adm-grow"></span>' +
      (s.id ? '<button type="button" class="btn btn-ghost btn-sm" data-act="del">מחיקה</button>' : "") + '<button type="submit" class="btn btn-gold btn-sm">שמירה</button></div></form>';
  }
  function wireSvc(f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = { id: f.getAttribute("data-id"), name: f.name.value.trim(), duration: f.duration.value, price: f.price.value.trim(), description: f.description.value.trim(), visible: f.visible.checked };
      var old = S.data.services.filter(function (x) { return x.id === s.id; })[0]; if (old) s.order = old.order;
      busyBtn($("button[type=submit]", f), call("saveService", { service: s })).then(function (d) { S.data.services = d.services; renderServices(); toast("השירות נשמר ✓"); }, fail);
    });
    var del = $("[data-act=del]", f);
    if (del) del.addEventListener("click", function () {
      if (!confirm("למחוק את השירות \"" + f.name.value + "\"? (תורים קיימים לא יימחקו). אפשר גם רק להסתיר אותו.")) return;
      busyBtn(del, call("deleteService", { id: f.getAttribute("data-id") })).then(function (d) { S.data.services = d.services; renderServices(); toast("השירות נמחק"); }, fail);
    });
  }

  // ---------- Products ----------
  function renderProducts() {
    var p = $("#tab-products"), list = S.data.products || [];
    var vis = list.filter(function (x) { return x.visible; }).length;
    p.innerHTML = '<div class="adm-head"><div><h2>מוצרים</h2><p class="adm-muted">מוצרים מוצגים בדף <a href="products.html" target="_blank" rel="noopener">המוצרים</a>. כל עוד אין מוצר מוצג – הדף מציג "בקרוב" והקישור בתפריט מוסתר. כרגע ' + vis + " מוצגים.</p></div>" +
      '<button type="button" class="btn btn-gold btn-sm" id="pr-add">+ מוצר חדש</button></div>' +
      '<div class="adm-items adm-products">' + (list.length ? list.map(prCard).join("") : '<div class="adm-empty"><p>עוד אין מוצרים. לחצו "+ מוצר חדש" כדי להתחיל.</p></div>') + "</div>";
    $("#pr-add", p).addEventListener("click", function () { var box = $(".adm-items", p), em = $(".adm-empty", box); if (em) em.remove(); box.insertAdjacentHTML("afterbegin", prCard({ id: "", name: "", price: "", imageUrl: "", description: "", category: "", inStock: true, visible: true })); wirePr(box.firstElementChild); $("input[name=name]", box.firstElementChild).focus(); });
    $$(".adm-item", p).forEach(wirePr);
  }
  function prCard(x) {
    var img = /^https:\/\//i.test(x.imageUrl || "") ? x.imageUrl : "";
    return '<form class="adm-item adm-pr" data-id="' + esc(x.id) + '"><div class="adm-pr-img">' + (img ? '<img src="' + esc(img) + '" alt="">' : '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-glasses"/></svg>') + "</div>" +
      '<div class="adm-item-grid">' +
      '<label class="bk-field adm-span2"><span>שם המוצר</span><input name="name" value="' + esc(x.name) + '" required></label>' +
      '<label class="bk-field"><span>מחיר ₪</span><input name="price" inputmode="decimal" value="' + esc(x.price) + '"></label>' +
      '<label class="bk-field"><span>קטגוריה</span><input name="category" list="pr-cats" value="' + esc(x.category) + '"></label>' +
      '<label class="bk-field adm-span4"><span>קישור לתמונה (https)</span><input name="imageUrl" type="url" dir="ltr" value="' + esc(x.imageUrl) + '" placeholder="https://…"></label>' +
      '<label class="bk-field adm-span4"><span>תיאור</span><textarea name="description" rows="2">' + esc(x.description) + "</textarea></label></div>" +
      '<div class="adm-item-a"><label class="adm-switch"><input type="checkbox" name="inStock"' + (x.inStock ? " checked" : "") + '><span class="adm-sw" aria-hidden="true"></span>במלאי</label>' +
      '<label class="adm-switch"><input type="checkbox" name="visible"' + (x.visible ? " checked" : "") + '><span class="adm-sw" aria-hidden="true"></span>מוצג באתר</label><span class="adm-grow"></span>' +
      (x.id ? '<button type="button" class="btn btn-ghost btn-sm" data-act="del">מחיקה</button>' : "") + '<button type="submit" class="btn btn-gold btn-sm">שמירה</button></div>' +
      '<datalist id="pr-cats"><option value="משקפי שמש"><option value="מסגרות"><option value="עדשות מגע"><option value="אביזרים"></datalist></form>';
  }
  function wirePr(f) {
    f.imageUrl.addEventListener("change", function () { var u = f.imageUrl.value.trim(), box = $(".adm-pr-img", f); box.innerHTML = /^https:\/\//i.test(u) ? '<img src="' + esc(u) + '" alt="">' : '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-glasses"/></svg>'; });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var x = { id: f.getAttribute("data-id"), name: f.name.value.trim(), price: f.price.value.trim(), category: f.category.value.trim(), imageUrl: f.imageUrl.value.trim(), description: f.description.value.trim(), inStock: f.inStock.checked, visible: f.visible.checked };
      var old = (S.data.products || []).filter(function (o) { return o.id === x.id; })[0]; if (old) x.order = old.order;
      busyBtn($("button[type=submit]", f), call("saveProduct", { product: x })).then(function (d) { S.data.products = d.products; renderProducts(); toast("המוצר נשמר ✓"); }, fail);
    });
    var del = $("[data-act=del]", f);
    if (del) del.addEventListener("click", function () {
      if (!confirm("למחוק את המוצר \"" + f.name.value + "\"?")) return;
      busyBtn(del, call("deleteProduct", { id: f.getAttribute("data-id") })).then(function (d) { S.data.products = d.products; renderProducts(); toast("המוצר נמחק"); }, fail);
    });
  }

  // ---------- Settings ----------
  function renderSettings() {
    var p = $("#tab-settings"), s = S.data.settings;
    var sw = function (k, label) { return '<label class="adm-switch"><input type="checkbox" id="s-' + k + '"' + (s[k] ? " checked" : "") + '><span class="adm-sw" aria-hidden="true"></span>' + label + "</label>"; };
    p.innerHTML = '<div class="adm-card"><h2>התראות ויומן</h2><div class="adm-form">' +
      '<label class="bk-field"><span>מייל להתראות על תורים</span><input id="s-notifyEmail" type="email" dir="ltr" value="' + esc(s.notifyEmail) + '"></label>' +
      sw("sendCustomerEmail", "לשלוח ללקוחות אישור במייל (עם קישור ביטול וקובץ יומן)") +
      sw("useCalendarBusy", "אירועים ביומן הגוגל חוסמים שעות") +
      sw("allDayEventsBlock", "אירוע של יום שלם ביומן חוסם את כל היום") +
      '<label class="bk-field" style="max-width:260px"><span>מקסימום תורים פעילים לאותו טלפון</span><input id="s-maxActivePerPhone" type="number" min="1" value="' + esc(s.maxActivePerPhone) + '"></label>' +
      '<div><button type="button" class="btn btn-gold btn-sm" id="s-save">שמירה</button></div></div></div>' +
      '<div class="adm-card"><h2>שינוי סיסמה</h2><form class="adm-form" id="pw-form" style="max-width:420px">' +
      '<label class="bk-field"><span>סיסמה נוכחית</span><input type="password" name="old" autocomplete="current-password" required></label>' +
      '<label class="bk-field"><span>סיסמה חדשה (8 תווים לפחות)</span><input type="password" name="nw" autocomplete="new-password" minlength="8" required></label>' +
      '<div><button class="btn btn-ghost btn-sm" type="submit">עדכון סיסמה</button></div></form></div>' +
      (API.demo ? "" : '<p class="adm-muted">היומן והמיילים מחוברים לחשבון הגוגל של הקליניקה (' + esc(C.email || "") + ").</p>");
    $("#s-save", p).addEventListener("click", function (e) {
      var body = { notifyEmail: $("#s-notifyEmail", p).value.trim(), maxActivePerPhone: $("#s-maxActivePerPhone", p).value };
      ["sendCustomerEmail", "useCalendarBusy", "allDayEventsBlock"].forEach(function (k) { body[k] = $("#s-" + k, p).checked; });
      busyBtn(e.target, call("saveSettings", { settings: body })).then(function (d) { S.data.settings = d.settings; toast("ההגדרות נשמרו ✓"); }, fail);
    });
    $("#pw-form", p).addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target;
      if (f.nw.value.length < 8) return toast("הסיסמה החדשה קצרה מדי", true);
      busyBtn($("button", f), call("changePassword", { oldPassword: f.old.value, newPassword: f.nw.value })).then(function () { toast("הסיסמה עודכנה – התחברו מחדש"); logout(true); }, fail);
    });
  }

  // ---------- Boot ----------
  try { S.token = sessionStorage.getItem(TK); } catch (x) {}
  if (S.token && API && API.enabled) start();
  var h = location.hash.replace("#", "");
  if (h && $("#tab-" + h)) selectTab(h);
})();
