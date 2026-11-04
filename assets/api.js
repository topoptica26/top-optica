/* Top Optica – API client for the Google Apps Script backend (backend/Code.gs)
 * - Real mode: SITE_CONFIG.bookingApiUrl = the Web App URL (…/exec)
 * - Demo mode: ?demo=1 in the URL or SITE_CONFIG.demo = true → fake in-memory data, for local
 *   previews/screenshots ONLY. Off by default; nothing is sent anywhere in demo mode.
 * POST uses Content-Type text/plain so the browser does not send a CORS preflight. */
(function () {
  "use strict";
  var C = window.SITE_CONFIG || {};
  var qs = new URLSearchParams(location.search);
  var demo = C.demo === true || qs.get("demo") === "1";
  var url = String(C.bookingApiUrl || "").trim();
  var enabled = demo || /^https:\/\/script\.google(usercontent)?\.com\//.test(url);

  function fail(code, message) { var e = new Error(message || "שגיאה"); e.code = code; return e; }
  function unwrap(d) { if (!d || d.ok === false) throw fail(d && d.error || "server", d && d.message || "שגיאה בשרת"); return d; }
  function net() { throw fail("network", "אין חיבור לשרת כרגע. נסו שוב או קבעו בוואטסאפ"); }

  function get(action, params) {
    if (demo) return Mock.call(action, params || {});
    var p = new URLSearchParams(Object.assign({ action: action }, params || {}));
    return fetch(url + "?" + p.toString(), { method: "GET", redirect: "follow" }).then(function (r) { return r.json(); }, net).then(unwrap);
  }
  function post(action, body) {
    var b = Object.assign({}, body || {}, { action: action });
    if (demo) return Mock.call(action, b);
    return fetch(url, { method: "POST", redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(b) })
      .then(function (r) { return r.json(); }, net).then(unwrap);
  }

  /* ---------------- DEMO MOCK (in-memory, sessionStorage) ---------------- */
  var Mock = !demo ? null : (function () {
    var KEY = "topOpticaDemo_v1";
    var pad = function (n) { return ("0" + n).slice(-2); };
    var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
    var addDays = function (s, n) { var p = s.split("-"); var d = new Date(+p[0], p[1] - 1, +p[2] + n); return ymd(d); };
    var dow = function (s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]).getDay(); };
    var toMin = function (h) { var p = h.split(":"); return +p[0] * 60 + +p[1]; };
    var toHM = function (m) { return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };
    var uid = function (p) { return p + Math.random().toString(36).slice(2, 10); };
    var today = function () { return ymd(new Date()); };
    function seed() {
      var t = today(), H = [["10:00", "19:00"]];
      var st = {
        settings: { hours: { 0: H, 1: H, 2: H, 3: H, 4: H, 5: [], 6: [] }, slotStep: 15, bufferMin: 10, maxDaysAhead: 30, minLeadMin: 60, maxActivePerPhone: 2, notifyEmail: "Topoptica26@gmail.com", calendarId: "primary", useCalendarBusy: true, allDayEventsBlock: false, sendCustomerEmail: true, siteUrl: "https://topoptica26.github.io/top-optica/" },
        services: [
          { id: "eye-exam", name: "בדיקת ראייה ממוחשבת", duration: 30, price: "", description: "בדיקה מקיפה בציוד ממוחשב, כולל הסבר מלא על התוצאות", visible: true, order: 1 },
          { id: "contacts", name: "התאמת עדשות מגע", duration: 45, price: "", description: "התאמה, הדרכה ומעקב לעדשות יומיות, חודשיות וטוריות", visible: true, order: 2 },
          { id: "kids", name: "בדיקת ראייה לילדים", duration: 30, price: "", description: "בדיקה סבלנית ומותאמת לילדים", visible: true, order: 3 },
          { id: "multifocal", name: "התאמת עדשות מולטיפוקל", duration: 45, price: "", description: "ראייה נוחה בכל המרחקים", visible: true, order: 4 },
          { id: "pressure", name: "בדיקת לחץ תוך עיני", duration: 15, price: "", description: "מדידת לחץ תוך עיני", visible: true, order: 5 },
          { id: "topography", name: "מיפוי קרנית", duration: 20, price: "", description: "מיפוי מפורט של פני הקרנית", visible: true, order: 6 },
          { id: "frames", name: "ייעוץ ובחירת מסגרת", duration: 30, price: "", description: "בחירת מסגרת ועדשות בליווי אישי", visible: true, order: 7 }
        ],
        products: [], blocks: [], bookings: []
      };
      if (qs.get("demoProducts") === "1") st.products = [
        { id: "P1", name: "משקפי שמש קלאסיים", price: "450", imageUrl: "", description: "מסגרת אצטט בגוון צב, עדשות מקוטבות עם הגנת UV400.", category: "משקפי שמש", inStock: true, visible: true, order: 1 },
        { id: "P2", name: "עדשות מגע יומיות – 30 יח׳", price: "120", imageUrl: "", description: "נוחות לאורך כל היום, להחלפה יומית.", category: "עדשות מגע", inStock: true, visible: true, order: 2 },
        { id: "P3", name: "מסגרת ראייה טיטניום", price: "690", imageUrl: "", description: "קלה במיוחד, עמידה וגמישה.", category: "מסגרות", inStock: false, visible: true, order: 3 },
        { id: "P4", name: "תמיסה לעדשות 360 מ״ל", price: "45", imageUrl: "", description: "ניקוי, חיטוי ושימון.", category: "אביזרים", inStock: true, visible: false, order: 4 }
      ];
      var people = [["נועה לוי", "0521234567", "eye-exam"], ["דוד כהן", "0549876543", "contacts"], ["מיכל אברהם", "0505551234", "kids"], ["יוסי מזרחי", "0523334455", "multifocal"], ["שירה פרץ", "0547778899", "eye-exam"], ["אבי ביטון", "0501112233", "pressure"]];
      var times = ["10:30", "12:00", "14:15", "16:00", "17:30", "11:15"];
      var d = t, made = 0;
      for (var i = 0; i < 10 && made < 9; i++) {
        if (dow(d) <= 4) {
          for (var k = 0; k < (i === 0 ? 4 : 1) && made < 9; k++) {
            var pp = people[made % people.length], sv = st.services.filter(function (s) { return s.id === pp[2]; })[0];
            st.bookings.push({ id: "B" + d.replace(/-/g, "").slice(2) + "-" + (100 + made), createdAt: t + "T09:00", date: d, time: times[made % times.length], endTime: toHM(toMin(times[made % times.length]) + sv.duration), serviceId: sv.id, serviceName: sv.name, duration: sv.duration, name: pp[0], phone: pp[1], email: made % 2 ? "" : "demo@example.com", notes: made === 1 ? "מרכיב עדשות חודשיות" : "", status: (i === 0 && k === 0) ? "done" : "confirmed", source: made === 3 ? "admin" : "web", token: uid("t"), eventId: "", updatedAt: t + "T09:00" });
            made++;
          }
        }
        d = addDays(d, 1);
      }
      st.blocks.push({ id: "X1", date: addDays(t, 6), from: "", to: "", reason: "השתלמות מקצועית", createdAt: t });
      return st;
    }
    var st;
    try { st = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
    if (!st || qs.get("demoReset") === "1") st = seed();
    function save() { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
    save();
    function slotsFor(date, svc, excludeId) {
      var S = st.settings, t = today();
      if (date < t || date > addDays(t, S.maxDaysAhead)) return { open: false, slots: [] };
      var ranges = (S.hours[dow(date)] || []).map(function (r) { return [toMin(r[0]), toMin(r[1])]; });
      var busy = [], full = false;
      st.bookings.forEach(function (b) { if (b.date === date && b.status !== "cancelled" && b.id !== excludeId) busy.push([toMin(b.time), toMin(b.time) + +b.duration]); });
      st.blocks.forEach(function (b) { if (b.date !== date) return; if (!b.from) full = true; else busy.push([toMin(b.from), toMin(b.to)]); });
      var now = new Date(), earliest = date === t ? now.getHours() * 60 + now.getMinutes() + S.minLeadMin : 0, out = [];
      if (!full) ranges.forEach(function (r) {
        for (var m = r[0]; m + svc.duration <= r[1]; m += S.slotStep) {
          if (m < earliest) continue;
          var ok = busy.every(function (b) { return !(m < b[1] + S.bufferMin && m + svc.duration + S.bufferMin > b[0]); });
          if (ok) out.push(toHM(m));
        }
      });
      return { open: ranges.length > 0 && !full, slots: out };
    }
    function svcById(id) { var s = st.services.filter(function (x) { return x.id === id; })[0]; if (!s) throw fail("bad_service", "השירות לא נמצא"); return s; }
    function pub(b) { return { id: b.id, date: b.date, time: b.time, endTime: b.endTime, serviceName: b.serviceName, duration: b.duration, name: b.name, status: b.status }; }
    function strip(b) { var o = Object.assign({}, b); delete o.token; return o; }
    function book(b, admin) {
      if (!admin && b.website) throw fail("spam", "הבקשה נחסמה");
      if (!b.date || !b.time) throw fail("bad_slot", "יש לבחור תאריך ושעה");
      if (!b.name || String(b.name).trim().length < 2) throw fail("bad_name", "נא למלא שם מלא");
      var phone = String(b.phone || "").replace(/\D/g, "").replace(/^972/, "0");
      if (!/^0\d{8,9}$/.test(phone)) throw fail("bad_phone", "מספר הטלפון לא תקין");
      var svc = svcById(b.serviceId);
      if (!(admin && b.force) && slotsFor(b.date, svc).slots.indexOf(b.time) < 0) throw fail("slot_taken", "השעה הזאת כבר לא פנויה, בחרו שעה אחרת");
      var rec = { id: "B" + b.date.replace(/-/g, "").slice(2) + "-" + Math.random().toString(16).slice(2, 6).toUpperCase(), createdAt: today(), date: b.date, time: b.time, endTime: toHM(toMin(b.time) + svc.duration), serviceId: svc.id, serviceName: svc.name, duration: svc.duration, name: String(b.name).trim(), phone: phone, email: b.email || "", notes: b.notes || "", status: "confirmed", source: admin ? "admin" : "web", token: uid("t"), eventId: "", updatedAt: today() };
      st.bookings.push(rec); save();
      return { booking: pub(rec), token: rec.token };
    }
    function sorted(a, key) { return a.slice().sort(function (x, y) { return key(x) < key(y) ? -1 : 1; }); }
    var H = {
      services: function () { return { services: sorted(st.services.filter(function (s) { return s.visible; }), function (s) { return s.order; }) }; },
      products: function () { return { products: sorted(st.products.filter(function (p) { return p.visible; }), function (p) { return p.order; }) }; },
      config: function () { return { hours: st.settings.hours, maxDaysAhead: st.settings.maxDaysAhead, today: today() }; },
      days: function (p) { var svc = svcById(p.serviceId), out = [], d = today(); for (var i = 0; i <= st.settings.maxDaysAhead; i++) { var r = slotsFor(d, svc); out.push({ date: d, open: r.open, slots: r.slots }); d = addDays(d, 1); } return { days: out }; },
      availability: function (p) { return { date: p.date, slots: slotsFor(p.date, svcById(p.serviceId)).slots }; },
      book: function (b) { return book(b, false); },
      lookup: function (b) { var r = st.bookings.filter(function (x) { return x.token === b.token; })[0]; if (!r) throw fail("not_found", "התור לא נמצא"); return { booking: pub(r) }; },
      cancel: function (b) { var r = st.bookings.filter(function (x) { return x.token === b.token; })[0]; if (!r) throw fail("not_found", "התור לא נמצא"); r.status = "cancelled"; save(); return { booking: pub(r) }; },
      "admin.login": function (b) { if (!b.password) throw fail("bad_password", "סיסמה שגויה"); return { token: "demo-token", expiresIn: 21600 }; },
      "admin.logout": function () { return {}; },
      "admin.bootstrap": function () { return { settings: st.settings, services: sorted(st.services, function (s) { return s.order; }), products: sorted(st.products, function (p) { return p.order; }), blocks: H["admin.blocks"]().blocks, today: today() }; },
      "admin.bookings": function (b) { return { bookings: sorted(st.bookings.filter(function (r) { return r.date >= b.from && r.date <= b.to && (b.includeCancelled || r.status !== "cancelled"); }), function (r) { return r.date + r.time; }).map(strip) }; },
      "admin.setStatus": function (b) { var r = st.bookings.filter(function (x) { return x.id === b.id; })[0]; r.status = b.status; save(); return { booking: strip(r) }; },
      "admin.addBooking": function (b) { return book(b, true); },
      "admin.availability": function (b) { var r = slotsFor(b.date, svcById(b.serviceId)); return { days: [{ date: b.date, open: r.open, slots: r.slots }] }; },
      "admin.blocks": function () { return { blocks: sorted(st.blocks.filter(function (x) { return x.date >= today(); }), function (x) { return x.date + x.from; }) }; },
      "admin.addBlock": function (b) { var d = b.date, until = b.until || b.date; while (d <= until) { st.blocks.push({ id: uid("X"), date: d, from: b.from || "", to: b.to || "", reason: b.reason || "", createdAt: today() }); d = addDays(d, 1); } save(); return H["admin.blocks"](); },
      "admin.deleteBlock": function (b) { st.blocks = st.blocks.filter(function (x) { return x.id !== b.id; }); save(); return H["admin.blocks"](); },
      "admin.saveSettings": function (b) { Object.assign(st.settings, b.settings || {}); save(); return { settings: st.settings }; },
      "admin.saveService": function (b) { var s = b.service, ex = st.services.filter(function (x) { return x.id === s.id; })[0]; if (!s.name) throw fail("bad_name", "נא למלא שם שירות"); s.duration = +s.duration || 30; if (ex) Object.assign(ex, s); else { s.id = uid("S"); s.order = st.services.length + 1; st.services.push(s); } save(); return { services: sorted(st.services, function (x) { return x.order; }) }; },
      "admin.deleteService": function (b) { st.services = st.services.filter(function (x) { return x.id !== b.id; }); save(); return { services: st.services }; },
      "admin.saveProduct": function (b) { var p = b.product, ex = st.products.filter(function (x) { return x.id === p.id; })[0]; if (!p.name) throw fail("bad_name", "נא למלא שם מוצר"); if (ex) Object.assign(ex, p); else { p.id = uid("P"); p.order = st.products.length + 1; st.products.push(p); } save(); return { products: sorted(st.products, function (x) { return x.order; }) }; },
      "admin.deleteProduct": function (b) { st.products = st.products.filter(function (x) { return x.id !== b.id; }); save(); return { products: st.products }; },
      "admin.changePassword": function () { return { relogin: true }; }
    };
    return {
      call: function (action, p) {
        return new Promise(function (res, rej) {
          setTimeout(function () {
            try { if (!H[action]) throw fail("bad_action", "פעולה לא מוכרת"); res(Object.assign({ ok: true }, H[action](p))); }
            catch (e) { rej(e); }
          }, 180);
        });
      }
    };
  })();

  window.TopApi = { enabled: enabled, demo: demo, get: get, post: post };
  if (demo) document.documentElement.classList.add("is-demo");
})();
