# SITE.md — Top Optica (טופ אופטיקה)
> מסמך המשכיות לעיצוב ופיתוח. עודכן: 2026-11-03 (כולל מערכת תורים, ניהול ומוצרים)

## עסק וקהל
- קליניקת אופטומטריה בקניון טופ סימול, רח' צה"ל 4, קומה 21, אשדוד. האופטומטריסטית היא ליאת.
- הקהל: משפחות, ילדים, מבוגרים (מולטיפוקל), מרכיבי עדשות מגע, וסובלים ממיגרנות (משקפיים עם פילטרים).
- המטרה: לקבוע תור בטלפון או ב-WhatsApp.
- Live: https://topoptica26.github.io/top-optica/ · Repo: `topoptica26/top-optica` (branch `main`)

## טון
עברית חמה ומקצועית בפנייה ברבים ("העיניים שלכם"). הטון אישי, אבל עם תחושת יוקרה ואמינות, בלי סלנג. כותרות לדוגמה: "לראות את העולם…", "מקצועיות שרואים", "נשמח לראות אתכם".

## סגנון ויזואלי
- **פלטה** (`assets/styles.css` `:root`):
  - burgundy `#5a2a2c`, burgundy-deep `#3f1a1d`, burgundy-soft `#7a3a3e`
  - gold `#d4a73a`, gold-light `#f3dc84`, gold-dark `#a8741c`
  - `--grad-gold: linear-gradient(135deg,#f6e27a,#d4a73a 45%,#a8741c)`
  - cream `#faf5ec`, cream-2 `#f3eadb`, ink `#2b1a1b`, muted `#6d5a58`, white `#fff`
- **פונטים:** כותרות ב-`Frank Ruhl Libre` (serif, משקלים 500/700/900) עם `Playfair Display` לטקסט לועזי. גוף הטקסט ב-`Heebo` (300–700). כולם נטענים מ-Google Fonts.
- **Radius / Shadow:** `--radius:18px`, `--shadow:0 18px 40px -18px rgba(63,26,29,.35)`. `--header-h` הוא 72px, ובמובייל 64px.
- **אווירה:** בורדו וזהב על רקע קרם. נראה כמו בוטיק יוקרתי וחם, עם צילומים אמיתיים של הקליניקה (clinic-1/2.jpg, clinic.mp4).
- **אנימציות:** keyframes `float`, `spin`, `bob`, `pulse`. יש reveal בגלילה (IntersectionObserver), והווידאו מתנגן כשהוא נכנס לתצוגה. הכול מכבד `prefers-reduced-motion`.
- **ליאת (3D greeter):**
  - קובץ `assets/liat-v2.glb` דרך `model-viewer.min.js` ו-`meshopt_decoder.js`. נטענת ב-lazy load ליד כפתור ה-WhatsApp הצף.
  - אנימציות: `Liat_Wave_v2` ו-`Liat_HandsOnHips_v1`.
  - הכפתור X שומר `localStorage.liatHidden=1`, ולכן ההסתרה קבועה. `sessionStorage.liatHi` מסמן שכבר נופפה בסשן הנוכחי.
- **⚠️ הלוגו:** אסור לשנות את קבצי הלוגו המקוריים (`assets/logo.jpg`, `logo-hero.jpg`).

## מבנה העמוד (index.html)
1. `header.site-header`: לוגו, ניווט, CTA
2. `hero`
3. `#about`
4. `#services`: כרטיסים שנבנים מ-config
5. `#why`
6. `#clinic`: גלריית תמונות ווידאו
7. `#contact`: כתובת, שעות, מפה, Waze, טלפון ו-WhatsApp
8. `footer.site-footer`: זכויות יוצרים, וקרדיט "עיצוב ובניית האתר: XBYcomm" עם קישור ל-https://xbycomm.github.io/
9. רכיבים צפים: כפתור WhatsApp וליאת (`#liat`, `#liat-stage`, `#liat-close`)

## מערכת תורים, ניהול ומוצרים (נבנה 2026-11-03, מקומי, עוד לא הועלה ועוד לא נפרס)
**ארכיטקטורה (חינם, בלי שרת):**
- דפדפן (GitHub Pages) ← `fetch` ← **Google Apps Script Web App** (`backend/Code.gs`, חשבון Topoptica26@gmail.com).
- ה-Web App מחובר ל-**Google Sheet** עם 5 לשוניות: Bookings, Settings, Services, Products, Blocked.
- הוא משתמש ב-**Google Calendar** (אירוע לכל תור, `tag topoptica`) וב-**MailApp** (מייל אישור ללקוח והתראה לקליניקה).
- בקשות GET: `services`, `products`, `config`, `days`, `availability`, `ping`.
- בקשות POST נשלחות כ-`text/plain` עם JSON, כדי שלא יהיה preflight של CORS:
  - `book`, `lookup`, `cancel`
  - `admin.login`
  - `admin.*` עם token: `bootstrap`, `bookings`, `setStatus`, `addBooking`, `availability`, `addBlock`, `deleteBlock`, `saveSettings`, `saveService`, `deleteService`, `saveProduct`, `deleteProduct`, `changePassword`, `logout`.
