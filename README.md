# Top Optica | טופ אופטיקה – אתר הקליניקה

אתר סטטי (HTML/CSS/JS בלבד, ללא build) עבור **Top Optica – Optometry Clinic | קליניקה לאופטומטריה**.

## עריכת פרטי העסק (עברית)
כל הפרטים נמצאים בקובץ אחד: **`assets/config.js`** (אובייקט `SITE_CONFIG`).
- `address` – כתובת (כרגע: "כתובת תעודכן בקרוב")
- `phone` / `phoneDial` – טלפון לתצוגה ומספר לחיוג (למשל `+972501234567`)
- `whatsappDisplay` / `whatsappNumber` – וואטסאפ (מספר בינלאומי ללא + וללא 0, למשל `972501234567`)
- `email` – אימייל (Topoptica26@gmail.com)
- `hours` – שעות פתיחה (שורות של [יום, שעות])
- `mapEmbedUrl` – קישור הטמעה של Google Maps (שתף ← הטמעת מפה ← העתקת ערך ה-src)
- `services` – כרטיסי השירותים; `servicesArePlaceholder: false` מסתיר את תגיות "ניתן לעריכה"
- `instagram` / `facebook` – קישורים לרשתות (ריק = מוסתר)

טקסט "אודות" נמצא ב-`index.html` (מסומן בהערה `EDITABLE`). את `og:url` יש לעדכן לכתובת האתר לאחר העלייה.

## Editing (English)
All business details live in **`assets/config.js`** (`SITE_CONFIG`). Every phone link, WhatsApp button (incl. the floating one), address, email, hours table, map and service card is filled from it. While `phoneDial` / `whatsappNumber` are empty, those buttons scroll to the Contact section instead of dialing.

## Files
```
index.html            page markup (RTL Hebrew)
assets/config.js      ← edit business details here
assets/main.js        behaviour (bindings, mobile menu, animations)
assets/styles.css     design (burgundy / gold / cream)
assets/logo.jpg       original logo (unmodified copy)
assets/eye-mark.svg   transparent SVG recreation of the eye mark
assets/favicon.svg    favicon
.nojekyll             tells GitHub Pages to serve files as-is
```

## GitHub Pages
1. Push these files to the root of a repository (e.g. `top-optica`).
2. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
3. After ~1 minute the site is live at `https://<username>.github.io/<repo>/`.
GitHub Pages serves `index.html` as the home page; `.nojekyll` disables Jekyll processing so all files are served exactly as they are. All paths are relative, so the site works from a sub-path or a custom domain.
