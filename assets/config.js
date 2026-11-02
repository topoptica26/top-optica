/* =====================================================================
 *  TOP OPTICA – SITE CONFIG  |  כל פרטי העסק נערכים כאן בלבד
 *  ---------------------------------------------------------------
 *  Edit the values below and refresh the page. Every phone link,
 *  WhatsApp button, address, hours table and service card on the
 *  site is filled from this one object.
 *  ערכים שמתחילים ב-"05X" / "כתובת תעודכן בקרוב" הם ממלאי מקום (placeholders).
 * ===================================================================== */
window.SITE_CONFIG = {
  // כתובת הקליניקה | Clinic address (shown in Contact)
  address: "קניון טופ סימול, רחוב צה\"ל 4, קומה 21, אשדוד",

  // קישור ניווט ב-Waze | Waze navigation link
  wazeUrl: "https://waze.com/ul?q=%D7%A7%D7%A0%D7%99%D7%95%D7%9F%20%D7%A1%D7%99%D7%9E%D7%95%D7%9C%2C%20%D7%A6%D7%94%22%D7%9C%204%2C%20%D7%90%D7%A9%D7%93%D7%95%D7%93&navigate=yes",

  // טלפון לתצוגה + מספר לחיוג | Phone as displayed + dial number (digits, may start with +972)
  phone: "050-6055531",
  phoneDial: "+972506055531",                 // e.g. "+972501234567"  (empty = link scrolls to Contact)

  // וואטסאפ | WhatsApp: display text + international number WITHOUT "+" or leading 0
  whatsappDisplay: "050-6055531",
  whatsappNumber: "972506055531",            // e.g. "972501234567"   (empty = link scrolls to Contact)
  whatsappMessage: "שלום, אשמח לקבוע תור לבדיקת ראייה",

  // אימייל | Email (real)
  email: "Topoptica26@gmail.com",

  // שעות פתיחה | Opening hours (day label, hours) – edit / add / remove rows
  hours: [
    ["ראשון – חמישי", "\u202A10:00 – 19:00\u202C"]
  ],
  hoursNote: "",

  // מפה | Google Maps embed URL (Google Maps → Share → Embed a map → copy the src="..." value)
  mapEmbedUrl: "https://www.google.com/maps?q=%D7%A7%D7%A0%D7%99%D7%95%D7%9F%20%D7%A1%D7%99%D7%9E%D7%95%D7%9C%2C%20%D7%A6%D7%94%22%D7%9C%204%2C%20%D7%90%D7%A9%D7%93%D7%95%D7%93&hl=he&z=17&output=embed",

  // רשתות חברתיות | Social links (leave "" to hide)
  instagram: "",
  facebook: "",

  // שירותים | Services cards (EDITABLE). icon: eye | lens | glasses | sun | child | multi | pressure | topo
  services: [
    { icon: "eye",     title: "בדיקות ראייה ממוחשבות",     text: "בדיקת ראייה מקיפה ומדויקת בציוד ממוחשב מתקדם, כולל הסבר מלא על התוצאות." },
    { icon: "lens",    title: "עדשות מגע",                  text: "התאמה מקצועית של עדשות מגע יומיות, חודשיות וטוריות, כולל הדרכה ומעקב." },
    { icon: "glasses", title: "משקפי ראייה ומסגרות",        text: "מבחר מסגרות מעוצבות ועדשות איכותיות, בהתאמה אישית לפנים ולסגנון שלכם. בנוסף, משקפיים עם פילטרים מיוחדים לסובלים ממיגרנות." },
    { icon: "sun",     title: "משקפי שמש",                  text: "משקפי שמש אופנתיים עם הגנת UV מלאה – גם עם מספר אופטי." },
    { icon: "child",   title: "בדיקות ראייה לילדים",        text: "בדיקה סבלנית ומותאמת לילדים, לזיהוי מוקדם של בעיות ראייה. כולל התאמת משקפיים טיפוליים ועדשות מגע להאטת התקדמות קוצר ראייה." },
    { icon: "multi",   title: "התאמת עדשות מולטיפוקל",      text: "התאמה מדויקת של עדשות מולטיפוקל לראייה נוחה בכל המרחקים." },
    { icon: "pressure", title: "בדיקת לחץ תוך עיני",        text: "מדידת הלחץ בתוך העין כחלק משגרת בריאות העין, לאיתור מוקדם של שינויים והפניה לבירור במידת הצורך." },
    { icon: "topo",    title: "מיפוי קרנית",                text: "מיפוי מפורט של פני הקרנית, המסייע להתאמה מדויקת של עדשות מגע ולמעקב אחר מצב הקרנית." }
  ],
  servicesArePlaceholder: true   // set to false to hide the "editable" badges on service cards
};