- **מנוע הזמינות** (`computeSlots_`):
  - נקודת המוצא היא שעות הפעילות (טווח אחד או שניים ביום).
  - מורידים את התורים הקיימים, את האירועים ביומן, את החסימות ואת ה-buffer.
  - נוספים התנאים lead time ו-maxDaysAhead.
  - כל הזמנים לפי `Asia/Jerusalem`, כולל טיפול במעבר שעון (DST).
- **נגד הזמנה כפולה:** `LockService`, ובדיקה חוזרת של הזמינות בתוך הנעילה.
- **ספאם:** honeypot, בדיקת זמן מילוי, ו-rate limit דרך CacheService (לפי טלפון וגלובלי).
- **אבטחת הניהול:**
  - הסיסמה נשמרת כ-SHA-256 עם salt ו-300 איטרציות, ב-Script Properties.
  - ה-session token נשמר ב-CacheService ל-6 שעות (sliding).
  - אחרי 8 כישלונות יש נעילה ל-15 דקות.
  - החלפת סיסמה מבטלת את כל ה-sessions.

**קבצים:**
- `backend/Code.gs`, `backend/appsscript.json`.
- `backend/README-DEPLOY.md`: הוראות פריסה בעברית, צעד אחר צעד.
- `backend/test/code.test.js` עם `gas-shim.js`: בדיקות Node. מריצים `node backend/test/code.test.js`, ו-23 בדיקות עוברות.
- `assets/api.js`: לקוח ה-API, ובו גם mock של מצב הדגמה. ה-mock נוצר רק כשהדגמה פעילה.
- `assets/booking.js` ו-`assets/booking.css`:
  - מודאל הזמנה בארבעה שלבים: שירות ← יום ושעה ← פרטים ← אישור.
  - תהליך ביטול דרך `?cancel=TOKEN`.
  - הקישור "מוצרים" בתפריט, והכפתור הצף "קביעת תור".
- `products.html` ו-`assets/products.js`:
  - דף מוצרים עם סינון לפי קטגוריה ובירור בוואטסאפ לכל מוצר. ה-hook הוא `TopProducts.inquiryUrl`, שאפשר להחליף בעגלה בעתיד.
  - כשאין מוצרים מוצג "COMING SOON".
- `admin.html`, `assets/admin.js`, `assets/admin.css`:
  - דף הניהול, עם `noindex`, ואין אליו קישור מהאתר.
  - לשוניות: תורים (סטטיסטיקה, טווחים, סטטוס, תור ידני), חסימת זמנים, שעות פעילות וכללי הזמנה, שירותים, מוצרים, הגדרות וסיסמה.

**config.js (חדש):**
- `bookingApiUrl`: ריק = כמו היום, בלי שינוי נראה לעין.
- `demo: false`.
- `products: []`.

**התנהגות כש-`bookingApiUrl` ריק:**
- `[data-book]` שומר את ה-href המקורי (טלפון). למשל ה-CTA בכותרת.
- `[data-book-only]` נשאר מוסתר.
- הקישור "מוצרים" מוסתר כל עוד אין מוצרים.
- נבדק: אין שינוי ויזואלי ואין שגיאות.

**כשהוא מלא:**
- נחשפים "קביעת תור אונליין" ב-hero ובצור קשר, והגלולה הצפה "קביעת תור" בצד ימין למטה.
- כפתור הטלפון ב-hero הופך ל-outline.
- הלחיצה על ליאת פותחת את ההזמנה, והבועה שלה אומרת "אפשר לקבוע תור אונליין".

**מצב הדגמה (`?demo=1`):**
- הנתונים מזויפים ב-sessionStorage, ומוצג סרט ירוק "DEMO".
- `&demoReset=1` מאפס את הנתונים, ו-`&demoProducts=1` מוסיף מוצרים לדוגמה.
- לצילומי מסך בלבד. כבוי כברירת מחדל.

**Deep links:**
- `?book=1` או `#book`: פותח את ההזמנה.
- `&service=<id>`: מדלג ישר לשלב היום והשעה.
- `?cancel=<token>`: פותח את מסך הביטול.

**סגנון רכיבים חדשים:**
- אותה פלטה ואותם פונטים.
- מודאל: header בבורדו עם kicker "TOP OPTICA", ו-stepper עם עיגולים בזהב.
- במובייל: bottom sheet במסך מלא.
- רצועת ימים: כרטיסיות 58px, והיום הנבחר בבורדו.
- סלוטים מחולקים לבוקר, צהריים וערב. הסלוט הנבחר בזהב.
- אנימציית V בציור SVG.
- `.mark-badge`: עיגול בורדו מאחורי סמל העין על רקע בהיר. הסיבה: לעפעף העליון ב-sprite יש fill לבן.

## config.js (`window.SITE_CONFIG`)
- `address`, `wazeUrl`
- `phone`, `phoneDial`
- `whatsappDisplay`, `whatsappNumber` (בלי +), `whatsappMessage`
- `email`
- `hours[[day,hours]]`, `hoursNote`
- `mapEmbedUrl`
- `instagram`, `facebook` (ריק = מוסתר)
- `services[{icon,title,text}]`. ערכי icon אפשריים: eye | lens | glasses | sun | child | multi | pressure | topo
- `servicesArePlaceholder`

## Deploy
- GitHub Pages מ-`main`, בהעלאה דרך ממשק הווב של GitHub (`/upload/main`, `/upload/main/assets`), בחשבון topoptica26.
- לפני כל העלאה: גיבוי ל-`/workspace/backups-top-optica-*`.
- אחרי ההעלאה: לחכות שה-Actions run יסתיים, ואז להשוות md5 של הקבצים המקומיים מול האתר החי (עם cache-buster).
- לפני שמנסים להעלות שוב, לבדוק את רשימת ה-commits כדי לא ליצור כפילות.
- קבצים נוספים: `.nojekyll`, `robots.txt`, `sitemap.xml`.

## פריטים פתוחים
- [ ] **מערכת התורים:**
  - פריסת `backend/Code.gs` תחת Topoptica26@gmail.com לפי `backend/README-DEPLOY.md`.
  - להדביק את ה-URL ב-`bookingApiUrl`.
  - להעלות את הקבצים החדשים: `products.html`, `admin.html`, `assets/{api,booking,products,admin}.js`, `assets/{booking,admin}.css`.
  - להעלות גם את הקבצים המעודכנים: `index.html`, `assets/config.js`, `assets/main.js`.
  - לבדוק מקצה לקצה עם תור אמיתי.
- [ ] מחירי השירותים ב-Services ריקים. ליאת ממלאת אותם מדף הניהול, אם בכלל.
- [ ] להוסיף את `products.html` ל-sitemap.xml אחרי שיהיו מוצרים.
- [ ] להעלות את `assets/main.js`. הוסר ממנו ה-peek של ליאת במובייל, כדי שתישאר גלויה. **עדיין לא באוויר.**
- [ ] להעלות את `index.html` עם קרדיט ה-XBYcomm בפוטר. **עדיין לא באוויר.**
- [ ] שתי ההעלאות תלויות בכניסה ל-GitHub של topoptica26, כי הסיסמה שבכספת נדחית.
- [ ] Google Search Console: להוסיף property מסוג URL-prefix, להכניס את ה-meta של ה-HTML-tag ל-head, לעשות Verify ולשלוח את `sitemap.xml`.
- [ ] אפשרות: שה-X של ליאת יסתיר אותה רק לסשן הנוכחי (`sessionStorage`) ולא לתמיד.
- [ ] Instagram ו-Facebook ריקים. פרסום ממומן: לא כרגע.

## Changelog (שוחזר מהקבצים)
- **2026-11-02:**
  - הבנייה הראשונית: מבנה, פלטה ו-config.
  - נוספו טלפון ו-WhatsApp אמיתיים, כתובת, שעות, מפה ו-Waze, וגלריה עם וידאו של הקליניקה.
  - נוספה ליאת (3D) ועודכנו השירותים: לחץ תוך עיני, מיפוי קרנית, פילטרים למיגרנה ושירותים לילדים.
  - הוסרו טקסטי ה-placeholder.
  - גיבויים: 20261102-1614, 20261102-2030, index-2139.
- **2026-11-03 (מקומי, טרם הועלה):**
  - קרדיט XBYcomm בפוטר.
  - הוסר ה-peek של ליאת במובייל (גיבוי: backups-top-optica-main-1444.js).
  - נוצר מסמך SITE.md.
- **2026-11-03 (מקומי, טרם הועלה) – מערכת תורים, ניהול ומוצרים:**
  - backend ב-Apps Script עם בדיקות.
  - מודאל הזמנה, דף ניהול, ודף מוצרים במצב "בקרוב".
  - שינויים ב-index.html:
    - CTA בכותרת עם `data-book`.
    - כפתורי `data-book-only`.
    - קישור "מוצרים" מוסתר.
    - אייקון `#i-calendar`.
    - book-float.
    - טעינת booking.css, api.js ו-booking.js.
  - main.js: guard ל-`#map-box`.
  - צילומים: `/workspace/top-optica-site-shots/booking-admin/`.
  - גיבוי: `/workspace/backups-top-optica-20261103-1815`.
